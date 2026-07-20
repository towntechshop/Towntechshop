import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ReviewsCarousel from '../components/ReviewsCarousel'

const BRAND_COLORS = {
  primary: '#0B1F3A',
}

export default function Reviews() {
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    rating: 5,
    review_text: '',
  })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const cleanName = form.customer_name.trim()
    const cleanReview = form.review_text.trim()

    if (!cleanName || !cleanReview) {
      setErrorMessage('اكتب اسمك والريفيو من فضلك.')
      setSubmitting(false)
      return
    }

    const payload = {
      customer_name: cleanName,
      customer_phone: form.customer_phone.trim() || null,
      customer_email: form.customer_email.trim() || null,
      rating: Number(form.rating || 5),
      review_text: cleanReview,
      status: 'pending',
      is_featured: false,
    }

    const { error } = await supabase.from('reviews').insert(payload)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setSuccessMessage(
        'تم إرسال رأيك بنجاح، وهيظهر على الموقع بعد مراجعته من الإدارة.'
      )

      setForm({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        rating: 5,
        review_text: '',
      })
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <section className="px-4 py-12">
        <div className="max-w-[1500px] mx-auto">
          <div
            className="relative overflow-hidden rounded-[32px] p-7 md:p-12 text-white shadow-md"
            style={{
              background:
                'linear-gradient(135deg, #0B1F3A 0%, #123D68 55%, #07111F 100%)',
            }}
          >
            <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full bg-sky-400/20" />
            <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-white/10" />

            <div className="relative z-10 max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-black leading-tight">
                آراء العملاء
              </h1>

              <p className="text-white/75 mt-4 text-lg leading-8">
             شاركنا رأيك في تجربتك معانا
              </p>
            </div>
          </div>
        </div>
      </section>

      <ReviewsCarousel
        title="ريفيوهات العملاء"
        subtitle="الريفيوهات المعتمدة من الإدارة"
        showWriteButton={false}
      />

      <section className="px-4 pb-16">
        <div className="max-w-[900px] mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              اكتب رأيك
            </h2>

            <p className="text-slate-500 mb-6">
              اكتب تجربتك معانا
            </p>

            {successMessage && (
              <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-xl text-sm font-bold">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-bold text-slate-700">
                    الاسم
                  </label>

                  <input
                    type="text"
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    placeholder="اكتب اسمك"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-bold text-slate-700">
                    التقييم
                  </label>

                  <select
                    name="rating"
                    value={form.rating}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-slate-900 bg-white"
                  >
                    <option value={5}>5 نجوم</option>
                    <option value={4}>4 نجوم</option>
                    <option value={3}>3 نجوم</option>
                    <option value={2}>2 نجوم</option>
                    <option value={1}>1 نجمة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-bold text-slate-700">
                    رقم الهاتف
                  </label>

                  <input
                    type="text"
                    name="customer_phone"
                    value={form.customer_phone}
                    onChange={handleChange}
                    placeholder="اختياري"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-bold text-slate-700">
                    الإيميل
                  </label>

                  <input
                    type="email"
                    name="customer_email"
                    value={form.customer_email}
                    onChange={handleChange}
                    placeholder="اختياري"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  رأيك
                </label>

                <textarea
                  name="review_text"
                  value={form.review_text}
                  onChange={handleChange}
                  placeholder="اكتب رأيك في تجربتك معانا"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-slate-900 min-h-[150px]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white rounded-xl py-3 font-black hover:opacity-90 transition disabled:opacity-60"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                {submitting ? 'جاري الإرسال...' : 'إرسال الرأي'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}