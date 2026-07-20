import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Field, SectionTitle } from './components/AdminFormFields'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [allCategories, setAllCategories] = useState([])
  const [parentCategoryId, setParentCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')

  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')

  const [regularPrice, setRegularPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('')
  const [isInStock, setIsInStock] = useState(true)

  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [newCoverImage, setNewCoverImage] = useState(null)

  const [currentGalleryUrls, setCurrentGalleryUrls] = useState([])
  const [newGalleryImages, setNewGalleryImages] = useState([])

  const [isVisible, setIsVisible] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const parentCategories = allCategories.filter((category) => !category.parent_id)

  const subcategories = parentCategoryId
    ? allCategories.filter((category) => category.parent_id === parentCategoryId)
    : []

  const applyProductCategory = (categoryId, categoriesList) => {
    if (!categoryId) {
      setParentCategoryId('')
      setSubcategoryId('')
      return
    }

    const selectedCategory = categoriesList.find(
      (category) => category.id === categoryId
    )

    if (!selectedCategory) {
      setParentCategoryId('')
      setSubcategoryId('')
      return
    }

    if (selectedCategory.parent_id) {
      setParentCategoryId(selectedCategory.parent_id)
      setSubcategoryId(selectedCategory.id)
      return
    }

    setParentCategoryId(selectedCategory.id)
    setSubcategoryId('')
  }

  const getProduct = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setTitle(data.title || '')
    setBrand(data.brand || '')
    setSku(data.sku || '')
    setDescription(data.description || '')

    setRegularPrice(
      data.regular_price !== null && data.regular_price !== undefined
        ? data.regular_price
        : data.price || ''
    )

    setSalePrice(
      data.sale_price !== null && data.sale_price !== undefined
        ? data.sale_price
        : ''
    )

    setStockQuantity(
      data.stock_quantity !== null && data.stock_quantity !== undefined
        ? data.stock_quantity
        : 0
    )

    setIsInStock(data.is_in_stock !== false)
    setCurrentImageUrl(data.image_url || '')
    setCurrentGalleryUrls(
      Array.isArray(data.gallery_urls) ? data.gallery_urls : []
    )

    setIsVisible(data.is_visible !== false)
    setIsFeatured(Boolean(data.is_featured))

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    const categoriesList = categoriesData || []
    setAllCategories(categoriesList)
    applyProductCategory(data.category_id || '', categoriesList)

    setLoading(false)
  }

  useEffect(() => {
    getProduct()
  }, [id])

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop()

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`

    const filePath = `products/${fileName}`

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

  const removeGalleryImage = (imageUrl) => {
    setCurrentGalleryUrls((prev) => prev.filter((url) => url !== imageUrl))
  }

  const removeNewGalleryImage = (index) => {
    setNewGalleryImages((prev) =>
      prev.filter((_, imageIndex) => imageIndex !== index)
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage('')

    try {
      let imageUrl = currentImageUrl

      if (newCoverImage) {
        imageUrl = await uploadImage(newCoverImage)
      }

      let uploadedGalleryUrls = []

      if (newGalleryImages.length > 0) {
        uploadedGalleryUrls = await Promise.all(
          newGalleryImages.map((file) => uploadImage(file))
        )
      }

      const finalGalleryUrls = [
        ...currentGalleryUrls,
        ...uploadedGalleryUrls,
      ]

      const finalRegularPrice = regularPrice ? Number(regularPrice) : null
      const finalSalePrice = salePrice ? Number(salePrice) : null
      const finalPrice = finalSalePrice || finalRegularPrice

      const { error: updateError } = await supabase
        .from('products')
        .update({
          title,
          brand,
          sku,
          description,
          regular_price: finalRegularPrice,
          sale_price: finalSalePrice,
          price: finalPrice,
          stock_quantity: stockQuantity ? Number(stockQuantity) : 0,
          is_in_stock: isInStock,
          image_url: imageUrl,
          gallery_urls: finalGalleryUrls,
          is_visible: isVisible,
          is_featured: isFeatured,
          category_id: subcategoryId || parentCategoryId || null,
        })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      navigate('/admin/products')
    } catch (error) {
      setErrorMessage(error.message || 'حدث خطأ أثناء حفظ المنتج')
    } finally {
      setSaving(false)
    }
  }

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('en-US')
  }

  const getFinalPricePreview = () => {
    const finalRegularPrice = regularPrice ? Number(regularPrice) : 0
    const finalSalePrice = salePrice ? Number(salePrice) : 0

    if (finalSalePrice > 0) return finalSalePrice
    if (finalRegularPrice > 0) return finalRegularPrice

    return 0
  }

  if (loading) {
    return (
      <div dir="rtl">
        <div className="mb-6">
          <Link
            to="/admin/products"
            className="inline-flex bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition mb-4"
          >
            الرجوع للمنتجات
          </Link>

          <h1 className="text-2xl md:text-4xl font-black text-slate-950">
            تعديل المنتج
          </h1>

          <p className="text-slate-500 mt-2 font-bold">
            جاري تحميل بيانات المنتج...
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <div className="space-y-5">
            <div className="h-80 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
            <div className="h-72 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
          </div>

          <div className="h-96 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            to="/admin/products"
            className="inline-flex bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition mb-4"
          >
            الرجوع للمنتجات
          </Link>

          <h1 className="text-2xl md:text-4xl font-black text-slate-950">
            تعديل المنتج
          </h1>

          <p className="text-slate-500 mt-2 font-bold">
            تعديل بيانات المنتج والسعر والمخزون والصور وحالة النشر
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl font-bold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
          <div className="space-y-5">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <SectionTitle
                title="البيانات الأساسية"
                description="اسم المنتج والبراند والكود والقسم والوصف"
              />

              <div className="space-y-5">
                <Field label="اسم المنتج">
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="البراند">
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                      placeholder="مثال: Hikvision, Dahua, DELL"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </Field>

                  <Field label="كود المنتج SKU">
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-left"
                      placeholder="SKU-001"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      dir="ltr"
                    />
                  </Field>
                </div>

                <Field label="القسم الرئيسي">
                  <select
                    value={parentCategoryId}
                    onChange={(e) => {
                      setParentCategoryId(e.target.value)
                      setSubcategoryId('')
                    }}
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
                  >
                    <option value="">بدون قسم</option>

                    {parentCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} {!category.is_active ? '(غير مفعل)' : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                {subcategories.length > 0 && (
                  <Field label="القسم الفرعي">
                    <select
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
                    >
                      <option value="">بدون قسم فرعي</option>

                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}{' '}
                          {!subcategory.is_active ? '(غير مفعل)' : ''}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                <Field label="وصف المنتج">
                  <textarea
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 min-h-36 text-right leading-8"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <SectionTitle
                title="السعر والمخزون"
                description="تعديل السعر قبل وبعد الخصم وكمية المخزون"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field label="السعر الأساسي">
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 pl-16 outline-none focus:border-slate-950 text-right"
                      placeholder="السعر قبل الخصم"
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(e.target.value)}
                      min="0"
                    />

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">
                      جنيه
                    </span>
                  </div>
                </Field>

                <Field label="سعر البيع">
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 pl-16 outline-none focus:border-slate-950 text-right"
                      placeholder="السعر الحالي"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      min="0"
                    />

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">
                      جنيه
                    </span>
                  </div>
                </Field>

                <Field label="كمية المخزون">
                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                    placeholder="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    min="0"
                  />
                </Field>
              </div>

              <label className="mt-5 flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer">
                <input
                  id="isInStock"
                  type="checkbox"
                  checked={isInStock}
                  onChange={(e) => setIsInStock(e.target.checked)}
                  className="w-5 h-5 mt-1"
                />

                <div>
                  <p className="font-black text-slate-950">
                    المنتج متوفر في المخزون
                  </p>

                  <p className="text-slate-500 text-sm font-bold mt-1">
                    لو اتقفلت، المنتج هيظهر كغير متوفر حتى لو الكمية أكبر من صفر.
                  </p>
                </div>
              </label>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <SectionTitle
                title="صور المنتج"
                description="تغيير صورة الغلاف وإضافة أو حذف صور المعرض"
              />

              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                <div>
                  <Field label="صورة الغلاف الحالية / الجديدة">
                    <div className="w-full aspect-square bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden flex items-center justify-center p-3">
                      {newCoverImage ? (
                        <img
                          src={URL.createObjectURL(newCoverImage)}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : currentImageUrl ? (
                        <img
                          src={currentImageUrl}
                          alt={title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 font-black">
                          بدون صورة
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                <div className="space-y-5">
                  <Field
                    label="استبدال صورة الغلاف"
                    hint="ارفع صورة جديدة لو حابب تغير صورة المنتج الرئيسية."
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 bg-white"
                      onChange={(e) =>
                        setNewCoverImage(e.target.files?.[0] || null)
                      }
                    />
                  </Field>

                  {newCoverImage && (
                    <button
                      type="button"
                      onClick={() => setNewCoverImage(null)}
                      className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl font-black hover:bg-red-100 transition"
                    >
                      إلغاء الصورة الجديدة
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <Field label="صور المعرض الحالية">
                  {currentGalleryUrls.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-slate-500 font-bold">
                      لا توجد صور حالية في المعرض.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {currentGalleryUrls.map((url) => (
                        <div key={url} className="relative group">
                          <div className="aspect-square bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-2">
                            <img
                              src={url}
                              alt="Gallery"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeGalleryImage(url)}
                            className="absolute top-2 left-2 bg-red-600 text-white text-xs px-3 py-1.5 rounded-xl font-black hover:bg-red-700 transition"
                          >
                            حذف
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              </div>

              <div className="mt-6">
                <Field
                  label="إضافة صور جديدة للمعرض"
                  hint="يمكنك اختيار أكثر من صورة مرة واحدة."
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 bg-white"
                    onChange={(e) =>
                      setNewGalleryImages(Array.from(e.target.files || []))
                    }
                  />
                </Field>

                {newGalleryImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {newGalleryImages.map((image, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-2">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`New Gallery ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeNewGalleryImage(index)}
                          className="absolute top-2 left-2 bg-red-600 text-white text-xs px-3 py-1.5 rounded-xl font-black hover:bg-red-700 transition"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-6">
            <section
              className="rounded-3xl shadow-sm p-5 md:p-6 text-white"
              style={{
                background:
                  'linear-gradient(135deg, #07111F 0%, #0B1F3A 55%, #123D68 100%)',
              }}
            >
              <h2 className="text-xl md:text-2xl font-black">
                ملخص المنتج
              </h2>

              <div className="mt-5 space-y-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/60 text-sm font-bold">
                    اسم المنتج
                  </p>

                  <p className="text-lg font-black mt-2 leading-7">
                    {title || 'بدون اسم'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-white/60 text-sm font-bold">
                      السعر الحالي
                    </p>

                    <p className="text-xl font-black mt-2">
                      {formatMoney(getFinalPricePreview())} جنيه
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-white/60 text-sm font-bold">
                      المخزون
                    </p>

                    <p className="text-xl font-black mt-2">
                      {stockQuantity || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/60 text-sm font-bold">
                    الحالة
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-xs font-black">
                      {isVisible ? 'ظاهر' : 'مخفي'}
                    </span>

                    <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-xs font-black">
                      {isInStock ? 'متوفر' : 'غير متوفر'}
                    </span>

                    {isFeatured && (
                      <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-xs font-black">
                        مميز
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl md:text-2xl font-black text-slate-950 mb-5">
                النشر والظهور
              </h2>

              <div className="space-y-4">
                <label className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer">
                  <input
                    id="isVisible"
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-5 h-5 mt-1"
                  />

                  <div>
                    <p className="font-black text-slate-950">
                      ظاهر في الموقع
                    </p>

                    <p className="text-slate-500 text-sm font-bold mt-1 leading-6">
                      عند إلغاء التفعيل، المنتج لن يظهر للعملاء.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer">
                  <input
                    id="isFeatured"
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-5 h-5 mt-1"
                  />

                  <div>
                    <p className="font-black text-slate-950">
                      منتج مميز
                    </p>

                    <p className="text-slate-500 text-sm font-bold mt-1 leading-6">
                      يستخدم في أقسام المنتجات المميزة داخل الموقع.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-black text-slate-950 mb-3">
                حفظ التعديلات
              </h2>

              <p className="text-slate-500 text-sm font-bold leading-7 mb-5">
                بعد الحفظ سيتم الرجوع تلقائيا إلى صفحة المنتجات.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60 transition"
              >
                {saving ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات'}
              </button>
            </section>
          </aside>
        </div>
      </form>
    </div>
  )
}