export const CONTACT_PAGE = {
  title: 'تواصل معنا الآن',
  subtitle: 'نحن هنا من أجلك ! فريقنا جاهز لمساعدتك .',
}

export const STORE_PHONES = ['01112826999', '01080662234', '01080662235']

export const STORE_EMAIL = 'towntech.elminya@gmail.com'

export const STORE_WHATSAPP = '201112826999'

export const STORE_FACEBOOK_URL = 'https://www.facebook.com/share/1BjCuu6tDt/'

export const STORE_BRANCHES = [
  {
    label: 'الفرع الأول',
    address: 'شارع الحسيني بحري المحمدي بجوار محل اديب',
  },
  {
    label: 'الفرع الثاني',
    address:
      'سكة تله امام المعلب المفتوح بجوار المدرسة الفنية، المنيا، مصر، 61514',
  },
]

export const STORE_ABOUT_TEXT = `شركة رائدة في مجال أنظمة المراقبة الأمنية المتكاملة منذ عام 2022.
في خلال الفترة دي قدرنا نخدم أكثر من 5000 فرد وأكثر من 200 مؤسسة. بتقديم أحدث تكنولوجيا الكاميرات بالتعاون مع كبرى الشركات العالمية، مع تفوقنا بتقديم أطول فترة ضمان في السوق وخدمات دعم فني متميزة. نضمن لك أعلى مستويات الأمان بأقل تكلفة اقتصادية منافسة.`

export const STORE_SEO_DESCRIPTION_LINES = [
  'شركة رائدة في مجال أنظمة المراقبة الأمنية المتكاملة منذ عام 2022، خدمنا أكثر من 5000 فرد و200 مؤسسة.',
  'نقدّم أحدث تكنولوجيا الكاميرات بأطول فترة ضمان في السوق ودعم فني متميز بأسعار منافسة.',
]

export const STORE_SEO_DESCRIPTION = STORE_SEO_DESCRIPTION_LINES.join(' ')

export const STORE_FOOTER_DESCRIPTION =
  'متجرك الموثوق لأنظمة المراقبة والإلكترونيات بجودة عالية وأسعار منافسة وضمان مميز.'

export const RETURN_POLICY_TEXT = `سياسة الاسترجاع
• يمكن الاسترجاع خلال 3 أيام من تاريخ الشراء.
• يشترط وجود الفاتورة الأصلية.

سياسة الاستبدال
• يمكن الاستبدال خلال 14 يوماً من تاريخ الشراء.
• يشترط وجود الفاتورة الأصلية.`

export const RETURN_POLICY_SUMMARY =
  'استرجاع خلال 3 أيام واستبدال خلال 14 يوماً مع وجود الفاتورة'

export const PRIVACY_POLICY_TEXT = `سياسة الخصوصية

• نجمع بيانات التواصل (الاسم، الهاتف، البريد) لإتمام الطلبات والرد على استفساراتك.
• لا نشارك بياناتك مع أطراف خارجية إلا لأغراض الدفع أو الشحن عند الحاجة.
• يمكنك التواصل معنا لطلب تعديل أو حذف بياناتك الشخصية.

للاستفسارات: ${STORE_EMAIL}`

export const SHIPPING_POLICY_TEXT = `سياسة الشحن

• يتم شحن الطلبات داخل مصر عبر شركات الشحن المعتمدة أو مندوب التوصيل.
• مدة التوصيل تتراوح عادة بين 1–5 أيام عمل حسب المحافظة.
• رسوم الشحن تظهر في عربة التسوق وصفحة إتمام الطلب قبل تأكيد الطلب.
• الشحن المجاني يُطبّق تلقائياً عند الوصول للحد الأدنى المحدد في إعدادات المتجر.

للاستفسار عن شحن طلبك: ${STORE_PHONES[0]}`

export const TERMS_TEXT = `الشروط والأحكام

• باستخدامك للموقع فإنك توافق على هذه الشروط وسياسات المتجر.
• الأسعار والعروض قابلة للتغيير دون إشعار مسبق.
• يلتزم العميل بتقديم بيانات تواصل وعنوان صحيحين لإتمام الطلب.
• يحق للمتجر إلغاء أي طلب في حالة عدم توفر المنتج أو وجود خطأ في السعر.

للتواصل: ${STORE_EMAIL}`

export function formatStoreAddress() {
  return STORE_BRANCHES.map(
    (branch) => `${branch.label}: ${branch.address}`
  ).join('\n')
}

export function formatAboutPageContent() {
  const branches = STORE_BRANCHES.map(
    (branch) => `${branch.label}: ${branch.address}`
  ).join('\n')

  return `${STORE_ABOUT_TEXT}

فروعنا
${branches}

للتواصل
البريد الإلكتروني: ${STORE_EMAIL}
${STORE_PHONES.map((phone) => `هاتف: ${phone}`).join('\n')}`
}

export function formatContactPageContent() {
  return `تواصل معنا للاستفسار عن المنتجات والأسعار والطلبات.

${STORE_BRANCHES.map((branch) => `${branch.label}:\n${branch.address}`).join('\n\n')}

البريد الإلكتروني: ${STORE_EMAIL}`
}

export const SITE_PAGE_DEFAULTS = {
  'return-policy': {
    title: 'سياسة الاستبدال والاسترجاع',
    content: RETURN_POLICY_TEXT,
    page_type: 'policy',
  },
  'privacy-policy': {
    title: 'سياسة الخصوصية',
    content: PRIVACY_POLICY_TEXT,
    page_type: 'policy',
  },
  'shipping-policy': {
    title: 'سياسة الشحن',
    content: SHIPPING_POLICY_TEXT,
    page_type: 'policy',
  },
  terms: {
    title: 'الشروط والأحكام',
    content: TERMS_TEXT,
    page_type: 'legal',
  },
}

export function getPageDefault(slug) {
  return SITE_PAGE_DEFAULTS[slug] || null
}

export function toTelHref(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('0')) return `tel:+20${digits.slice(1)}`
  return `tel:+${digits}`
}

export function toWhatsAppHref(number = STORE_WHATSAPP) {
  return `https://wa.me/${String(number).replace(/\D/g, '')}`
}
