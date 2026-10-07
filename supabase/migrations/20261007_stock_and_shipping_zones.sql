-- 1) المخزون: يرجع تلقائياً لما الطلب يتلغي أو دفع أونلاين يفشل، ويتخصم تاني لو الطلب رجع شغال
-- 2) مصاريف الشحن حسب المحافظة

-- ========== المخزون ==========
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_released BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.order_holds_stock(p_status TEXT, p_payment_status TEXT, p_payment_method TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(p_status, '') <> 'cancelled'
     AND NOT (COALESCE(p_payment_method, '') = 'paymob' AND COALESCE(p_payment_status, '') IN ('failed', 'refunded'));
$$;

CREATE OR REPLACE FUNCTION public.sync_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_was_holding BOOLEAN;
  v_now_holding BOOLEAN;
  v_item RECORD;
BEGIN
  v_was_holding := NOT OLD.stock_released AND order_holds_stock(OLD.status, OLD.payment_status, OLD.payment_method);
  v_now_holding := order_holds_stock(NEW.status, NEW.payment_status, NEW.payment_method);

  -- الطلب اتلغى / الدفع فشل: رجّع الكميات للمخزون
  IF v_was_holding AND NOT v_now_holding THEN
    FOR v_item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id AND product_id IS NOT NULL LOOP
      UPDATE products
      SET stock_quantity = COALESCE(stock_quantity, 0) + v_item.quantity,
          is_in_stock = TRUE,
          updated_at = NOW()
      WHERE id = v_item.product_id;
    END LOOP;
    NEW.stock_released := TRUE;

  -- الطلب رجع شغال (مثلاً اتدفع بعد محاولة فاشلة): اخصم تاني
  ELSIF OLD.stock_released AND v_now_holding THEN
    FOR v_item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id AND product_id IS NOT NULL LOOP
      UPDATE products
      SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - v_item.quantity, 0),
          is_in_stock = GREATEST(COALESCE(stock_quantity, 0) - v_item.quantity, 0) > 0,
          updated_at = NOW()
      WHERE id = v_item.product_id;
    END LOOP;
    NEW.stock_released := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_sync_stock
BEFORE UPDATE OF status, payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_order_stock();

REVOKE EXECUTE ON FUNCTION public.sync_order_stock() FROM anon, authenticated, public;

-- ========== الشحن حسب المحافظة ==========
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id SERIAL PRIMARY KEY,
  governorate TEXT NOT NULL UNIQUE,
  fee NUMERIC NOT NULL DEFAULT 0 CHECK (fee >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active shipping zones" ON public.shipping_zones
  FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin());
CREATE POLICY "Admins insert shipping zones" ON public.shipping_zones
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update shipping zones" ON public.shipping_zones
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- المحافظات الـ 27 بسعر الشحن الحالي كبداية (تتعدّل من لوحة التحكم)
INSERT INTO public.shipping_zones (governorate, fee, sort_order)
SELECT g.name, COALESCE((SELECT shipping_fee FROM public.site_settings WHERE id = 1), 0), g.ord
FROM (VALUES
  ('القاهرة', 1), ('الجيزة', 2), ('القليوبية', 3), ('الإسكندرية', 4), ('البحيرة', 5),
  ('مطروح', 6), ('دمياط', 7), ('الدقهلية', 8), ('كفر الشيخ', 9), ('الغربية', 10),
  ('المنوفية', 11), ('الشرقية', 12), ('بورسعيد', 13), ('الإسماعيلية', 14), ('السويس', 15),
  ('شمال سيناء', 16), ('جنوب سيناء', 17), ('الفيوم', 18), ('بني سويف', 19), ('المنيا', 20),
  ('أسيوط', 21), ('سوهاج', 22), ('قنا', 23), ('الأقصر', 24), ('أسوان', 25),
  ('البحر الأحمر', 26), ('الوادي الجديد', 27)
) AS g(name, ord)
ON CONFLICT (governorate) DO NOTHING;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_governorate TEXT;

