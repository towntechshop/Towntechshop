import { DEFAULT_TRUST_BADGES, getSiteFeatures } from '../../lib/siteFeatures'
import { Field, SectionTitle } from './AdminFormFields'

const inputClass =
  'w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white'

const BADGE_ICONS = [
  { value: 'shield', label: 'درع (ضمان)' },
  { value: 'truck', label: 'عربية (توصيل)' },
  { value: 'cash', label: 'فلوس (دفع)' },
  { value: 'support', label: 'سماعة (دعم)' },
  { value: 'star', label: 'نجمة (جودة)' },
  { value: 'tools', label: 'عدة (تركيب)' },
]

function Toggle({ checked, onChange, title, description }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 bg-slate-50 cursor-pointer hover:border-slate-300 transition">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="w-5 h-5 mt-0.5 flex-shrink-0"
      />
      <div>
        <p className="font-black text-slate-900">{title}</p>
        {description && (
          <p className="text-slate-500 text-sm font-bold leading-6">{description}</p>
        )}
      </div>
    </label>
  )
}

function Group({ title, children }) {
  return (
    <div className="border-t border-slate-100 pt-5 mt-5 first:border-t-0 first:pt-0 first:mt-0">
      <h3 className="font-black text-slate-950 mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export default function SiteFeaturesSection({ value, onChange }) {
  const features = getSiteFeatures({ site_features: value })

  const update = (key, nextValue) => {
    onChange({ ...features, [key]: nextValue })
  }

  const updateBadge = (index, key, nextValue) => {
    const badges = features.trust_badges.map((badge, badgeIndex) =>
      badgeIndex === index ? { ...badge, [key]: nextValue } : badge
    )
    update('trust_badges', badges)
  }

  const addBadge = () => {
    if (features.trust_badges.length >= 6) return
    update('trust_badges', [
      ...features.trust_badges,
      { icon: 'star', title: '', text: '' },
    ])
  }

  const removeBadge = (index) => {
    update(
      'trust_badges',
      features.trust_badges.filter((_, badgeIndex) => badgeIndex !== index)
    )
  }

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
      <SectionTitle
        title="مميزات الموقع"
        description="شغّل أو اقفل أجزاء الموقع وعدّل نصوصها. التغييرات تظهر للعملاء بعد الحفظ."
      />

      <Group title="الأقسام">
        <Toggle
          checked={features.hide_empty_categories}
          onChange={(checked) => update('hide_empty_categories', checked)}
          title="إخفاء الأقسام الفاضية تلقائياً"
          description="أي قسم مفيهوش منتجات ظاهرة مش هيظهر للعميل، وأول ما تضيف له منتج هيظهر لوحده. لإخفاء قسم معيّن حتى لو فيه منتجات استخدم زرار (إخفاء) من صفحة الأقسام."
        />
      </Group>

      <Group title="الصفحة الرئيسية">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle
            checked={features.home_trust_strip_enabled}
            onChange={(checked) => update('home_trust_strip_enabled', checked)}
            title="شريط مميزات المتجر تحت البانر"
            description="بيعرض نفس (مميزات المتجر) اللي تحت في الصفحة دي."
          />
          <Toggle
            checked={features.home_category_grid_enabled}
            onChange={(checked) => update('home_category_grid_enabled', checked)}
            title="شبكة الأقسام (تسوق حسب القسم)"
            description="كل قسم فيه منتجات بيظهر كمربع بصورة وعدد المنتجات."
          />
          <Toggle
            checked={features.home_intro_enabled}
            onChange={(checked) => update('home_intro_enabled', checked)}
            title="نبذة عن المتجر في الصفحة الرئيسية"
          />
          <Field label="عنوان شبكة الأقسام">
            <input
              type="text"
              value={features.home_category_grid_title}
              onChange={(event) => update('home_category_grid_title', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Group>

      <Group title="شريط الإعلان أعلى الموقع">
        <Toggle
          checked={features.announcement_enabled}
          onChange={(checked) => update('announcement_enabled', checked)}
          title="إظهار شريط الإعلان"
          description="مثال: خصم 10% على كل الكاميرات حتى نهاية الشهر"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="نص الإعلان">
            <input
              type="text"
              value={features.announcement_text}
              onChange={(event) => update('announcement_text', event.target.value)}
              placeholder="شحن مجاني للطلبات فوق 2000 جنيه"
              className={inputClass}
            />
          </Field>
          <Field label="رابط عند الضغط (اختياري)" hint="مثال: /products أو /category/cameras">
            <input
              type="text"
              value={features.announcement_link}
              onChange={(event) => update('announcement_link', event.target.value)}
              placeholder="/products"
              className={`${inputClass} text-left`}
              dir="ltr"
            />
          </Field>
        </div>
      </Group>

      <Group title="واتساب">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle
            checked={features.whatsapp_button_enabled}
            onChange={(checked) => update('whatsapp_button_enabled', checked)}
            title="زرار واتساب العائم"
            description="يظهر في كل صفحات الموقع. الرقم من خانة (واتساب) في بيانات التواصل."
          />
          <Toggle
            checked={features.product_whatsapp_enabled}
            onChange={(checked) => update('product_whatsapp_enabled', checked)}
            title="زرار (اسأل عن المنتج) في صفحة المنتج"
            description="يفتح واتساب برسالة جاهزة فيها اسم المنتج ورابطه."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="نص زرار واتساب العائم">
            <input
              type="text"
              value={features.whatsapp_button_label}
              onChange={(event) => update('whatsapp_button_label', event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="الرسالة الافتراضية لزرار واتساب العائم">
            <input
              type="text"
              value={features.whatsapp_default_message}
              onChange={(event) => update('whatsapp_default_message', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          label="رسالة (اسأل عن المنتج)"
          hint="استخدم {product} لاسم المنتج و {sku} لكود المنتج و {link} لرابط المنتج"
        >
          <textarea
            rows={2}
            value={features.product_whatsapp_message}
            onChange={(event) => update('product_whatsapp_message', event.target.value)}
            className={inputClass}
          />
        </Field>
      </Group>

      <Group title="صفحة المنتج">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle
            checked={features.sticky_buy_bar_enabled}
            onChange={(checked) => update('sticky_buy_bar_enabled', checked)}
            title="شريط الشراء الثابت على الموبايل"
            description="السعر وزرار (أضف للسلة) يفضلوا ظاهرين تحت الشاشة."
          />
          <Toggle
            checked={features.show_stock_quantity}
            onChange={(checked) => update('show_stock_quantity', checked)}
            title="إظهار الكمية المتاحة في المخزون"
            description="لو اتقفل هيظهر (متوفر) بس من غير رقم."
          />
          <Toggle
            checked={features.related_products_enabled}
            onChange={(checked) => update('related_products_enabled', checked)}
            title="منتجات مشابهة تحت المنتج"
          />
          <Field label="عدد المنتجات المشابهة">
            <input
              type="number"
              min={2}
              max={20}
              value={features.related_products_count}
              onChange={(event) => update('related_products_count', Number(event.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
      </Group>

      <Group title="مميزات المتجر (تظهر في صفحة المنتج)">
        <Toggle
          checked={features.trust_badges_enabled}
          onChange={(checked) => update('trust_badges_enabled', checked)}
          title="إظهار مميزات المتجر"
          description="زي الضمان والتوصيل والدفع عند الاستلام. بتزوّد ثقة العميل قبل الشراء."
        />

        <div className="space-y-3">
          {features.trust_badges.map((badge, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr_auto] gap-3 items-end rounded-2xl border border-slate-200 p-3"
            >
              <Field label="الأيقونة">
                <select
                  value={badge.icon}
                  onChange={(event) => updateBadge(index, 'icon', event.target.value)}
                  className={inputClass}
                >
                  {BADGE_ICONS.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="العنوان">
                <input
                  type="text"
                  value={badge.title}
                  onChange={(event) => updateBadge(index, 'title', event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="الوصف">
                <input
                  type="text"
                  value={badge.text}
                  onChange={(event) => updateBadge(index, 'text', event.target.value)}
                  className={inputClass}
                />
              </Field>
              <button
                type="button"
                onClick={() => removeBadge(index)}
                className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl font-black hover:bg-red-100 transition"
              >
                حذف
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addBadge}
            disabled={features.trust_badges.length >= 6}
            className="bg-slate-950 text-white px-5 py-3 rounded-2xl font-black hover:bg-slate-800 transition disabled:opacity-50"
          >
            إضافة ميزة
          </button>
          <button
            type="button"
            onClick={() => update('trust_badges', DEFAULT_TRUST_BADGES)}
            className="bg-slate-100 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-200 transition"
          >
            رجوع للافتراضي
          </button>
        </div>
      </Group>

      <Group title="كروت المنتجات">
        <Field label="شكل علامة الخصم على المنتج">
          <select
            value={features.discount_badge_style}
            onChange={(event) => update('discount_badge_style', event.target.value)}
            className={inputClass}
          >
            <option value="amount">المبلغ (وفّر 200 جنيه)</option>
            <option value="percent">النسبة (خصم 15%)</option>
          </select>
        </Field>
      </Group>
    </section>
  )
}
