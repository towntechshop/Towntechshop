import { Fragment, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CategorySubcategoriesPanel from './CategorySubcategoriesPanel'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryImageFile, setCategoryImageFile] = useState(null)
  const [categoryImagePreview, setCategoryImagePreview] = useState('')
  const [expandedCategoryId, setExpandedCategoryId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const toggleSubcategoriesPanel = (categoryId) => {
    setExpandedCategoryId((current) =>
      current === categoryId ? null : categoryId
    )
  }

  const getCategories = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      const allCategories = data || []
      const parentCategories = allCategories
        .filter((category) => !category.parent_id)
        .map((category) => ({
          ...category,
          subcategories: allCategories.filter(
            (item) => item.parent_id === category.id
          ),
        }))

      setCategories(parentCategories)
    }

    setLoading(false)
  }

  useEffect(() => {
    getCategories()
  }, [])

  const generateSlug = (value) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')
  }

  const handleNameChange = (value) => {
    setName(value)

    if (!slug.trim()) {
      setSlug(generateSlug(value))
    }
  }

  const uploadCategoryImage = async (file) => {
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

  const handleCategoryImageChange = (file) => {
    if (!file) return
    setCategoryImageFile(file)
    setCategoryImagePreview(URL.createObjectURL(file))
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setIsActive(true)
    setEditingCategory(null)
    setCategoryImageFile(null)
    setCategoryImagePreview('')
    setMessage('')
    setErrorMessage('')
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setName(category.name || '')
    setSlug(category.slug || '')
    setIsActive(Boolean(category.is_active))
    setCategoryImagePreview(category.image_url || '')
    setCategoryImageFile(null)
    setMessage('')
    setErrorMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSaving(true)
    setMessage('')
    setErrorMessage('')

    if (!name.trim()) {
      setErrorMessage('من فضلك اكتب اسم القسم')
      setSaving(false)
      return
    }

    const cleanSlug = slug.trim() ? generateSlug(slug) : generateSlug(name)

    try {
      let imageUrl = editingCategory?.image_url || ''

      if (categoryImageFile) {
        imageUrl = await uploadCategoryImage(categoryImageFile)
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            slug: cleanSlug,
            is_active: isActive,
            image_url: imageUrl || null,
          })
          .eq('id', editingCategory.id)

        if (error) {
          throw error
        }

        setMessage('تم تحديث القسم بنجاح')
      } else {
        const { error } = await supabase.from('categories').insert([
          {
            name: name.trim(),
            slug: cleanSlug,
            is_active: isActive,
            parent_id: null,
            image_url: categoryImageFile ? await uploadCategoryImage(categoryImageFile) : null,
          },
        ])

        if (error) {
          throw error
        }

        setMessage('تم إضافة القسم بنجاح')
      }

      resetForm()
      getCategories()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleCategoryStatus = async (category) => {
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('categories')
      .update({
        is_active: !category.is_active,
      })
      .eq('id', category.id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    getCategories()
  }

  const deleteCategory = async (id) => {
    const confirmDelete = window.confirm(
      'هل أنت متأكد من حذف هذا القسم؟ سيتم حذف الأقسام الفرعية داخله أيضاً. المنتجات لن تُحذف.'
    )

    if (!confirmDelete) return

    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setMessage('تم حذف القسم بنجاح')
    getCategories()
  }

  const activeCount = categories.filter((category) => category.is_active).length
  const inactiveCount = categories.filter((category) => !category.is_active).length

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-slate-500 mt-2 max-w-xl font-medium">
            لوحة بسيطة واحترافية لإدارة الأقسام الرئيسية والفرعية مع معاينة الصورة والحالة بسرعة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
          <div className="bg-white rounded-3xl px-4 py-4 text-center shadow-sm border border-slate-200">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black mb-2">
              الإجمالي
            </p>
            <p className="text-2xl font-black text-slate-950">{categories.length}</p>
          </div>

          <div className="bg-white rounded-3xl px-4 py-4 text-center shadow-sm border border-slate-200">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black mb-2">
              مفعلة
            </p>
            <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
          </div>

          <div className="bg-white rounded-3xl px-4 py-4 text-center shadow-sm border border-slate-200">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black mb-2">
              غير مفعلة
            </p>
            <p className="text-2xl font-black text-rose-600">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {(message || errorMessage) && (
        <div className="mb-5">
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

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5 items-start">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 xl:sticky xl:top-6"
        >
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-black text-slate-950">
              {editingCategory ? 'تعديل قسم رئيسي' : 'إضافة قسم رئيسي'}
            </h2>

            <p className="text-slate-500 mt-1 font-bold text-sm">
              الأقسام الفرعية تُضاف من داخل كل قسم رئيسي
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-black text-slate-700">
                اسم القسم *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="مثال: كاميرات مراقبة"
                className="w-full border border-slate-300 rounded-3xl px-4 py-3 outline-none focus:border-slate-950 text-right bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-black text-slate-700">
                صورة القسم
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="cursor-pointer inline-flex items-center justify-center bg-slate-100 border border-slate-300 rounded-3xl px-4 py-3 font-black text-slate-900 hover:bg-slate-200 transition w-full sm:w-auto text-center">
                  اختر صورة
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleCategoryImageChange(e.target.files?.[0])}
                  />
                </label>

                {categoryImagePreview && (
                  <img
                    src={categoryImagePreview}
                    alt="معاينة صورة القسم"
                    className="w-full sm:w-24 h-24 rounded-3xl object-cover border border-slate-200"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-black text-slate-700">
                رابط القسم / Slug
              </label>

              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="security-cameras"
                className="w-full border border-slate-300 rounded-3xl px-4 py-3 outline-none focus:border-slate-950 text-right bg-slate-50"
              />

              <p className="text-xs text-slate-500 mt-2 leading-6">
                استخدم رابطاً بسيطاً بالانجليزية بدون مسافات.
              </p>
            </div>

            <label className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 mt-1"
              />

              <div>
                <p className="font-black text-slate-900">
                  القسم مفعل
                </p>

                <p className="text-slate-500 text-sm font-bold mt-1">
                  عند التفعيل يظهر القسم داخل الموقع
                </p>
              </div>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60 transition"
            >
              {saving
                ? 'جاري الحفظ...'
                : editingCategory
                ? 'حفظ التعديلات'
                : 'إضافة القسم'}
            </button>
          </div>
        </form>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                قائمة الأقسام الرئيسية
              </h2>

              <p className="text-slate-500 mt-1 font-bold text-sm">
                الأقسام الرئيسية فقط — الأقسام الفرعية تُدار من داخل كل قسم
              </p>
            </div>

            <button
              type="button"
              onClick={getCategories}
              className="w-full md:w-auto bg-slate-100 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-200 transition"
            >
              تحديث
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full md:w-auto bg-red-50 text-red-700 px-5 py-3 rounded-2xl font-black hover:bg-red-100 transition"
              >
                إلغاء التعديل
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-20 bg-slate-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-4xl mb-4">
                📁
              </div>

              <h3 className="text-2xl font-black text-slate-950">
                لا توجد أقسام
              </h3>

              <p className="text-slate-500 mt-2 font-bold">
                أضف أول قسم من النموذج الموجود بجانب القائمة.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-fixed text-right">
                  <colgroup>
                    <col className="w-[88px]" />
                    <col />
                    <col className="w-[140px]" />
                    <col className="w-[120px]" />
                    <col className="w-[260px]" />
                  </colgroup>
                  <thead className="bg-slate-100">
                    <tr>
                          <th className="p-4 font-black text-slate-700">
                        الصورة
                      </th>

                      <th className="p-4 font-black text-slate-700">
                        اسم القسم
                      </th>

                      <th className="p-4 font-black text-slate-700">
                        الرابط
                      </th>

                      <th className="p-4 font-black text-slate-700">
                        الحالة
                      </th>

                      <th className="p-4 font-black text-slate-700">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {categories.map((category) => {
                      const subcategoryCount = category.subcategories?.length || 0
                      const isExpanded = expandedCategoryId === category.id

                      return (
                        <Fragment key={category.id}>
                          <tr
                            className="border-t border-slate-200 hover:bg-slate-50 transition"
                          >
                            <td className="p-4">
                              {category.image_url ? (
                                <img
                                  src={category.image_url}
                                  alt={category.name}
                                  className="w-16 h-16 rounded-2xl object-cover"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                  صورة
                                </div>
                              )}
                            </td>

                            <td className="p-4">
                              <p className="font-black text-slate-950">
                                {category.name}
                              </p>

                              {subcategoryCount > 0 && (
                                <p className="text-slate-500 text-xs font-bold mt-1">
                                  {subcategoryCount} قسم فرعي
                                </p>
                              )}
                            </td>

                            <td className="p-4 text-slate-500 font-bold">
                              {category.slug || '-'}
                            </td>

                            <td className="p-4">
                              <span
                                className={
                                  category.is_active
                                    ? 'inline-flex bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-black'
                                    : 'inline-flex bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-black'
                                }
                              >
                                {category.is_active ? 'مفعل' : 'غير مفعل'}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditCategory(category)}
                                  className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-black hover:bg-blue-100 transition"
                                >
                                  تعديل
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleSubcategoriesPanel(category.id)}
                                  className={
                                    isExpanded
                                      ? 'bg-sky-100 text-sky-800 px-4 py-2 rounded-xl font-black hover:bg-sky-200 transition'
                                      : 'bg-sky-50 text-sky-700 px-4 py-2 rounded-xl font-black hover:bg-sky-100 transition'
                                  }
                                >
                                  {isExpanded ? 'إخفاء الأقسام الفرعية' : 'الأقسام الفرعية'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleCategoryStatus(category)}
                                  className={
                                    category.is_active
                                      ? 'bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl font-black hover:bg-yellow-100 transition'
                                      : 'bg-green-50 text-green-700 px-4 py-2 rounded-xl font-black hover:bg-green-100 transition'
                                  }
                                >
                                  {category.is_active ? 'تعطيل' : 'تفعيل'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteCategory(category.id)}
                                  className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black hover:bg-red-100 transition"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={4} className="p-4 bg-slate-50/50">
                                <CategorySubcategoriesPanel
                                  category={category}
                                  onRefresh={getCategories}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-3">
                {categories.map((category) => {
                  const subcategoryCount = category.subcategories?.length || 0
                  const isExpanded = expandedCategoryId === category.id

                  return (
                    <div
                      key={category.id}
                      className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-3xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-black">
                            {category.image_url ? (
                              <img
                                src={category.image_url}
                                alt={category.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              'صورة'
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-black text-slate-950 text-lg truncate">
                              {category.name}
                            </h3>

                            <p className="text-slate-500 text-sm mt-1 truncate">
                              {category.slug || 'بدون رابط'}
                            </p>

                            {subcategoryCount > 0 && (
                              <p className="text-slate-500 text-xs mt-1">
                                {subcategoryCount} قسم فرعي
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={
                            category.is_active
                              ? 'bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-black'
                              : 'bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-black'
                          }
                        >
                          {category.is_active ? 'مفعل' : 'غير مفعل'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => handleEditCategory(category)}
                          className="w-full bg-slate-100 text-slate-900 px-4 py-3 rounded-3xl font-black hover:bg-slate-200 transition"
                        >
                          تعديل
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCategoryStatus(category)}
                          className={
                            category.is_active
                              ? 'w-full bg-emerald-50 text-emerald-700 px-4 py-3 rounded-3xl font-black hover:bg-emerald-100 transition'
                              : 'w-full bg-slate-100 text-slate-900 px-4 py-3 rounded-3xl font-black hover:bg-slate-200 transition'
                          }
                        >
                          {category.is_active ? 'معطل' : 'تفعيل'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSubcategoriesPanel(category.id)}
                          className={
                            isExpanded
                              ? 'sm:col-span-2 w-full bg-slate-900 text-white px-4 py-3 rounded-3xl font-black hover:bg-slate-800 transition'
                              : 'sm:col-span-2 w-full bg-slate-100 text-slate-900 px-4 py-3 rounded-3xl font-black hover:bg-slate-200 transition'
                          }
                        >
                          {isExpanded ? 'إخفاء الفرعية' : 'عرض الفرعية'}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCategory(category.id)}
                          className="sm:col-span-2 w-full bg-rose-50 text-rose-600 px-4 py-3 rounded-3xl font-black hover:bg-rose-100 transition"
                        >
                          حذف
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4">
                          <CategorySubcategoriesPanel
                            category={category}
                            onRefresh={getCategories}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}