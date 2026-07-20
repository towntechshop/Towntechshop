import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AddProduct() {
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

  const [coverImage, setCoverImage] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])

  const [isVisible, setIsVisible] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const getCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (!error) {
      setAllCategories(data || [])
    }
  }

  const parentCategories = allCategories.filter((category) => !category.parent_id)

  const subcategories = parentCategoryId
    ? allCategories.filter(
        (category) =>
          category.parent_id === parentCategoryId && category.is_active
      )
    : []

  useEffect(() => {
    getCategories()
  }, [])

  useEffect(() => {
    setSubcategoryId('')
  }, [parentCategoryId])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      if (!title.trim()) {
        throw new Error('من فضلك اكتب اسم المنتج')
      }

      let coverImageUrl = ''
      let galleryUrls = []

      if (coverImage) {
        coverImageUrl = await uploadImage(coverImage)
      }

      if (galleryImages.length > 0) {
        galleryUrls = await Promise.all(
          galleryImages.map((file) => uploadImage(file))
        )
      }

      const finalRegularPrice = regularPrice ? Number(regularPrice) : null
      const finalSalePrice = salePrice ? Number(salePrice) : null

      const { error: insertError } = await supabase.from('products').insert([
        {
          title: title.trim(),
          brand: brand.trim(),
          sku: sku.trim(),
          description: description.trim(),
          regular_price: finalRegularPrice,
          sale_price: finalSalePrice,
          price: finalSalePrice || finalRegularPrice,
          stock_quantity: stockQuantity ? Number(stockQuantity) : 0,
          is_in_stock: isInStock,
          image_url: coverImageUrl,
          gallery_urls: galleryUrls,
          is_visible: isVisible,
          is_featured: isFeatured,
          category_id: subcategoryId || parentCategoryId || null,
        },
      ])

      if (insertError) {
        throw insertError
      }

      navigate('/admin/products')
    } catch (error) {
      setErrorMessage(error.message || 'حدث خطأ أثناء حفظ المنتج')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-slate-500 mt-2 font-bold">
            أضف بيانات المنتج والصور والأسعار والمخزون
          </p>
        </div>

        <Link
          to="/admin/products"
          className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 px-5 py-3 rounded-2xl font-black text-center hover:bg-slate-50 transition"
        >
          الرجوع للمنتجات
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-5 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl font-bold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
          <div className="space-y-5">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <div className="mb-5">
                <h2 className="text-xl md:text-2xl font-black text-slate-950">
                  بيانات المنتج الأساسية
                </h2>

                <p className="text-slate-500 mt-1 font-bold text-sm">
                  اسم المنتج، البراند، الكود، القسم والوصف
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-black text-slate-700">
                    اسم المنتج *
                  </label>

                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                    placeholder="مثال: كاميرا مراقبة خارجية 2 ميجا"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 text-sm font-black text-slate-700">
                      البراند
                    </label>

                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                      placeholder="Hikvision, Dahua, Town Tech..."
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-black text-slate-700">
                      كود المنتج / SKU
                    </label>

                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                      placeholder="SKU-001"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-black text-slate-700">
                    القسم الرئيسي
                  </label>

                  <select
                    value={parentCategoryId}
                    onChange={(e) => setParentCategoryId(e.target.value)}
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
                  >
                    <option value="">بدون قسم</option>

                    {parentCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {subcategories.length > 0 && (
                  <div>
                    <label className="block mb-2 text-sm font-black text-slate-700">
                      القسم الفرعي
                    </label>

                    <select
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
                    >
                      <option value="">بدون قسم فرعي</option>

                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-black text-slate-700">
                    وصف المنتج
                  </label>

                  <textarea
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 min-h-[130px] text-right"
                    placeholder="اكتب وصف مختصر وواضح للمنتج"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <div className="mb-5">
                <h2 className="text-xl md:text-2xl font-black text-slate-950">
                  الأسعار والمخزون
                </h2>

                <p className="text-slate-500 mt-1 font-bold text-sm">
                  السعر قبل الخصم، سعر البيع، وعدد القطع المتاحة
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block mb-2 text-sm font-black text-slate-700">
                    السعر الأساسي
                  </label>

                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                    placeholder="مثال: 1500"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-black text-slate-700">
                    سعر البيع
                  </label>

                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                    placeholder="مثال: 1350"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-black text-slate-700">
                    كمية المخزون
                  </label>

                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
                    placeholder="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer">
                  <input
                    id="isInStock"
                    type="checkbox"
                    checked={isInStock}
                    onChange={(e) => setIsInStock(e.target.checked)}
                    className="w-5 h-5"
                  />

                  <div>
                    <p className="font-black text-slate-900">
                      المنتج متوفر في المخزون
                    </p>

                    <p className="text-slate-500 text-sm font-bold">
                      عند إلغاء الاختيار سيظهر المنتج كغير متوفر
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <div className="mb-5">
                <h2 className="text-xl md:text-2xl font-black text-slate-950">
                  صور المنتج
                </h2>

                <p className="text-slate-500 mt-1 font-bold text-sm">
                  صورة رئيسية + صور إضافية للمعرض
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-black text-slate-700">
                    الصورة الرئيسية
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 bg-white"
                    onChange={(e) => setCoverImage(e.target.files[0])}
                  />
                </div>

                {coverImage && (
                  <div>
                    <p className="mb-2 text-sm font-black text-slate-700">
                      معاينة الصورة الرئيسية
                    </p>

                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      <img
                        src={URL.createObjectURL(coverImage)}
                        alt="Cover Preview"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-black text-slate-700">
                    صور إضافية
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 bg-white"
                    onChange={(e) => setGalleryImages(Array.from(e.target.files))}
                  />
                </div>

                {galleryImages.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-black text-slate-700">
                      معاينة الصور الإضافية
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {galleryImages.map((image, index) => (
                        <div
                          key={index}
                          className="h-28 rounded-2xl border border-slate-200 bg-slate-50 p-2"
                        >
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-black text-slate-950 mb-5">
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
                    <p className="font-black text-slate-900">
                      ظاهر في الموقع
                    </p>

                    <p className="text-slate-500 text-sm font-bold mt-1">
                      عند التفعيل يظهر المنتج للعملاء
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
                    <p className="font-black text-slate-900">
                      منتج مميز
                    </p>

                    <p className="text-slate-500 text-sm font-bold mt-1">
                      يستخدم في السكاشن المميزة لو موجودة
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-black text-slate-950 mb-4">
                ملخص سريع
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 font-bold">اسم المنتج</span>
                  <span className="text-slate-950 font-black text-left">
                    {title || 'لم يتم إدخاله'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 font-bold">السعر</span>
                  <span className="text-slate-950 font-black">
                    {salePrice || regularPrice || '0'} جنيه
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 font-bold">المخزون</span>
                  <span
                    className={
                      isInStock
                        ? 'text-green-600 font-black'
                        : 'text-red-600 font-black'
                    }
                  >
                    {isInStock ? 'متوفر' : 'غير متوفر'}
                  </span>
                </div>
              </div>
            </section>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60 transition"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
              </button>

              <Link
                to="/admin/products"
                className="mt-3 block w-full bg-slate-100 text-slate-950 px-6 py-4 rounded-2xl font-black text-center hover:bg-slate-200 transition"
              >
                إلغاء
              </Link>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}