import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCategoryPath } from '../lib/categoryUrls'
import { DEFAULT_NAVBAR_MENU_ITEMS } from '../lib/defaultNavbarMenuItems'
import { writeSiteSettingsCache } from '../lib/siteSettingsCache'
import { Field, SectionTitle } from './components/AdminFormFields'

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState({
    brand_name: '',
    brand_subtitle: 'كاميرات ومستلزمات إلكترونية',
    logo_url: '',

    brand_area_width_desktop: 430,
    logo_desktop_width: 75,
    logo_desktop_height: 75,
    logo_mobile_width: 42,
    logo_mobile_height: 42,
    brand_text_size_desktop: 28,
    brand_text_size_mobile: 18,
    brand_subtitle_size_desktop: 13,
    brand_subtitle_size_mobile: 10,

    navbar_menu_items: DEFAULT_NAVBAR_MENU_ITEMS,

    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    hero_title: '',
    hero_subtitle: '',
    hero_button_text: '',
    hero_image_url: '',
    footer_description: '',
    paymob_enabled: false,
    paymob_api_key: '',
    paymob_merchant_id: '',
    paymob_integration_id: '',
    paymob_iframe_id: '',
    paymob_hmac_secret: '',
    enable_vodafone_cash: false,
    enable_instapay: false,
  })

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])

  const [logoFile, setLogoFile] = useState(null)
  const [heroImageFile, setHeroImageFile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const getNumberValue = (value, fallback) => {
    if (value === null || value === undefined || value === '') {
      return fallback
    }

    return Number(value)
  }

  const getMenuItems = (value) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value : DEFAULT_NAVBAR_MENU_ITEMS
    }

    return DEFAULT_NAVBAR_MENU_ITEMS
  }

  const getSettings = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    if (data) {
      setSettings({
        brand_name: data.brand_name || '',
        brand_subtitle:
          data.brand_subtitle || 'كاميرات ومستلزمات إلكترونية',
        logo_url: data.logo_url || '',

        brand_area_width_desktop: getNumberValue(
          data.brand_area_width_desktop,
          430
        ),
        logo_desktop_width: getNumberValue(data.logo_desktop_width, 75),
        logo_desktop_height: getNumberValue(data.logo_desktop_height, 75),
        logo_mobile_width: getNumberValue(data.logo_mobile_width, 42),
        logo_mobile_height: getNumberValue(data.logo_mobile_height, 42),
        brand_text_size_desktop: getNumberValue(
          data.brand_text_size_desktop,
          28
        ),
        brand_text_size_mobile: getNumberValue(
          data.brand_text_size_mobile,
          18
        ),
        brand_subtitle_size_desktop: getNumberValue(
          data.brand_subtitle_size_desktop,
          13
        ),
        brand_subtitle_size_mobile: getNumberValue(
          data.brand_subtitle_size_mobile,
          10
        ),

        navbar_menu_items: getMenuItems(data.navbar_menu_items),

        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        address: data.address || '',
        hero_title: data.hero_title || '',
        hero_subtitle: data.hero_subtitle || '',
        hero_button_text: data.hero_button_text || '',
        hero_image_url: data.hero_image_url || '',
        footer_description: data.footer_description || '',
        paymob_enabled: data.paymob_enabled || false,
        paymob_api_key: data.paymob_api_key || '',
        paymob_merchant_id: data.paymob_merchant_id || '',
        paymob_integration_id: data.paymob_integration_id || '',
        paymob_iframe_id: data.paymob_iframe_id || '',
        paymob_hmac_secret: data.paymob_hmac_secret || '',
        enable_vodafone_cash: data.enable_vodafone_cash || false,
        enable_instapay: data.enable_instapay || false,
      })
    }

    setLoading(false)
  }

  const getMenuLinkOptions = async () => {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!categoriesError) {
      setCategories(categoriesData || [])
    }

    if (!productsError) {
      setProducts(productsData || [])
    }
  }

  useEffect(() => {
    getSettings()
    getMenuLinkOptions()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMenuItemChange = (index, field, value) => {
    setSettings((prev) => {
      const updatedItems = [...prev.navbar_menu_items]

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      }

      return {
        ...prev,
        navbar_menu_items: updatedItems,
      }
    })
  }

  const addMenuItem = () => {
    setSettings((prev) => ({
      ...prev,
      navbar_menu_items: [
        ...prev.navbar_menu_items,
        {
          label: '',
          url: '/products',
          highlight: false,
          showDropdown: false,
        },
      ],
    }))
  }

  const removeMenuItem = (index) => {
    setSettings((prev) => {
      const updatedItems = prev.navbar_menu_items.filter(
        (_, itemIndex) => itemIndex !== index
      )

      return {
        ...prev,
        navbar_menu_items:
          updatedItems.length > 0 ? updatedItems : DEFAULT_NAVBAR_MENU_ITEMS,
      }
    })
  }

  const moveMenuItem = (index, direction) => {
    setSettings((prev) => {
      const updatedItems = [...prev.navbar_menu_items]
      const newIndex = index + direction

      if (newIndex < 0 || newIndex >= updatedItems.length) {
        return prev
      }

      const currentItem = updatedItems[index]
      updatedItems[index] = updatedItems[newIndex]
      updatedItems[newIndex] = currentItem

      return {
        ...prev,
        navbar_menu_items: updatedItems,
      }
    })
  }

  const resetMenuItems = () => {
    const confirmReset = window.confirm(
      'هل تريد إعادة قائمة المنيو للوضع الافتراضي؟'
    )

    if (!confirmReset) return

    setSettings((prev) => ({
      ...prev,
      navbar_menu_items: DEFAULT_NAVBAR_MENU_ITEMS,
    }))
  }

  const uploadSiteAsset = async (file, folderName) => {
    const fileExt = file.name.split('.').pop()

    const fileName = `${folderName}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`

    const filePath = `${folderName}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from('site-assets')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      let finalLogoUrl = settings.logo_url
      let finalHeroImageUrl = settings.hero_image_url

      if (logoFile) {
        finalLogoUrl = await uploadSiteAsset(logoFile, 'logos')
      }

      if (heroImageFile) {
        finalHeroImageUrl = await uploadSiteAsset(
          heroImageFile,
          'hero-images'
        )
      }

      const cleanMenuItems = settings.navbar_menu_items
        .filter((item) => item.label && item.label.trim() !== '')
        .map((item) => ({
          label: item.label.trim(),
          url:
            item.url && item.url.trim() !== ''
              ? item.url.trim()
              : '/products',
          highlight: Boolean(item.highlight),
          showDropdown: Boolean(item.showDropdown),
        }))

      const payload = {
        id: 1,

        brand_name: settings.brand_name,
        brand_subtitle: settings.brand_subtitle,
        logo_url: finalLogoUrl,

        brand_area_width_desktop: getNumberValue(
          settings.brand_area_width_desktop,
          430
        ),
        logo_desktop_width: getNumberValue(settings.logo_desktop_width, 75),
        logo_desktop_height: getNumberValue(settings.logo_desktop_height, 75),
        logo_mobile_width: getNumberValue(settings.logo_mobile_width, 42),
        logo_mobile_height: getNumberValue(settings.logo_mobile_height, 42),
        brand_text_size_desktop: getNumberValue(
          settings.brand_text_size_desktop,
          28
        ),
        brand_text_size_mobile: getNumberValue(
          settings.brand_text_size_mobile,
          18
        ),
        brand_subtitle_size_desktop: getNumberValue(
          settings.brand_subtitle_size_desktop,
          13
        ),
        brand_subtitle_size_mobile: getNumberValue(
          settings.brand_subtitle_size_mobile,
          10
        ),

        navbar_menu_items:
          cleanMenuItems.length > 0 ? cleanMenuItems : DEFAULT_NAVBAR_MENU_ITEMS,

        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        address: settings.address,
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle,
        hero_button_text: settings.hero_button_text,
        hero_image_url: finalHeroImageUrl,
        footer_description: settings.footer_description,
        paymob_enabled: settings.paymob_enabled,
        paymob_api_key: settings.paymob_api_key,
        paymob_merchant_id: settings.paymob_merchant_id,
        paymob_integration_id: settings.paymob_integration_id,
        paymob_iframe_id: settings.paymob_iframe_id,
        paymob_hmac_secret: settings.paymob_hmac_secret,
        enable_vodafone_cash: settings.enable_vodafone_cash,
        enable_instapay: settings.enable_instapay,
      }

      const { error } = await supabase
        .from('site_settings')
        .upsert(payload)

      if (error) {
        throw error
      }

      setSettings((prev) => {
        const nextSettings = {
          ...prev,
          ...payload,
        }

        writeSiteSettingsCache(nextSettings)
        return nextSettings
      })

      setLogoFile(null)
      setHeroImageFile(null)
      setMessage('تم حفظ إعدادات الموقع بنجاح')
    } catch (error) {
      setErrorMessage(error.message || 'حدث خطأ أثناء حفظ الإعدادات')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-4xl font-black text-slate-950">
            إعدادات الموقع
          </h1>

          <p className="text-slate-500 mt-2 font-bold">
            جاري تحميل إعدادات الموقع...
          </p>
        </div>

        <div className="space-y-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-950">
            إعدادات الموقع
          </h1>

          <p className="text-slate-500 mt-2 font-bold">
            التحكم في اللوجو، بيانات البراند، منيو الموقع، الهيرو، بيانات التواصل والفوتر
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            getSettings()
            getMenuLinkOptions()
          }}
          className="w-full md:w-auto bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition"
        >
          تحديث البيانات
        </button>
      </div>

      {(message || errorMessage) && (
        <div className="mb-5 space-y-3">
          {message && (
            <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl font-bold">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl font-bold">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <SectionTitle
            title="الهوية والبراند"
            description="رفع اللوجو وتعديل اسم الموقع والجملة التعريفية"
          />

          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
            <div>
              <Field label="لوجو الموقع">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4">
                  <div className="w-full aspect-square rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-4 mb-4">
                    {logoFile ? (
                      <img
                        src={URL.createObjectURL(logoFile)}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : settings.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt="Current Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-slate-400 font-black">
                        بدون لوجو
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 bg-white"
                  />

                  <p className="text-xs text-slate-500 mt-2 font-bold leading-6">
                    يفضل رفع PNG بخلفية شفافة أو صورة واضحة بجودة عالية.
                  </p>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="اسم البراند">
                <input
                  type="text"
                  name="brand_name"
                  value={settings.brand_name}
                  onChange={handleChange}
                  placeholder="Town Tech"
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                />
              </Field>

              <Field label="وصف البراند المختصر">
                <input
                  type="text"
                  name="brand_subtitle"
                  value={settings.brand_subtitle}
                  onChange={handleChange}
                  placeholder="كاميرات ومستلزمات إلكترونية"
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                />
              </Field>

              <div className="md:col-span-2">
                <div
                  className="rounded-3xl p-5 text-white"
                  style={{
                    background:
                      'linear-gradient(135deg, #07111F 0%, #0B1F3A 55%, #123D68 100%)',
                  }}
                >
                  <p className="text-sm text-white/70 mb-4 font-bold">
                    معاينة تقريبية للبراند
                  </p>

                  <div className="flex items-center gap-4">
                    {settings.logo_url || logoFile ? (
                      <img
                        src={
                          logoFile
                            ? URL.createObjectURL(logoFile)
                            : settings.logo_url
                        }
                        alt={settings.brand_name}
                        className="object-contain bg-white rounded-xl p-1"
                        style={{
                          width: `${settings.logo_desktop_width}px`,
                          height: `${settings.logo_desktop_height}px`,
                        }}
                      />
                    ) : (
                      <div
                        className="bg-white text-[#07111F] rounded-xl flex items-center justify-center font-black"
                        style={{
                          width: `${settings.logo_desktop_width}px`,
                          height: `${settings.logo_desktop_height}px`,
                        }}
                      >
                        {settings.brand_name?.charAt(0) || 'T'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div
                        className="font-black truncate"
                        style={{
                          fontSize: `${settings.brand_text_size_desktop}px`,
                          lineHeight: 1.05,
                        }}
                      >
                        {settings.brand_name || 'Brand Name'}
                      </div>

                      <div
                        className="text-white/75 truncate"
                        style={{
                          fontSize: `${settings.brand_subtitle_size_desktop}px`,
                        }}
                      >
                        {settings.brand_subtitle || 'Brand Subtitle'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <SectionTitle
            title="أحجام اللوجو واسم البراند"
            description="تحكم في مقاسات اللوجو والنص في الديسكتوب والموبايل بدون تعديل الكود"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <Field
              label="عرض مساحة البراند في الديسكتوب"
              hint="زود الرقم لو اسم البراند بيتقص في النافبار."
            >
              <input
                type="number"
                name="brand_area_width_desktop"
                value={settings.brand_area_width_desktop}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
              />
            </Field>

            <Field label="عرض لوجو الديسكتوب">
              <input
                type="number"
                name="logo_desktop_width"
                value={settings.logo_desktop_width}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
              />
            </Field>

            <Field label="ارتفاع لوجو الديسكتوب">
              <input
                type="number"
                name="logo_desktop_height"
                value={settings.logo_desktop_height}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
              />
            </Field>

            <Field label="حجم اسم البراند ديسكتوب">
              <input
                type="number"
                name="brand_text_size_desktop"
                value={settings.brand_text_size_desktop}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
              />
            </Field>

            <Field label="حجم الوصف ديسكتوب">
              <input
                type="number"
                name="brand_subtitle_size_desktop"
                value={settings.brand_subtitle_size_desktop}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
              />
            </Field>

            <Field label="عرض لوجو الموبايل">
              <input
                type="number"
                name="logo_mobile_width"
                value={settings.logo_mobile_width}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
              />
            </Field>

            <Field label="ارتفاع لوجو الموبايل">
              <input
                type="number"
                name="logo_mobile_height"
                value={settings.logo_mobile_height}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
              />
            </Field>

            <Field label="حجم اسم البراند موبايل">
              <input
                type="number"
                name="brand_text_size_mobile"
                value={settings.brand_text_size_mobile}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
              />
            </Field>

            <Field label="حجم الوصف موبايل">
              <input
                type="number"
                name="brand_subtitle_size_mobile"
                value={settings.brand_subtitle_size_mobile}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
              />
            </Field>

            <div className="md:col-span-2 xl:col-span-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <p className="text-sm font-black text-slate-700 mb-2">
                قيم مقترحة
              </p>

              <p className="text-xs text-slate-500 font-bold leading-6">
                ديسكتوب: المساحة 430 / اللوجو 75×75 / اسم البراند 28 / الوصف 13
              </p>

              <p className="text-xs text-slate-500 font-bold leading-6">
                موبايل: اللوجو 42×42 / اسم البراند 18 / الوصف 10
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <SectionTitle
            title="إعدادات الدفع"
            description="اضبط حساب Paymob وتمكين طرق الدفع داخل الموقع"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.paymob_enabled}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymob_enabled: e.target.checked,
                  }))
                }
                className="w-5 h-5"
              />
              <div>
                <p className="font-black text-slate-900">تفعيل Paymob</p>
                <p className="text-slate-500 text-sm font-bold leading-6">
                  تفعيل الدفع بالفيزا والبطاقات عبر حساب Paymob.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_vodafone_cash}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    enable_vodafone_cash: e.target.checked,
                  }))
                }
                className="w-5 h-5"
              />
              <div>
                <p className="font-black text-slate-900">تفعيل فودافون كاش</p>
                <p className="text-slate-500 text-sm font-bold leading-6">
                  تفعيل خيار فودافون كاش إذا كان الحساب يدعمه.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_instapay}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    enable_instapay: e.target.checked,
                  }))
                }
                className="w-5 h-5"
              />
              <div>
                <p className="font-black text-slate-900">تفعيل إنستا باي</p>
                <p className="text-slate-500 text-sm font-bold leading-6">
                  تفعيل خيار إنستا باي إذا كان الحساب يدعمه.
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <Field label="Paymob API Key">
              <input
                type="text"
                name="paymob_api_key"
                value={settings.paymob_api_key}
                onChange={handleChange}
                placeholder="أدخل Paymob API Key"
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left"
                dir="ltr"
              />
            </Field>

            <Field label="Merchant ID">
              <input
                type="text"
                name="paymob_merchant_id"
                value={settings.paymob_merchant_id}
                onChange={handleChange}
                placeholder="أدخل Merchant ID"
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left"
                dir="ltr"
              />
            </Field>

            <Field label="Integration ID">
              <input
                type="text"
                name="paymob_integration_id"
                value={settings.paymob_integration_id}
                onChange={handleChange}
                placeholder="أدخل Integration ID"
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left"
                dir="ltr"
              />
            </Field>

            <Field label="Iframe ID">
              <input
                type="text"
                name="paymob_iframe_id"
                value={settings.paymob_iframe_id}
                onChange={handleChange}
                placeholder="أدخل Paymob Iframe ID"
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left"
                dir="ltr"
              />
            </Field>

            <Field label="HMAC Secret (اختياري)">
              <input
                type="text"
                name="paymob_hmac_secret"
                value={settings.paymob_hmac_secret}
                onChange={handleChange}
                placeholder="أدخل HMAC Secret إذا وجدت"
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left"
                dir="ltr"
              />
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-5">
            <SectionTitle
              title="قائمة النافبار"
              description="تحكم في أسماء وروابط المنيو واختار روابط من الصفحات أو الأقسام أو المنتجات"
            />

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={addMenuItem}
                className="bg-slate-950 text-white px-4 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
              >
                إضافة عنصر
              </button>

              <button
                type="button"
                onClick={resetMenuItems}
                className="bg-slate-100 text-slate-950 px-4 py-3 rounded-2xl font-black hover:bg-slate-200 transition"
              >
                إعادة ضبط
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {settings.navbar_menu_items.map((item, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-3xl p-4 bg-slate-50"
              >
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr_auto] gap-4 items-end">
                  <Field label="اسم العنصر">
                    <input
                      type="text"
                      value={item.label || ''}
                      onChange={(e) =>
                        handleMenuItemChange(index, 'label', e.target.value)
                      }
                      placeholder="مثال: كاميرات مراقبة"
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
                    />
                  </Field>

                  <Field
                    label="رابط العنصر"
                    hint="اختار من القائمة أو اكتب الرابط يدويا."
                  >
                    <input
                      type="text"
                      value={item.url || ''}
                      onChange={(e) =>
                        handleMenuItemChange(index, 'url', e.target.value)
                      }
                      placeholder="/products"
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-left"
                      dir="ltr"
                    />

                    <select
                      value=""
                      onChange={(e) => {
                        if (!e.target.value) return
                        handleMenuItemChange(index, 'url', e.target.value)
                      }}
                      className="w-full mt-2 border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-slate-700"
                    >
                      <option value="">اختار رابط من الموقع...</option>

                      <optgroup label="الصفحات الرئيسية">
                        <option value="/">الرئيسية</option>
                        <option value="/products">كل المنتجات</option>
                        <option value="/cart">عربة التسوق</option>
                        <option value="/checkout">إتمام الطلب</option>
                        <option value="/contact">تواصل معنا</option>
                        <option value="/about">من نحن</option>
                        <option value="/our-work">أعمالنا</option>
                        <option value="/privacy-policy">سياسة الخصوصية</option>
                        <option value="/return-policy">سياسة الاستبدال والاسترجاع</option>
                        <option value="/shipping-policy">سياسة الشحن</option>
                        <option value="/terms">الشروط والأحكام</option>
                      </optgroup>

                      {categories.length > 0 && (
                        <>
                          <optgroup label="الأقسام الرئيسية">
                            {categories
                              .filter((category) => !category.parent_id)
                              .map((category) => (
                                <option
                                  key={category.id}
                                  value={getCategoryPath(category)}
                                >
                                  قسم: {category.name}
                                </option>
                              ))}
                          </optgroup>

                          <optgroup label="الأقسام الفرعية">
                            {categories
                              .filter((category) => category.parent_id)
                              .map((subcategory) => {
                                const parent = categories.find(
                                  (category) =>
                                    category.id === subcategory.parent_id
                                )

                                return (
                                  <option
                                    key={subcategory.id}
                                    value={getCategoryPath(parent, subcategory)}
                                  >
                                    {parent?.name || 'قسم'} › {subcategory.name}
                                  </option>
                                )
                              })}
                          </optgroup>
                        </>
                      )}

                      {products.length > 0 && (
                        <optgroup label="المنتجات">
                          {products.map((product) => (
                            <option
                              key={product.id}
                              value={`/products/${product.id}`}
                            >
                              منتج: {product.title}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </Field>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => moveMenuItem(index, -1)}
                      disabled={index === 0}
                      className="bg-white border border-slate-300 text-slate-700 px-3 py-3 rounded-2xl font-black hover:bg-slate-100 disabled:opacity-40"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => moveMenuItem(index, 1)}
                      disabled={index === settings.navbar_menu_items.length - 1}
                      className="bg-white border border-slate-300 text-slate-700 px-3 py-3 rounded-2xl font-black hover:bg-slate-100 disabled:opacity-40"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      onClick={() => removeMenuItem(index)}
                      className="bg-red-50 text-red-600 px-3 py-3 rounded-2xl font-black hover:bg-red-100"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-4 bg-white rounded-2xl border border-slate-200 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(item.showDropdown)}
                    onChange={(e) =>
                      handleMenuItemChange(
                        index,
                        'showDropdown',
                        e.target.checked
                      )
                    }
                    className="w-5 h-5"
                  />

                  <span className="text-sm font-black text-slate-700">
                    قائمة فرعية (ميجا منيو)
                  </span>

                  <span className="text-xs text-slate-500 font-bold">
                    فعّلها فقط للأقسام اللي عندها أقسام فرعية كتير
                  </span>
                </label>

                <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-4 bg-white rounded-2xl border border-slate-200 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(item.highlight)}
                    onChange={(e) =>
                      handleMenuItemChange(
                        index,
                        'highlight',
                        e.target.checked
                      )
                    }
                    className="w-5 h-5"
                  />

                  <span className="text-sm font-black text-slate-700">
                    تمييز هذا العنصر
                  </span>

                  <span className="text-xs text-slate-500 font-bold">
                    مناسب لعناصر مثل: أفضل العروض
                  </span>
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <SectionTitle
            title="صورة الهيرو في الرئيسية"
            description="رفع صورة البانر الرئيسي والتحكم في نصوص الهيرو لو كانت مستخدمة في الصفحة"
          />

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
            <div>
              <Field label="صورة الهيرو">
                <div className="w-full aspect-[1828/728] bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden mb-4">
                  {heroImageFile ? (
                    <img
                      src={URL.createObjectURL(heroImageFile)}
                      alt="Hero Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : settings.hero_image_url ? (
                    <img
                      src={settings.hero_image_url}
                      alt="Current Hero"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black">
                      بدون صورة
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setHeroImageFile(e.target.files?.[0] || null)
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 bg-white"
                />

                <p className="text-xs text-slate-500 mt-2 font-bold">
                  المقاس المفضل: صورة عريضة بنسبة قريبة من 1828×728.
                </p>
              </Field>
            </div>

            <div className="space-y-5">
              <Field label="عنوان الهيرو">
                <input
                  type="text"
                  name="hero_title"
                  value={settings.hero_title}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                />
              </Field>

              <Field label="وصف الهيرو">
                <textarea
                  name="hero_subtitle"
                  value={settings.hero_subtitle}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 min-h-32 text-right"
                />
              </Field>

              <Field label="نص زر الهيرو">
                <input
                  type="text"
                  name="hero_button_text"
                  value={settings.hero_button_text}
                  onChange={handleChange}
                  placeholder="عرض المنتجات"
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <SectionTitle
            title="بيانات التواصل"
            description="البيانات التي تظهر في الموقع والفوتر وصفحة التواصل"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="رقم الهاتف">
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left"
                dir="ltr"
              />
            </Field>

            <Field
              label="رقم واتساب"
              hint="اكتب الرقم بالصيغة الدولية بدون + مثال: 201000000000"
            >
              <input
                type="text"
                name="whatsapp"
                value={settings.whatsapp}
                onChange={handleChange}
                placeholder="201000000000"
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left"
                dir="ltr"
              />
            </Field>

            <Field label="البريد الإلكتروني">
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left"
                dir="ltr"
              />
            </Field>

            <Field label="العنوان">
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
              />
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <SectionTitle
            title="الفوتر"
            description="النص التعريفي الذي يظهر أسفل الموقع"
          />

          <Field label="وصف الفوتر">
            <textarea
              name="footer_description"
              value={settings.footer_description}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 min-h-32 text-right"
            />
          </Field>
        </section>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 sticky bottom-4 z-10">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto bg-slate-950 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60 transition"
          >
            {saving ? 'جاري حفظ الإعدادات...' : 'حفظ إعدادات الموقع'}
          </button>
        </div>
      </form>
    </div>
  )
}