-- نسخة جديدة من إنشاء الطلب فيها المحافظة (الشحن بيتحسب على السيرفر)
CREATE OR REPLACE FUNCTION public.place_guest_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_customer_address TEXT,
  p_customer_city TEXT,
  p_customer_notes TEXT,
  p_items JSONB,
  p_coupon_code TEXT,
  p_payment_method TEXT,
  p_governorate TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_product products%ROWTYPE;
  v_subtotal NUMERIC := 0;
  v_shipping_fee NUMERIC := 0;
  v_discount_amount NUMERIC := 0;
  v_total_amount NUMERIC := 0;
  v_quantity INTEGER;
  v_unit_price NUMERIC;
  v_line_total NUMERIC;
  v_coupon_result RECORD;
  v_settings site_settings%ROWTYPE;
  v_zone shipping_zones%ROWTYPE;
  v_has_zones BOOLEAN;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'عربة التسوق فارغة.';
  END IF;

  SELECT * INTO v_settings FROM site_settings WHERE id = 1 LIMIT 1;

  SELECT EXISTS (SELECT 1 FROM shipping_zones WHERE is_active) INTO v_has_zones;

  IF v_has_zones THEN
    SELECT * INTO v_zone
    FROM shipping_zones
    WHERE is_active AND governorate = trim(COALESCE(p_governorate, ''))
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'من فضلك اختار المحافظة.';
    END IF;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'id')::uuid AND is_visible = true
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'أحد المنتجات غير متاح.';
    END IF;

    v_quantity := GREATEST(COALESCE((v_item->>'quantity')::INTEGER, 1), 1);

    IF NOT v_product.is_in_stock THEN
      RAISE EXCEPTION 'المنتج "%" غير متوفر حالياً.', v_product.title;
    END IF;

    IF COALESCE(v_product.stock_quantity, 0) >= 0
      AND v_quantity > COALESCE(v_product.stock_quantity, 0) THEN
      RAISE EXCEPTION 'الكمية المطلوبة من "%" تتجاوز المخزون المتاح (%).',
        v_product.title,
        COALESCE(v_product.stock_quantity, 0);
    END IF;

    v_unit_price := COALESCE(v_product.sale_price, v_product.price, v_product.regular_price, 0);
    v_subtotal := v_subtotal + v_unit_price * v_quantity;
  END LOOP;

  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon_result FROM validate_coupon(p_coupon_code, v_subtotal) LIMIT 1;

    IF v_coupon_result.is_valid THEN
      v_discount_amount := COALESCE(v_coupon_result.discount_amount, 0);
    END IF;
  END IF;

  IF v_settings.enable_free_shipping
    AND COALESCE(v_settings.free_shipping_min_amount, 0) > 0
    AND v_subtotal >= v_settings.free_shipping_min_amount THEN
    v_shipping_fee := 0;
  ELSIF v_has_zones THEN
    v_shipping_fee := COALESCE(v_zone.fee, 0);
  ELSE
    v_shipping_fee := COALESCE(v_settings.shipping_fee, 0);
  END IF;

  v_total_amount := GREATEST(v_subtotal - v_discount_amount, 0) + v_shipping_fee;

  v_order_number := 'TT-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::TEXT, 4, '0');

  INSERT INTO orders (
    order_number, customer_name, customer_phone, customer_email, customer_address,
    customer_city, customer_governorate, customer_notes, subtotal, shipping_fee,
    discount_amount, total_amount, coupon_code, status, payment_status, payment_method
  )
  VALUES (
    v_order_number,
    trim(p_customer_name),
    trim(p_customer_phone),
    NULLIF(trim(COALESCE(p_customer_email, '')), ''),
    trim(p_customer_address),
    NULLIF(trim(COALESCE(p_customer_city, '')), ''),
    NULLIF(trim(COALESCE(p_governorate, '')), ''),
    NULLIF(trim(COALESCE(p_customer_notes, '')), ''),
    v_subtotal,
    v_shipping_fee,
    v_discount_amount,
    v_total_amount,
    NULLIF(trim(COALESCE(p_coupon_code, '')), ''),
    'new',
    'pending',
    CASE
      WHEN trim(COALESCE(p_payment_method, '')) IN ('cash_on_delivery', 'paymob', 'vodafone_cash', 'instapay')
        THEN trim(p_payment_method)
      ELSE 'cash_on_delivery'
    END
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'id')::uuid LIMIT 1;

    v_quantity := GREATEST(COALESCE((v_item->>'quantity')::INTEGER, 1), 1);
    v_unit_price := COALESCE(v_product.sale_price, v_product.price, v_product.regular_price, 0);
    v_line_total := v_unit_price * v_quantity;

    INSERT INTO order_items (
      order_id, product_id, product_title, product_sku, product_image_url,
      quantity, unit_price, line_total
    )
    VALUES (
      v_order_id, v_product.id, v_product.title, v_product.sku, v_product.image_url,
      v_quantity, v_unit_price, v_line_total
    );

    UPDATE products
    SET
      stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - v_quantity, 0),
      is_in_stock = CASE
        WHEN GREATEST(COALESCE(stock_quantity, 0) - v_quantity, 0) <= 0 THEN false
        ELSE is_in_stock
      END,
      updated_at = NOW()
    WHERE id = v_product.id;
  END LOOP;

  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' AND v_discount_amount > 0 THEN
    UPDATE coupons
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE upper(code) = upper(trim(p_coupon_code));
  END IF;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_guest_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ========== إلغاء طلبات الكارت اللي ماتدفعتش خلال ساعتين (كل 15 دقيقة) ==========
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.expire_unpaid_online_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE payment_method = 'paymob'
    AND payment_status = 'pending'
    AND status = 'new'
    AND created_at < NOW() - INTERVAL '2 hours'
    AND created_at > TIMESTAMPTZ '2026-10-07 15:00:00+00';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_unpaid_online_orders() FROM anon, authenticated, public;

SELECT cron.schedule('expire-unpaid-online-orders', '*/15 * * * *', $$SELECT public.expire_unpaid_online_orders();$$);
