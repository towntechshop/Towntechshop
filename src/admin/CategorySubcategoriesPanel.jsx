import { useState } from 'react'
import { supabase } from '../lib/supabase'

const generateSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')

export default function CategorySubcategoriesPanel({ category, onRefresh }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [subcategoryImageFile, setSubcategoryImageFile] = useState(null)
  const [subcategoryImagePreview, setSubcategoryImagePreview] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const subcategories = (category.subcategories || []).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  const handleNameChange = (value) => {
    setName(value)
    if (!slug.trim()) {
      setSlug(generateSlug(value))
    }
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setIsActive(true)
    setEditingSubcategory(null)
    setSubcategoryImageFile(null)
    setSubcategoryImagePreview('')
    setErrorMessage('')
  }

  const handleEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory)
    setName(subcategory.name || '')
    setSlug(subcategory.slug || '')
    setIsActive(Boolean(subcategory.is_active))
    setSubcategoryImagePreview(subcategory.image_url || '')
    setSubcategoryImageFile(null)
    setMessage('')
    setErrorMessage('')
  }

  const uploadImage = async (file) => {
    if (!file) return ''

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `categories/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  const handleSubcategoryImageChange = (file) => {
    if (!file) return
    setSubcategoryImageFile(file)
    setSubcategoryImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    if (!name.trim()) {
      setErrorMessage('من فضلك اكتب اسم القسم الفرعي')
      setSaving(false)
      return
    }

    const cleanSlug = slug.trim() ? generateSlug(slug) : generateSlug(name)

    try {
      let imageUrl = editingSubcategory?.image_url || ''

      if (subcategoryImageFile) {
        imageUrl = await uploadImage(subcategoryImageFile)
      }

      if (editingSubcategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            slug: cleanSlug,
            is_active: isActive,
            image_url: imageUrl || null,
          })
          .eq('id', editingSubcategory.id)

        if (error) {
          throw error
        }

        setMessage('تم تحديث القسم الفرعي بنجاح')
      } else {
        const { error } = await supabase.from('categories').insert([
          {
            name: name.trim(),
            slug: cleanSlug,
            is_active: isActive,
            parent_id: category.id,
            image_url: subcategoryImageFile ? await uploadImage(subcategoryImageFile) : null,
          },
        ])

        if (error) {
          throw error
        }

        setMessage('تم إضافة القسم الفرعي بنجاح')
      }

      resetForm()
      onRefresh()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleSubcategoryStatus = async (subcategory) => {
    setErrorMessage('')

    const { error } = await supabase
      .from('categories')
      .update({ is_active: !subcategory.is_active })
      .eq('id', subcategory.id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    onRefresh()
  }

  const deleteSubcategory = async (id) => {
    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذا القسم الفرعي؟')

    if (!confirmDelete) return

    setErrorMessage('')

    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    onRefresh()
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h4 className="font-black text-slate-950">
            أقسام فرعية داخل: {category.name}
          </h4>
          <p className="text-slate-500 text-sm font-bold mt-1">
            أضف أقساماً داخل هذا القسم الرئيسي
          </p>
        </div>

        <span className="inline-flex self-start bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-xs font-black">
          {subcategories.length} قسم فرعي
        </span>
      </div>

      {(message || errorMessage) && (
        <div className="space-y-3 mb-4">
          {message && (
            <div className="bg-green-50 border border-green-100 text-green-700 p-3 rounded-xl font-bold text-sm">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl font-bold text-sm">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-4 mb-4"
      >
        <p className="font-black text-slate-900 mb-3">
          {editingSubcategory ? 'تعديل القسم الفرعي' : 'إضافة قسم فرعي جديد'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1.5 text-xs font-black text-slate-700">
              اسم القسم الفرعي *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثال: كاميرات داخلية"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-slate-950 text-right text-sm"
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-black text-slate-700">
              رابط القسم / Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="indoor-cameras"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-slate-950 text-right text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block mb-2 text-xs font-black text-slate-700">
            صورة القسم الفرعي
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="cursor-pointer bg-slate-100 border border-slate-300 rounded-2xl px-4 py-3 font-black text-slate-900 hover:bg-slate-200 transition w-full sm:w-auto text-center">
              اختر صورة
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleSubcategoryImageChange(e.target.files?.[0])}
              />
            </label>

            {subcategoryImagePreview && (
              <img
                src={subcategoryImagePreview}
                alt="معاينة صورة القسم الفرعي"
                className="w-full sm:w-36 h-36 rounded-3xl object-cover border border-slate-200"
              />
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-bold text-slate-700">القسم مفعل</span>
        </label>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full md:w-auto bg-slate-950 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-slate-800 disabled:opacity-60 transition"
          >
            {saving ? 'جاري الحفظ...' : editingSubcategory ? 'حفظ التعديلات' : 'إضافة القسم الفرعي'}
          </button>

          {editingSubcategory && (
            <button
              type="button"
              onClick={resetForm}
              className="mt-4 w-full md:w-auto bg-red-50 text-red-700 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-red-100 transition"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </form>

      {subcategories.length === 0 ? (
        <div className="text-center py-6 text-slate-500 font-bold text-sm">
          لا توجد أقسام فرعية داخل هذا القسم بعد
        </div>
      ) : (
        <div className="space-y-2">
          {subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-black text-slate-950">{subcategory.name}</p>
                <p className="text-slate-500 text-xs font-bold mt-0.5">
                  {subcategory.slug || 'بدون رابط'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {subcategory.image_url ? (
                  <img
                    src={subcategory.image_url}
                    alt={subcategory.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black border border-slate-200">
                    صورة
                  </div>
                )}

                <span
                  className={
                    subcategory.is_active
                      ? 'inline-flex bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-black'
                      : 'inline-flex bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-black'
                  }
                >
                  {subcategory.is_active ? 'مفعل' : 'غير مفعل'}
                </span>

                <button
                  type="button"
                  onClick={() => handleEditSubcategory(subcategory)}
                  className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-black text-xs hover:bg-blue-100 transition"
                >
                  تعديل
                </button>

                <button
                  type="button"
                  onClick={() => toggleSubcategoryStatus(subcategory)}
                  className={
                    subcategory.is_active
                      ? 'bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg font-black text-xs hover:bg-yellow-100 transition'
                      : 'bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-black text-xs hover:bg-green-100 transition'
                  }
                >
                  {subcategory.is_active ? 'تعطيل' : 'تفعيل'}
                </button>

                <button
                  type="button"
                  onClick={() => deleteSubcategory(subcategory.id)}
                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-black text-xs hover:bg-red-100 transition"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
