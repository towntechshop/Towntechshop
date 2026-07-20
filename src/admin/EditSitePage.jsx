import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminAboutPage from './AdminAboutPage'
import AdminContactPage from './AdminContactPage'
import AdminOurWorkPage from './AdminOurWorkPage'
import { Field } from './components/AdminFormFields'

export default function EditSitePage() {
  const { slug } = useParams()

  if (slug === 'about') {
    return <AdminAboutPage />
  }

  if (slug === 'contact') {
    return <AdminContactPage />
  }

  if (slug === 'our-work') {
    return <AdminOurWorkPage />
  }

  return <EditTextSitePage slug={slug} />
}

function EditTextSitePage({ slug }) {
  const [page, setPage] = useState({
    title: '',
    content: '',
    is_published: true,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const getPage = async () => {
    setLoading(true)
    setMessage('')
    setErrorMessage('')

    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      setErrorMessage(error.message)
    } else {
      setPage({
        title: data.title || '',
        content: data.content || '',
        is_published: data.is_published !== false,
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    getPage()
  }, [slug])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setPage((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('site_pages')
      .update({
        title: page.title,
        content: page.content,
        is_published: page.is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug)

    setSaving(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setMessage('تم حفظ الصفحة بنجاح')
  }

  const getPageName = () => {
    const names = {
      about: 'من نحن',
      'privacy-policy': 'سياسة الخصوصية',
      'return-policy': 'سياسة الاستبدال والاسترجاع',
      'shipping-policy': 'سياسة الشحن',
      terms: 'الشروط والأحكام',
      contact: 'تواصل معنا',
    }

    return names[slug] || page.title || slug
  }

  if (loading) {
    return (
      <div dir="rtl">
        <div className="mb-6">
          <Link
            to="/admin/pages"
            className="inline-flex bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition mb-4"
          >
            الرجوع للصفحات
          </Link>

          <h1 className="text-2xl md:text-4xl font-black text-slate-950">
            تعديل الصفحة
          </h1>

          <p className="text-slate-500 mt-2 font-bold">
            جاري تحميل بيانات الصفحة...
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <div className="h-[520px] bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
          <div className="h-80 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            to="/admin/pages"
            className="inline-flex bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition mb-4"
          >
            الرجوع للصفحات
          </Link>

          <h1 className="text-2xl md:text-4xl font-black text-slate-950">
            تعديل الصفحة
          </h1>

          <p className="text-slate-500 mt-2 font-bold">
            تعديل محتوى صفحة: /{slug}
          </p>
        </div>

        <a
          href={`/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="w-full md:w-auto bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black text-center hover:bg-slate-50 transition"
        >
          معاينة الصفحة
        </a>
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                محتوى الصفحة
              </h2>

              <p className="text-slate-500 mt-1 font-bold text-sm leading-6">
                اكتب عنوان الصفحة والمحتوى الذي سيظهر للعميل في الموقع
              </p>
            </div>

            <div className="space-y-5">
              <Field label="عنوان الصفحة">
                <input
                  type="text"
                  name="title"
                  value={page.title}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                  placeholder="مثال: سياسة الخصوصية"
                />
              </Field>

              <Field
                label="محتوى الصفحة"
                hint="يمكنك كتابة المحتوى كنص عادي، وكل سطر جديد سيظهر داخل الصفحة حسب تنسيق صفحة العرض."
              >
                <textarea
                  name="content"
                  value={page.content}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-4 outline-none focus:border-slate-950 min-h-[430px] text-right leading-8 resize-y"
                  placeholder="اكتب محتوى الصفحة هنا..."
                />
              </Field>
            </div>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-6">
            <section
              className="rounded-3xl shadow-sm p-5 md:p-6 text-white"
              style={{
                background:
                  'linear-gradient(135deg, #07111F 0%, #0B1F3A 55%, #123D68 100%)',
              }}
            >
              <h2 className="text-xl md:text-2xl font-black">
                ملخص الصفحة
              </h2>

              <div className="mt-5 space-y-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/60 text-sm font-bold">
                    اسم الصفحة
                  </p>

                  <p className="text-lg font-black mt-2 leading-7">
                    {getPageName()}
                  </p>
                </div>

                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/60 text-sm font-bold">
                    الرابط
                  </p>

                  <p className="text-lg font-black mt-2 break-all" dir="ltr">
                    /{slug}
                  </p>
                </div>

                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/60 text-sm font-bold">
                    حالة النشر
                  </p>

                  <p className="text-xl font-black mt-2">
                    {page.is_published ? 'منشورة' : 'غير منشورة'}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl md:text-2xl font-black text-slate-950 mb-5">
                إعدادات النشر
              </h2>

              <label className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer">
                <input
                  id="isPublished"
                  type="checkbox"
                  name="is_published"
                  checked={page.is_published}
                  onChange={handleChange}
                  className="w-5 h-5 mt-1"
                />

                <div>
                  <p className="font-black text-slate-950">
                    الصفحة منشورة
                  </p>

                  <p className="text-slate-500 text-sm font-bold mt-1 leading-6">
                    عند إلغاء التفعيل، الصفحة لن تظهر كمحتوى منشور داخل الموقع.
                  </p>
                </div>
              </label>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-black text-slate-950 mb-3">
                حفظ التعديلات
              </h2>

              <p className="text-slate-500 text-sm font-bold leading-7 mb-5">
                بعد الحفظ يمكنك معاينة الصفحة مباشرة من زر المعاينة بالأعلى.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60 transition"
              >
                {saving ? 'جاري حفظ الصفحة...' : 'حفظ الصفحة'}
              </button>
            </section>
          </aside>
        </div>
      </form>
    </div>
  )
}