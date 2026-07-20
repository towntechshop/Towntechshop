import { useState } from 'react'
import { supabase } from '../lib/supabase'
import useContactPage from '../hooks/useContactPage'
import { toTelHref, toWhatsAppHref } from '../lib/siteContent'

const inputClass =
  'w-full border border-slate-300 rounded-xl px-4 py-3.5 text-right font-bold text-slate-800 outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 placeholder:text-slate-400 bg-white'

export default function Contact() {
  const { contactPage, loading } = useContactPage()

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('يرجى ملء الاسم والبريد الإلكتروني والرسالة.')
      return
    }

    setSending(true)

    const { error: submitError } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    })

    if (submitError) {
      setError('تعذر إرسال الرسالة حالياً. تواصل معنا عبر الهاتف أو واتساب.')
      setSending(false)
      return
    }

    setSubmitted(true)
    setForm({ name: '', email: '', subject: '', message: '' })
    setSending(false)
  }

  if (loading || !contactPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500 font-bold">جاري تحميل صفحة التواصل...</p>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="text-right mb-10 md:mb-14">
          <h1 className="text-3xl md:text-5xl font-black text-[#0B1F3A] mb-3">
            {contactPage.title}
          </h1>
          <p className="text-slate-500 font-bold text-base md:text-lg">
            {contactPage.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="order-2 lg:order-1 space-y-6 text-right">
              <div>
                <h2 className="text-lg font-black text-[#0B1F3A] mb-3">
                  {contactPage.branchesTitle}
                </h2>
                <div className="space-y-3">
                  {contactPage.branches.map((branch, index) => (
                    <p
                      key={`${branch.label}-${index}`}
                      className="text-slate-600 font-bold leading-7"
                    >
                      <span className="text-[#0B1F3A]">{branch.label}:</span>{' '}
                      {branch.address}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black text-[#0B1F3A] mb-3">
                  {contactPage.contactTitle}
                </h2>
                <div className="space-y-2">
                  {contactPage.phones.map((phone) => (
                    <a
                      key={phone}
                      href={toTelHref(phone)}
                      className="block text-slate-600 hover:text-[#1E6BB8] font-bold transition"
                      dir="ltr"
                    >
                      {phone}
                    </a>
                  ))}
                  <a
                    href={`mailto:${contactPage.email}`}
                    className="block text-slate-600 hover:text-[#1E6BB8] font-bold transition"
                  >
                    {contactPage.email}
                  </a>
                </div>
              </div>

              {(contactPage.showWhatsapp || contactPage.showFacebook) && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {contactPage.showWhatsapp && (
                    <a
                      href={toWhatsAppHref(contactPage.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-black text-sm transition"
                    >
                      واتساب
                    </a>
                  )}
                  {contactPage.showFacebook && contactPage.facebookUrl && (
                    <a
                      href={contactPage.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#10294B] text-white px-5 py-3 rounded-xl font-black text-sm transition"
                    >
                      فيسبوك
                    </a>
                  )}
                </div>
              )}
          </div>

          <div className="order-1 lg:order-2">
            {submitted && (
              <div className="mb-5 bg-green-50 border border-green-100 text-green-700 rounded-2xl p-4 font-bold">
                {contactPage.form.successMessage}
              </div>
            )}

            {error && (
              <div className="mb-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={contactPage.form.namePlaceholder}
                  className={inputClass}
                />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={contactPage.form.emailPlaceholder}
                  className={inputClass}
                  dir="ltr"
                />
              </div>

              <input
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder={contactPage.form.subjectPlaceholder}
                className={inputClass}
              />

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={contactPage.form.messagePlaceholder}
                rows={8}
                className={`${inputClass} resize-y min-h-[180px] leading-7`}
              />

              <div className="flex justify-start">
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-[#0B1F3A] hover:bg-[#10294B] disabled:opacity-60 text-white px-10 py-3.5 rounded-xl font-black text-base transition shadow-sm"
                >
                  {sending ? 'جاري الإرسال...' : contactPage.form.submitText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
