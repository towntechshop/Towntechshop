import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  createDefaultOurWorkPage,
  createOurWorkImage,
  mergeOurWorkPage,
} from '../lib/ourWorkPageDefaults'
import { uploadSiteAsset } from '../lib/uploadSiteAsset'
import { Field, SectionTitle } from './components/AdminFormFields'

function inputClass() {
  return 'w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right'
}

function GalleryThumb({ item, index, total, previewUrl, onRemove, onMove }) {
  const src = previewUrl || item.imageUrl

  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
      {src ? (
        <img
          src={src}
          alt={item.title || `صورة ${index + 1}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
          بانتظار الرفع
        </div>
      )}

      <span className="absolute top-1.5 right-1.5 bg-black/65 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
        {index + 1}
      </span>

      {!item.imageUrl && previewUrl && (
        <span className="absolute bottom-1.5 right-1.5 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
          جديد
        </span>
      )}

      <div className="absolute inset-0 bg-[#0B1F3A]/75 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          title="تحريك لليسار"
          className="w-8 h-8 rounded-lg bg-white/90 text-slate-900 font-black text-sm disabled:opacity-40"
        >
          →
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          title="حذف"
          className="w-8 h-8 rounded-lg bg-red-500 text-white font-black text-xs"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          title="تحريك لليمين"
          className="w-8 h-8 rounded-lg bg-white/90 text-slate-900 font-black text-sm disabled:opacity-40"
        >
          ←
        </button>
      </div>
    </div>
  )
}

export default function AdminOurWorkPage() {
  const [ourWorkPage, setOurWorkPage] = useState(createDefaultOurWorkPage())
  const [pendingFilesById, setPendingFilesById] = useState({})
  const [previewUrlsById, setPreviewUrlsById] = useState({})
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  const loadData = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('site_settings')
      .select('our_work_page')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      setErrorMessage(error.message)
      setOurWorkPage(createDefaultOurWorkPage())
    } else {
      setOurWorkPage(mergeOurWorkPage(data?.our_work_page))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    return () => {
      Object.values(previewUrlsById).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrlsById])

  const revokePreview = (id) => {
    setPreviewUrlsById((prev) => {
      if (prev[id]) {
        URL.revokeObjectURL(prev[id])
      }
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((file) =>
      file.type.startsWith('image/')
    )

    if (files.length === 0) return

    const newItems = files.map((file) => {
      const item = createOurWorkImage()
      return { item, file }
    })

    setOurWorkPage((prev) => ({
      ...prev,
      images: [...prev.images, ...newItems.map(({ item }) => item)],
    }))

    setPendingFilesById((prev) => {
      const next = { ...prev }
      newItems.forEach(({ item, file }) => {
        next[item.id] = file
      })
      return next
    })

    setPreviewUrlsById((prev) => {
      const next = { ...prev }
      newItems.forEach(({ item, file }) => {
        next[item.id] = URL.createObjectURL(file)
      })
      return next
    })

    setMessage(`تمت إضافة ${files.length} صورة — اضغط «حفظ» لرفعها`)
  }

  const handleFileInput = (event) => {
    addFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    addFiles(event.dataTransfer.files)
  }

  const updateField = (field, value) => {
    setOurWorkPage((prev) => ({ ...prev, [field]: value }))
  }

  const removeImage = (index) => {
    const item = ourWorkPage.images[index]
    if (item?.id) {
      revokePreview(item.id)
      setPendingFilesById((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
    }

    setOurWorkPage((prev) => ({
      ...prev,
      images: prev.images.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const moveImage = (index, direction) => {
    setOurWorkPage((prev) => {
      const nextImages = [...prev.images]
      const targetIndex = index + direction

      if (targetIndex < 0 || targetIndex >= nextImages.length) {
        return prev
      }

      ;[nextImages[index], nextImages[targetIndex]] = [
        nextImages[targetIndex],
        nextImages[index],
      ]

      return { ...prev, images: nextImages }
    })
  }

  const clearAllImages = () => {
    if (!window.confirm('حذف كل الصور؟')) return

    ourWorkPage.images.forEach((item) => {
      if (item?.id) revokePreview(item.id)
    })

    setOurWorkPage((prev) => ({ ...prev, images: [] }))
    setPendingFilesById({})
  }

  const applyUploadedFiles = async (current) => {
    const next = structuredClone(current)
    const toUpload = next.images.filter(
      (item) => pendingFilesById[item.id] && !item.imageUrl?.trim()
    )

    for (let index = 0; index < toUpload.length; index += 1) {
      const item = toUpload[index]
      setUploadProgress(`جاري رفع ${index + 1} من ${toUpload.length}...`)

      const url = await uploadSiteAsset(pendingFilesById[item.id], 'our-work')
      const target = next.images.find((image) => image.id === item.id)
      if (target) {
        target.imageUrl = url
      }
    }

    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMessage('')
    setUploadProgress('')

    try {
      const prepared = await applyUploadedFiles(ourWorkPage)
      const cleaned = {
        ...prepared,
        images: prepared.images.filter((item) => item.imageUrl?.trim()),
      }

      const { error } = await supabase
        .from('site_settings')
        .update({ our_work_page: cleaned })
        .eq('id', 1)

      if (error) {
        throw error
      }

      cleaned.images.forEach((item) => {
        if (item.id) revokePreview(item.id)
      })

      setOurWorkPage(cleaned)
      setPendingFilesById({})
      setUploadProgress('')
      setMessage(`تم الحفظ — ${cleaned.images.length} صورة`)
    } catch (error) {
      setUploadProgress('')
      setErrorMessage(
        error.message ||
          'تعذر الحفظ. تأكد من تشغيل ملف SQL الخاص بعمود our_work_page في Supabase.'
      )
    } finally {
      setSaving(false)
    }
  }

  const pendingCount = Object.keys(pendingFilesById).length
  const imageCount = ourWorkPage.images.length

  if (loading) {
    return (
      <div dir="rtl" className="p-6">
        <p className="text-slate-500 font-bold">جاري تحميل صفحة أعمالنا...</p>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            to="/admin/pages"
            className="inline-flex text-sm font-black text-slate-500 hover:text-slate-800 transition mb-3"
          >
            ← العودة للصفحات
          </Link>

          <p className="text-slate-500 mt-2 font-bold">
            ارفع عدة صور مرة واحدة — المعاينة في شبكة مدمجة
          </p>
        </div>

        <Link
          to="/our-work"
          target="_blank"
          rel="noreferrer"
          className="w-full md:w-auto bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition text-center"
        >
          معاينة الصفحة
        </Link>
      </div>

      {message && (
        <div className="mb-4 bg-green-50 text-green-700 border border-green-200 rounded-2xl p-4 font-black">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 font-black">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <SectionTitle
            title="إعدادات الصفحة"
            description="العنوان والوصف وسيكشن الهوم"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="عنوان الصفحة">
              <input
                type="text"
                value={ourWorkPage.title}
                onChange={(event) => updateField('title', event.target.value)}
                className={inputClass()}
              />
            </Field>

            <Field label="الوصف">
              <input
                type="text"
                value={ourWorkPage.subtitle}
                onChange={(event) =>
                  updateField('subtitle', event.target.value)
                }
                className={inputClass()}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ourWorkPage.isPublished}
                onChange={(event) =>
                  updateField('isPublished', event.target.checked)
                }
                className="w-4 h-4 rounded"
              />
              <span className="font-black text-slate-800 text-sm">
                نشر صفحة أعمالنا على الموقع
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ourWorkPage.showOnHome}
                onChange={(event) =>
                  updateField('showOnHome', event.target.checked)
                }
                className="w-4 h-4 rounded"
              />
              <span className="font-black text-slate-800 text-sm">
                إظهار في الصفحة الرئيسية
              </span>
            </label>

            <input
              type="text"
              value={ourWorkPage.homeTitle}
              onChange={(event) =>
                updateField('homeTitle', event.target.value)
              }
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-slate-950 text-right w-40"
              placeholder="عنوان الهوم"
            />

            <input
              type="number"
              min={1}
              max={12}
              value={ourWorkPage.homeMaxImages}
              onChange={(event) =>
                updateField('homeMaxImages', Number(event.target.value))
              }
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-slate-950 w-20 text-center"
              title="عدد الصور في الهوم"
            />
            <span className="text-xs text-slate-500 font-bold">صورة في الهوم</span>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <SectionTitle
              title="معرض الصور"
              description={`${imageCount} صورة${pendingCount ? ` · ${pendingCount} بانتظار الرفع` : ''}`}
            />

            {imageCount > 0 && (
              <button
                type="button"
                onClick={clearAllImages}
                className="text-sm font-black text-red-600 hover:text-red-700"
              >
                حذف الكل
              </button>
            )}
          </div>

          <div
            onDragEnter={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault()
              setDragActive(false)
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-10 text-center transition mb-5 ${
              dragActive
                ? 'border-sky-500 bg-sky-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="text-4xl mb-3">📷</div>
            <p className="font-black text-slate-900 text-lg">
              اسحب الصور هنا أو اضغط لاختيار عدة صور
            </p>
            <p className="text-slate-500 font-bold text-sm mt-2">
              PNG · JPG · WEBP — يمكنك اختيار 10 أو 50 صورة دفعة واحدة
            </p>
          </div>

          {imageCount === 0 ? (
            <p className="text-center text-slate-400 font-bold text-sm py-4">
              لا توجد صور بعد
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3">
              {ourWorkPage.images.map((item, index) => (
                <GalleryThumb
                  key={item.id}
                  item={item}
                  index={index}
                  total={imageCount}
                  previewUrl={previewUrlsById[item.id]}
                  onRemove={removeImage}
                  onMove={moveImage}
                />
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 transition flex flex-col items-center justify-center gap-1 text-slate-500"
              >
                <span className="text-2xl font-light">+</span>
                <span className="text-[10px] font-black">إضافة</span>
              </button>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
          {uploadProgress && (
            <p className="text-slate-500 font-bold text-sm md:ml-4">
              {uploadProgress}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || imageCount === 0}
            className="w-full md:w-auto bg-slate-950 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition disabled:opacity-60"
          >
            {saving ? 'جاري الحفظ والرفع...' : 'حفظ الصور'}
          </button>
        </div>
      </form>
    </div>
  )
}
