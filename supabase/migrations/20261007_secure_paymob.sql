-- تأمين بوابة الدفع Paymob (تم تطبيقه على Supabase بتاريخ 2026-10-07)
-- 1) نقل المفاتيح السرية من site_settings (المقروءة للعامة) إلى جدول خاص بالأدمن فقط
-- 2) منع أي مستخدم مسجّل (غير أدمن) من تعديل إعدادات الموقع
-- 3) إصلاحات Supabase Advisors

CREATE TABLE IF NOT EXISTS public.payment_secrets (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  paymob_secret_key TEXT,
  paymob_hmac_secret TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_secrets FROM anon;

CREATE POLICY "Admins read payment secrets" ON public.payment_secrets
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins insert payment secrets" ON public.payment_secrets
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update payment secrets" ON public.payment_secrets
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.payment_secrets (id, paymob_secret_key, paymob_hmac_secret)
SELECT 1, NULLIF(trim(paymob_api_key), ''), NULLIF(trim(paymob_hmac_secret), '')
FROM public.site_settings
WHERE id = 1
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;

ALTER FUNCTION public.set_reviews_updated_at() SET search_path = public;
ALTER FUNCTION public.normalize_phone_key(text) SET search_path = public;

-- التعديل على site_settings للأدمن فقط
ALTER POLICY "Authenticated users can insert site settings" ON public.site_settings WITH CHECK (public.is_admin());
ALTER POLICY "Authenticated users can update site settings" ON public.site_settings USING (public.is_admin()) WITH CHECK (public.is_admin());

-- مسح النسخة المكشوفة من المفاتيح بعد نقلها
UPDATE public.site_settings SET paymob_api_key = NULL, paymob_hmac_secret = NULL
WHERE id = 1 AND EXISTS (SELECT 1 FROM public.payment_secrets WHERE id = 1);
