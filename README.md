# Town Tech — Client Website & Dashboard

متجر إلكتروني عربي (RTL) لأنظمة المراقبة والإلكترونيات، مع لوحة تحكم كاملة.

## المتطلبات

- Node.js 20+
- حساب [Supabase](https://supabase.com) (Postgres + Auth + Storage)

## الإعداد المحلي

```bash
npm install
cp .env.example .env
# عدّل .env بقيم مشروع Supabase
npm run dev
```

## متغيرات البيئة

| المتغير | الوصف |
|---------|--------|
| `VITE_SUPABASE_URL` | رابط مشروع Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | المفتاح العام (anon key) |

## قاعدة البيانات (Supabase)

1. **مشروع جديد:** شغّل `supabase/schema.sql` من SQL Editor.
2. **مشروع قائم:** شغّل الترحيلات حسب الحاجة:
   - `add_category_image_url.sql`
   - `add_payment_settings_and_order_payment_method.sql`
   - `add_about_page_settings.sql`
   - `add_contact_page_settings.sql`
   - `add_our_work_page_settings.sql`
   - `add_contact_messages.sql`
   - `add_admin_users.sql`
   - `update_place_guest_order_stock.sql`
3. **بيانات أولية (اختياري):** `seed_site_content.sql`

### صلاحيات الأدمن

بعد إنشاء مستخدم في Supabase Auth، أضفه لجدول المديرين:

```sql
INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';
```

بدون هذا السطر لن يستطيع أي حساب الدخول للوحة التحكم.

### Storage buckets

أنشئ bucketين **Public** (قراءة عامة):

| Bucket | الاستخدام |
|--------|-----------|
| `product-images` | صور المنتجات والأقسام |
| `site-assets` | الشعار، الهيرو، صور about/our-work |

**الإعداد في Supabase:** Storage → New bucket → Public → فعّل القراءة العامة.

### Edge Function (Paymob)

الدفع الإلكتروني عبر Paymob يحتاج Edge Function باسم `paymob-session` (غير مضمّنة في المستودع). فعّل Paymob من **إعدادات الموقع** في لوحة التحكم.

## النشر على Vercel

1. اربط المستودع بـ Vercel.
2. أضف `VITE_SUPABASE_URL` و `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Build command: `npm run build`
4. Output directory: `dist`

## أوامر مفيدة

```bash
npm run dev      # تطوير محلي
npm run build    # بناء للإنتاج
npm run preview  # معاينة البناء
```

## لوحة التحكم

- المسار: `/admin/login`
- أنشئ مستخدم في Supabase Auth ثم أضفه في `admin_users` (انظر أعلاه).

## هيكل المشروع

```
src/
  pages/       → صفحات الموقع
  admin/       → لوحة التحكم
  components/  → Navbar, Footer, carousels
  hooks/       → جلب البيانات
  lib/         → cart, supabase, defaults
supabase/      → SQL schema + migrations
```
