-- تنظيف (لم يُطبَّق بعد): شغّله من Supabase → SQL Editor بعد نشر نسخة الموقع الجديدة على Vercel
-- يحذف الأعمدة القديمة الفاضية ودالة dummy قديمة وسياسة مكررة

DROP FUNCTION IF EXISTS public.create_paymob_session(uuid, text);
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS paymob_api_key;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS paymob_hmac_secret;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings; -- مكررة مع "Public read site settings"
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
