-- تنبيهات الطلبات الجديدة (تليجرام / إيميل) عن طريق Edge Function: order-notify

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  telegram_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  telegram_bot_token TEXT,
  telegram_chat_ids TEXT,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  resend_api_key TEXT,
  email_from TEXT,
  email_to TEXT,
  notify_on_paid BOOLEAN NOT NULL DEFAULT TRUE,
  webhook_secret TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_settings FROM anon;

CREATE POLICY "Admins read notification settings" ON public.notification_settings
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins insert notification settings" ON public.notification_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update notification settings" ON public.notification_settings
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.notification_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.notify_order_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
  v_event TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'new_order';
  ELSIF NEW.payment_status = 'paid' AND COALESCE(OLD.payment_status, '') <> 'paid' THEN
    v_event := 'paid';
  ELSE
    RETURN NEW;
  END IF;

  SELECT webhook_secret INTO v_secret FROM notification_settings WHERE id = 1;

  PERFORM net.http_post(
    url := 'https://wzayjdislqyqnqsmexyq.supabase.co/functions/v1/order-notify',
    body := jsonb_build_object('order_id', NEW.id, 'event', v_event),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', COALESCE(v_secret, ''))
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- التنبيه مايوقفش الطلب أبداً
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_order_event() FROM anon, authenticated, public;

CREATE TRIGGER orders_notify_insert
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_event();

CREATE TRIGGER orders_notify_paid
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_event();
