import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import usePageSeo from '../hooks/usePageSeo'

const PLACE_TYPES = ['منزل / شقة', 'فيلا', 'محل', 'شركة / مكتب', 'مصنع / مخزن', 'عمارة سكنية', 'أخرى']
const SERVICE_TYPES = ['معاينة وتسعير', 'تركيب كاميرات جديدة', 'صيانة أو توسعة سيستم موجود']

const inputClass =
  'w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition text-right'

export default function InstallationRequest() {
  const [governorates, setGovernorates] = useState([])
  const [form, setForm] = useState({
    name: '',
    phone: '',
    governorate: '',
    address: '',
    placeType: PLACE_TYPES[0],
    service: SERVICE_TYPES[0],
    cameras: '4',
    notes: '',
  })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  usePageSeo({
    title: 'اطلب معاينة أو تركيب',
    description: 'اطلب معاينة مجانية أو تركيب كاميرات مراقبة لبيتك أو محلك أو شركتك، وفريقنا هيتواصل معاك.',
  })

  useEffect(() => {
    supabase
      .from('shipping_zones')
      .select('governorate')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setGovernorates((data || []).map((row) => row.governorate)))
  }, [])

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const phoneDigits = form.phone.replace(/\D/g, '')
    if (!form.name.trim() || phoneDigits.length < 10) {
      setError('اكتب اسمك ورقم موبايل صحيح عشان نقدر نتواصل معاك.')
      return
    }

    setSending(true)

    const details = {
      governorate: form.governorate,
      address: form.address.trim(),
      place_type: form.placeType,
      service: form.service,
      cameras: form.cameras,
      notes: form.notes.trim(),
    }

    const message = [
      `الخدمة: ${form.service}`,
      `نوع المكان: ${form.placeType}`,
      `عدد الكاميرات التقريبي: ${form.cameras}`,
      `المحافظة: ${form.governorate || '-'}`,
      `العنوان: ${form.address.trim() || '-'}`,
      form.notes.trim() ? `ملاحظات: ${form.notes.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const { error: insertError } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: null,
      subject: `طلب ${form.service}`,
      message,
      message_type: 'installation',
      details,
    })

    setSending(false)

    if (insertError) {
      setError('تعذر إرسال الطلب حالياً. كلمنا على واتساب أو التليفون.')
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-[60vh] bg-[#F4F7FB] px-4 py-14" dir="rtl">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center text-3xl font-bold">✓</div>
          <h1 className="mt-4 text-2xl font-bold text-[#0B1F3A]">وصلنا طلبك</h1>
          <p className="mt-2 text-slate-600 leading-7">فريقنا هيتواصل معاك على رقم {form.phone} لتحديد ميعاد المعاينة.</p>
          <Link to="/products" className="inline-flex mt-6 bg-[#0B1F3A] text-white px-6 py-3 rounded-xl font-bold">
            تصفح المنتجات
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-8" dir="rtl">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 md:p-7">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B1F3A]">اطلب معاينة أو تركيب</h1>
          <p className="text-slate-500 mt-1.5 leading-7">املا البيانات دي وفريقنا الفني هيكلمك يحدد معاك ميعاد ويقترح أنسب سيستم لمكانك.</p>

          {error && <p role="alert" className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-bold text-sm">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <label className="block">
              <span className="block mb-1.5 text-sm font-bold text-slate-700">الاسم <span className="text-[#D7262E]">*</span></span>
              <input value={form.name} onChange={update('name')} autoComplete="name" className={inputClass} required />
            </label>
            <label className="block">
              <span className="block mb-1.5 text-sm font-bold text-slate-700">رقم الموبايل <span className="text-[#D7262E]">*</span></span>
              <input value={form.phone} onChange={update('phone')} type="tel" inputMode="tel" dir="ltr" placeholder="01xxxxxxxxx" autoComplete="tel" className={`${inputClass} text-left`} required />
            </label>

            <label className="block">
              <span className="block mb-1.5 text-sm font-bold text-slate-700">الخدمة المطلوبة</span>
              <select value={form.service} onChange={update('service')} className={inputClass}>
                {SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block mb-1.5 text-sm font-bold text-slate-700">نوع المكان</span>
              <select value={form.placeType} onChange={update('placeType')} className={inputClass}>
                {PLACE_TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="block mb-1.5 text-sm font-bold text-slate-700">المحافظة</span>
              <select value={form.governorate} onChange={update('governorate')} className={inputClass}>
                <option value="">اختار المحافظة</option>
                {governorates.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block mb-1.5 text-sm font-bold text-slate-700">عدد الكاميرات التقريبي</span>
              <select value={form.cameras} onChange={update('cameras')} className={inputClass}>
                {['1 - 2', '4', '6 - 8', '10 - 16', 'أكثر من 16', 'مش متأكد'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="block mb-1.5 text-sm font-bold text-slate-700">العنوان</span>
              <input value={form.address} onChange={update('address')} placeholder="المدينة / المنطقة / الشارع" className={inputClass} />
            </label>
            <label className="block md:col-span-2">
              <span className="block mb-1.5 text-sm font-bold text-slate-700">ملاحظات <span className="text-slate-400 font-normal">(اختياري)</span></span>
              <textarea value={form.notes} onChange={update('notes')} placeholder="مثلاً: عايز كاميرات خارجية بالليل، أو مواعيد مناسبة للزيارة" className={`${inputClass} min-h-24`} />
            </label>
          </div>

          <button type="submit" disabled={sending} className="mt-5 w-full md:w-auto bg-[#D7262E] hover:bg-[#bf1f27] text-white px-8 py-3.5 rounded-xl font-bold disabled:opacity-60 transition">
            {sending ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </button>
        </form>

        <aside className="bg-[#0B1F3A] text-white rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">إزاي بنشتغل</h2>
          <ol className="space-y-3 text-sm leading-6 text-white/85">
            <li><span className="font-bold text-white">1. </span>بنكلمك نفهم احتياجك ونحدد ميعاد.</li>
            <li><span className="font-bold text-white">2. </span>المعاينة: الفني يحدد أماكن الكاميرات وأنسب الأنواع.</li>
            <li><span className="font-bold text-white">3. </span>عرض سعر واضح قبل أي تركيب.</li>
            <li><span className="font-bold text-white">4. </span>التركيب والتشغيل على موبايلك مع الضمان.</li>
          </ol>
        </aside>
      </div>
    </div>
  )
}
