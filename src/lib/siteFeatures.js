// إعدادات مميزات الموقع — تتحكم فيها من لوحة التحكم ← إعدادات الموقع ← مميزات الموقع
// تُحفظ في عمود site_settings.site_features (JSON)

export const DEFAULT_TRUST_BADGES = [
  { icon: 'shield', title: 'ضمان حقيقي', text: 'على كل المنتجات' },
  { icon: 'truck', title: 'توصيل سريع', text: 'لكل المحافظات' },
  { icon: 'cash', title: 'الدفع عند الاستلام', text: 'أو أونلاين بأمان' },
  { icon: 'support', title: 'دعم فني', text: 'قبل وبعد البيع' },
]

export const DEFAULT_SITE_FEATURES = {
  // الأقسام
  hide_empty_categories: true,

  // الصفحة الرئيسية
  home_trust_strip_enabled: true,
  home_category_grid_enabled: true,
  home_category_grid_title: 'تسوق حسب القسم',
  home_intro_enabled: true,
  home_banners_enabled: true,
  home_banners: [], // [{ image_url, link, alt }] لحد 3 بانرات

  // شعارات طرق الدفع الرسمية (اختياري) — لو فاضية بتظهر أيقونة
  payment_logos: {},
  product_payment_methods_enabled: true,

  // شريط الإعلان أعلى الموقع
  announcement_enabled: false,
  announcement_text: '',
  announcement_link: '',

  // واتساب
  whatsapp_button_enabled: true,
  whatsapp_button_label: 'تواصل معنا',
  whatsapp_default_message: 'مرحباً، عندي استفسار عن منتجاتكم',
  product_whatsapp_enabled: true,
  product_whatsapp_message: 'مرحباً، أريد الاستفسار عن المنتج: {product}\n{link}',

  // صفحة المنتج
  sticky_buy_bar_enabled: true,
  show_stock_quantity: true,
  trust_badges_enabled: true,
  trust_badges: DEFAULT_TRUST_BADGES,
  related_products_enabled: true,
  related_products_count: 10,

  // كروت المنتجات
  discount_badge_style: 'amount', // amount | percent
}

export function getSiteFeatures(settings) {
  const raw = settings?.site_features

  const stored =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}

  const merged = { ...DEFAULT_SITE_FEATURES, ...stored }

  if (!merged.payment_logos || typeof merged.payment_logos !== 'object') {
    merged.payment_logos = {}
  }

  if (!Array.isArray(merged.home_banners)) {
    merged.home_banners = []
  }

  if (!Array.isArray(merged.trust_badges)) {
    merged.trust_badges = DEFAULT_TRUST_BADGES
  }

  merged.related_products_count = Math.min(
    Math.max(Number(merged.related_products_count) || 10, 2),
    20
  )

  return merged
}

export function buildProductWhatsAppMessage(template, product, url) {
  return String(template || DEFAULT_SITE_FEATURES.product_whatsapp_message)
    .replaceAll('{product}', product?.title || '')
    .replaceAll('{sku}', product?.sku || '')
    .replaceAll('{link}', url || '')
}
