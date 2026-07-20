import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ABOUT_ICON_KEYS,
  createDefaultAboutPage,
  mergeAboutPage,
} from '../lib/aboutPageDefaults'
import { uploadSiteAsset } from '../lib/uploadSiteAsset'

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

function MediaFields({ section, onChange, onFileSelect, fileKey }) {
  return (
    <div className="space-y-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
      <Field label="رابط الصورة" hint="يمكنك لصق رابط صورة أو رفع صورة من جهازك.">
        <input
          type="url"
          value={section.imageUrl || ''}
          onChange={(event) => onChange('imageUrl', event.target.value)}
          className={inputClass()}
          placeholder="https://..."
          dir="ltr"
        />
      </Field>

      <Field label="رفع صورة">
        <input
          type="file"
          accept="image/*"
          onChange={(event) =>
            onFileSelect(fileKey, event.target.files?.[0] || null)
          }
          className="w-full text-sm"
        />
      </Field>

      {section.imageUrl && (
        <img
          src={section.imageUrl}
          alt="معاينة"
          className="w-full max-h-48 object-cover rounded-2xl border border-slate-200"
        />
      )}
    </div>
  )
}

export default function AdminAboutPage() {
  const [aboutPage, setAboutPage] = useState(createDefaultAboutPage())
  const [brandName, setBrandName] = useState('Town Tech')
  const [pendingFiles, setPendingFiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('site_settings')
      .select('brand_name, about_page')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      setErrorMessage(error.message)
      setAboutPage(createDefaultAboutPage())
      setLoading(false)
      return
    }

    const name = data?.brand_name || 'Town Tech'
    setBrandName(name)
    setAboutPage(mergeAboutPage(data?.about_page, name))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateSection = (sectionKey, field, value) => {
    setAboutPage((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value,
      },
    }))
  }

  const updateFeature = (index, field, value) => {
    setAboutPage((prev) => ({
      ...prev,
      why: {
        ...prev.why,
        features: prev.why.features.map((feature, featureIndex) =>
          featureIndex === index ? { ...feature, [field]: value } : feature
        ),
      },
    }))
  }

  const addFeature = () => {
    setAboutPage((prev) => ({
      ...prev,
      why: {
        ...prev.why,
        features: [
          ...prev.why.features,
          {
            iconKey: 'price',
            iconUrl: '',
            title: 'عنوان جديد',
            description: 'اكتب وصف الميزة هنا.',
          },
        ],
      },
    }))
  }

  const removeFeature = (index) => {
    setAboutPage((prev) => ({
      ...prev,
      why: {
        ...prev.why,
        features: prev.why.features.filter((_, featureIndex) => featureIndex !== index),
      },
    }))
  }

  const setPendingFile = (key, file) => {
    setPendingFiles((prev) => ({ ...prev, [key]: file }))
  }

  const applyUploadedFiles = async (current) => {
    const next = structuredClone(current)
    const uploads = Object.entries(pendingFiles).filter(([, file]) => file)

    for (const [key, file] of uploads) {
      const url = await uploadSiteAsset(file, 'about-page')

      if (key === 'hero-image') {
        next.hero.imageUrl = url
        next.hero.mediaType = 'image'
      } else if (key === 'intro-image') {
        next.intro.imageUrl = url
        next.intro.mediaType = 'image'
      } else if (key === 'why-image') {
        next.why.imageUrl = url
        next.why.mediaType = 'image'
      } else if (key === 'mission-image') {
        next.mission.imageUrl = url
        next.mission.mediaType = 'image'
      } else if (key === 'vision-image') {
        next.vision.imageUrl = url
        next.vision.mediaType = 'image'
      } else if (key.startsWith('feature-icon-')) {
        const index = Number(key.replace('feature-icon-', ''))
        if (next.why.features[index]) {
          next.why.features[index].iconUrl = url
        }
      }
    }

    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      const preparedAboutPage = await applyUploadedFiles(aboutPage)

      ;['hero', 'intro', 'why', 'mission', 'vision'].forEach((key) => {
        if (preparedAboutPage[key]) {
          preparedAboutPage[key].mediaType = 'image'
          preparedAboutPage[key].videoUrl = ''
        }
      })

      const { error } = await supabase
        .from('site_settings')
        .update({ about_page: preparedAboutPage })
        .eq('id', 1)

      if (error) {
        throw error
      }

      setAboutPage(preparedAboutPage)
      setPendingFiles({})
      setMessage('تم حفظ صفحة من نحن بنجاح')
    } catch (error) {
      setErrorMessage(
        error.message ||
          'تعذر الحفظ. تأكد من تشغيل ملف SQL الخاص بعمود about_page في Supabase.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div dir="rtl" className="p-6">
        <p className="text-slate-500 font-bold">جاري تحميل صفحة من نحن...</p>
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
            تحكم في كل أقسام صفحة {brandName} — نصوص وصور
          </p>
        </div>

        <a
          href="/about"
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
          <h2 className="text-xl font-black text-slate-950 mb-5">البانر العلوي</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="العنوان الرئيسي">
              <input
                type="text"
                value={aboutPage.hero.title}
                onChange={(event) => updateSection('hero', 'title', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="العنوان الفرعي">
              <input
                type="text"
                value={aboutPage.hero.subtitle}
                onChange={(event) => updateSection('hero', 'subtitle', event.target.value)}
                className={inputClass()}
              />
            </Field>
          </div>
          <div className="mt-5">
            <MediaFields
              section={aboutPage.hero}
              onChange={(field, value) => updateSection('hero', field, value)}
              onFileSelect={setPendingFile}
              fileKey="hero-image"
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-slate-950 mb-5">قسم من نحن</h2>
          <div className="space-y-5">
            <Field label="العنوان">
              <input
                type="text"
                value={aboutPage.intro.title}
                onChange={(event) => updateSection('intro', 'title', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="المحتوى">
              <textarea
                value={aboutPage.intro.content}
                onChange={(event) => updateSection('intro', 'content', event.target.value)}
                className={`${inputClass()} min-h-[180px] leading-8 resize-y`}
              />
            </Field>
            <MediaFields
              section={aboutPage.intro}
              onChange={(field, value) => updateSection('intro', field, value)}
              onFileSelect={setPendingFile}
              fileKey="intro-image"
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-slate-950 mb-5">لماذا نحن</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <Field label="العنوان">
              <input
                type="text"
                value={aboutPage.why.title}
                onChange={(event) => updateSection('why', 'title', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="العنوان الفرعي">
              <input
                type="text"
                value={aboutPage.why.subtitle}
                onChange={(event) => updateSection('why', 'subtitle', event.target.value)}
                className={inputClass()}
              />
            </Field>
          </div>

          <MediaFields
            section={aboutPage.why}
            onChange={(field, value) => updateSection('why', field, value)}
            onFileSelect={setPendingFile}
            fileKey="why-image"
          />

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-black text-slate-900">المميزات</h3>
              <button
                type="button"
                onClick={addFeature}
                className="bg-slate-950 text-white px-4 py-2 rounded-xl font-black text-sm"
              >
                + إضافة ميزة
              </button>
            </div>

            {aboutPage.why.features.map((feature, index) => (
              <div
                key={`feature-${index}`}
                className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-900">ميزة {index + 1}</p>
                  {aboutPage.why.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-600 font-black text-sm"
                    >
                      حذف
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="العنوان">
                    <input
                      type="text"
                      value={feature.title}
                      onChange={(event) => updateFeature(index, 'title', event.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="الأيقونة">
                    <select
                      value={feature.iconKey || 'price'}
                      onChange={(event) => updateFeature(index, 'iconKey', event.target.value)}
                      className={inputClass()}
                    >
                      {ABOUT_ICON_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="الوصف">
                  <textarea
                    value={feature.description}
                    onChange={(event) =>
                      updateFeature(index, 'description', event.target.value)
                    }
                    className={`${inputClass()} min-h-[100px] leading-7 resize-y`}
                  />
                </Field>

                <Field label="أيقونة مخصصة (اختياري)">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setPendingFile(
                        `feature-icon-${index}`,
                        event.target.files?.[0] || null
                      )
                    }
                    className="w-full text-sm"
                  />
                </Field>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-slate-950 mb-5">مهمتنا</h2>
          <div className="space-y-5">
            <Field label="العنوان">
              <input
                type="text"
                value={aboutPage.mission.title}
                onChange={(event) => updateSection('mission', 'title', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="المحتوى">
              <textarea
                value={aboutPage.mission.content}
                onChange={(event) => updateSection('mission', 'content', event.target.value)}
                className={`${inputClass()} min-h-[140px] leading-8 resize-y`}
              />
            </Field>
            <MediaFields
              section={aboutPage.mission}
              onChange={(field, value) => updateSection('mission', field, value)}
              onFileSelect={setPendingFile}
              fileKey="mission-image"
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-slate-950 mb-5">رؤيتنا</h2>
          <div className="space-y-5">
            <Field label="العنوان">
              <input
                type="text"
                value={aboutPage.vision.title}
                onChange={(event) => updateSection('vision', 'title', event.target.value)}
                className={inputClass()}
              />
            </Field>
            <Field label="المحتوى">
              <textarea
                value={aboutPage.vision.content}
                onChange={(event) => updateSection('vision', 'content', event.target.value)}
                className={`${inputClass()} min-h-[140px] leading-8 resize-y`}
              />
            </Field>
            <MediaFields
              section={aboutPage.vision}
              onChange={(field, value) => updateSection('vision', field, value)}
              onFileSelect={setPendingFile}
              fileKey="vision-image"
            />
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
