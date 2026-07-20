import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  createDefaultContactPage,
  mergeContactPage,
} from '../lib/contactPageDefaults'

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block mb-2 text-sm font-black text-slate-700">{label}</label>
      {children}
      {hint && (
        <p className="text-xs text-slate-500 mt-2 font-bold leading-6">{hint}</p>
      )}
    </div>
  )
}

function inputClass() {
  return 'w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right'
}

export default function AdminContactPage() {
  const [contactPage, setContactPage] = useState(createDefaultContactPage())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('site_settings')
      .select('contact_page')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      setErrorMessage(error.message)
      setContactPage(createDefaultContactPage())
    } else {
      setContactPage(mergeContactPage(data?.contact_page))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateField = (field, value) => {
    setContactPage((prev) => ({ ...prev, [field]: value }))
  }

  const updateFormField = (field, value) => {
    setContactPage((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
    }))
  }

  const updateBranch = (index, field, value) => {
    setContactPage((prev) => ({
      ...prev,
      branches: prev.branches.map((branch, branchIndex) =>
        branchIndex === index ? { ...branch, [field]: value } : branch
      ),
    }))
  }

  const addBranch = () => {
    setContactPage((prev) => ({
      ...prev,
      branches: [...prev.branches, { label: 'فرع جديد', address: '' }],
    }))
  }

  const removeBranch = (index) => {
    setContactPage((prev) => ({
      ...prev,
      branches: prev.branches.filter((_, branchIndex) => branchIndex !== index),
    }))
  }

  const updatePhone = (index, value) => {
    setContactPage((prev) => ({
      ...prev,
      phones: prev.phones.map((phone, phoneIndex) =>
        phoneIndex === index ? value : phone
      ),
    }))
  }

  const addPhone = () => {
    setContactPage((prev) => ({ ...prev, phones: [...prev.phones, ''] }))
  }

  const removePhone = (index) => {
    setContactPage((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, phoneIndex) => phoneIndex !== index),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      const prepared = {
        ...contactPage,
        phones: contactPage.phones.filter((phone) => String(phone).trim()),
        branches: contactPage.branches.filter(
          (branch) => branch.label?.trim() || branch.address?.trim()
        ),
      }

      const { error } = await supabase
        .from('site_settings')
        .update({ contact_page: prepared })
        .eq('id', 1)

      if (error) throw error

      setContactPage(prepared)
      setMessage('تم حفظ صفحة التواصل بنجاح')
    } catch (error) {
      setErrorMessage(
        error.message ||
          'تعذر الحفظ. تأكد من تشغيل ملف SQL الخاص بعمود contact_page في Supabase.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div dir="rtl" className="p-6">
        <p className="text-slate-500 font-bold">جاري تحميل صفحة التواصل...</p>
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

          <p className="text-slate-500 mt-2 font-bold">
            تحكم في العناوين، الفروع، وبيانات التواصل
          </p>
        </div>

        <a
          href="/contact"
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-slate-950 mb-5">العناوين</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="العنوان الرئيسي">
              <input
                type="text"
                value={contactPage.title}
                onChange={(event) => updateField('title', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="العنوان الفرعي">
              <input
                type="text"
                value={contactPage.subtitle}
                onChange={(event) => updateField('subtitle', event.target.value)}
                className={inputClass()}
              />
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-black text-slate-950">الفروع</h2>
            <button
              type="button"
              onClick={addBranch}
              className="bg-slate-950 text-white px-4 py-2 rounded-xl font-black text-sm"
            >
              + فرع
            </button>
          </div>
          <Field label="عنوان القسم">
            <input
              type="text"
              value={contactPage.branchesTitle}
              onChange={(event) => updateField('branchesTitle', event.target.value)}
              className={inputClass()}
            />
          </Field>
          <div className="mt-4 space-y-4">
            {contactPage.branches.map((branch, index) => (
              <div
                key={`branch-${index}`}
                className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <p className="font-black text-slate-900">فرع {index + 1}</p>
                  {contactPage.branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBranch(index)}
                      className="text-red-600 font-black text-sm"
                    >
                      حذف
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={branch.label}
                  onChange={(event) => updateBranch(index, 'label', event.target.value)}
                  className={inputClass()}
                  placeholder="اسم الفرع"
                />
                <textarea
                  value={branch.address}
                  onChange={(event) => updateBranch(index, 'address', event.target.value)}
                  className={`${inputClass()} min-h-[80px] resize-y leading-7`}
                  placeholder="العنوان"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-slate-950 mb-5">بيانات التواصل</h2>
          <Field label="عنوان قسم التواصل">
            <input
              type="text"
              value={contactPage.contactTitle}
              onChange={(event) => updateField('contactTitle', event.target.value)}
              className={inputClass()}
            />
          </Field>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-black text-slate-800">أرقام الهاتف</p>
              <button
                type="button"
                onClick={addPhone}
                className="text-sm font-black text-blue-700"
              >
                + رقم
              </button>
            </div>
            {contactPage.phones.map((phone, index) => (
              <div key={`phone-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(event) => updatePhone(index, event.target.value)}
                  className={inputClass()}
                  dir="ltr"
                />
                {contactPage.phones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhone(index)}
                    className="px-4 text-red-600 font-black"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="البريد الإلكتروني">
              <input
                type="email"
                value={contactPage.email}
                onChange={(event) => updateField('email', event.target.value)}
                className={inputClass()}
                dir="ltr"
              />
            </Field>
            <Field label="واتساب (رقم دولي)">
              <input
                type="text"
                value={contactPage.whatsapp}
                onChange={(event) => updateField('whatsapp', event.target.value)}
                className={inputClass()}
                dir="ltr"
              />
            </Field>
            <Field label="رابط فيسبوك">
              <input
                type="url"
                value={contactPage.facebookUrl}
                onChange={(event) => updateField('facebookUrl', event.target.value)}
                className={inputClass()}
                dir="ltr"
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 font-bold text-slate-700">
              <input
                type="checkbox"
                checked={contactPage.showWhatsapp}
                onChange={(event) => updateField('showWhatsapp', event.target.checked)}
              />
              إظهار زر واتساب
            </label>
            <label className="flex items-center gap-2 font-bold text-slate-700">
              <input
                type="checkbox"
                checked={contactPage.showFacebook}
                onChange={(event) => updateField('showFacebook', event.target.checked)}
              />
              إظهار زر فيسبوك
            </label>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-slate-950 mb-5">نموذج التواصل</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Placeholder الاسم">
              <input
                type="text"
                value={contactPage.form.namePlaceholder}
                onChange={(event) => updateFormField('namePlaceholder', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="Placeholder البريد">
              <input
                type="text"
                value={contactPage.form.emailPlaceholder}
                onChange={(event) => updateFormField('emailPlaceholder', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="Placeholder الموضوع">
              <input
                type="text"
                value={contactPage.form.subjectPlaceholder}
                onChange={(event) => updateFormField('subjectPlaceholder', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="Placeholder الرسالة">
              <input
                type="text"
                value={contactPage.form.messagePlaceholder}
                onChange={(event) => updateFormField('messagePlaceholder', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="نص زر الإرسال">
              <input
                type="text"
                value={contactPage.form.submitText}
                onChange={(event) => updateFormField('submitText', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="رسالة النجاح">
              <input
                type="text"
                value={contactPage.form.successMessage}
                onChange={(event) => updateFormField('successMessage', event.target.value)}
                className={inputClass()}
              />
            </Field>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60 transition"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الصفحة'}
        </button>
      </form>
    </div>
  )
}
