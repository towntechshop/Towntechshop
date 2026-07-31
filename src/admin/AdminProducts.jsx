import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PRODUCTS_PER_PAGE = 10

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE) || 1

  const getCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (!error) {
      setCategories(data || [])
    }
  }

  const getProducts = async () => {
    setLoading(true)
    setErrorMessage('')

    let query = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' })

    if (searchTerm.trim() !== '') {
      const keyword = searchTerm.trim()

      query = query.or(
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%,brand.ilike.%${keyword}%,sku.ilike.%${keyword}%`
      )
    }

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory)
    }

    if (visibilityFilter === 'visible') {
      query = query.eq('is_visible', true)
    }

    if (visibilityFilter === 'hidden') {
      query = query.eq('is_visible', false)
    }

    if (featuredFilter === 'featured') {
      query = query.eq('is_featured', true)
    }

    if (featuredFilter === 'not_featured') {
      query = query.eq('is_featured', false)
    }

    if (stockFilter === 'in_stock') {
      query = query.eq('is_in_stock', true)
    }

    if (stockFilter === 'out_of_stock') {
      query = query.eq('is_in_stock', false)
    }

    const from = (currentPage - 1) * PRODUCTS_PER_PAGE
    const to = from + PRODUCTS_PER_PAGE - 1

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      setErrorMessage(error.message)
      setProducts([])
      setTotalProducts(0)
    } else {
      setProducts(data || [])
      setTotalProducts(count || 0)
    }

    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    setSearchTerm(searchInput)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setSelectedCategory('all')
    setVisibilityFilter('all')
    setFeaturedFilter('all')
    setStockFilter('all')
    setCurrentPage(1)
  }

  const toggleVisibility = async (product) => {
    const { error } = await supabase
      .from('products')
      .update({
        is_visible: !product.is_visible,
      })
      .eq('id', product.id)

    if (error) {
      alert(error.message)
      return
    }

    getProducts()
  }

  const toggleFeatured = async (product) => {
    const { error } = await supabase
      .from('products')
      .update({
        is_featured: !product.is_featured,
      })
      .eq('id', product.id)

    if (error) {
      alert(error.message)
      return
    }

    getProducts()
  }

  const toggleStock = async (product) => {
    const currentStockStatus = product.is_in_stock !== false

    const { error } = await supabase
      .from('products')
      .update({
        is_in_stock: !currentStockStatus,
      })
      .eq('id', product.id)

    if (error) {
      alert(error.message)
      return
    }

    getProducts()
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('هل تريد حذف هذا المنتج؟')

    if (!confirmDelete) return

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    getProducts()
  }

  const getDisplayPrice = (product) => {
    const salePrice = product.sale_price || product.price
    const regularPrice = product.regular_price || product.price

    if (!salePrice && !regularPrice) {
      return {
        main: '-',
        old: null,
      }
    }

    const hasDiscount =
      salePrice && regularPrice && Number(regularPrice) > Number(salePrice)

    return {
      main: salePrice || regularPrice,
      old: hasDiscount ? regularPrice : null,
    }
  }

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('en-US')
  }

  const getCategoryName = (categoryId) => {
    if (categoryId === 'all') return 'كل الأقسام'

    const category = categories.find((item) => item.id === categoryId)

    return category?.name || 'قسم محدد'
  }

  useEffect(() => {
    getCategories()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, visibilityFilter, featuredFilter, stockFilter])

  useEffect(() => {
    getProducts()
  }, [
    searchTerm,
    selectedCategory,
    visibilityFilter,
    featuredFilter,
    stockFilter,
    currentPage,
  ])

  const filtersActive =
    searchTerm ||
    selectedCategory !== 'all' ||
    visibilityFilter !== 'all' ||
    featuredFilter !== 'all' ||
    stockFilter !== 'all'

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-slate-500 mt-2 font-bold">
            إدارة منتجات الموقع والأسعار والمخزون والظهور
          </p>
        </div>

        <Link
          to="/admin/products/add"
          className="w-full md:w-auto bg-slate-950 text-white px-6 py-4 rounded-2xl font-black text-center hover:bg-slate-800 transition"
        >
          إضافة منتج
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            إجمالي النتائج
          </p>

          <h3 className="text-2xl md:text-3xl font-black text-slate-950 mt-2">
            {totalProducts}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            منتجات الصفحة
          </p>

          <h3 className="text-2xl md:text-3xl font-black text-slate-950 mt-2">
            {products.length}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            القسم الحالي
          </p>

          <h3 className="text-sm md:text-lg font-black text-blue-600 mt-3 truncate">
            {getCategoryName(selectedCategory)}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            الفلاتر
          </p>

          <h3
            className={
              filtersActive
                ? 'text-sm md:text-lg font-black text-green-600 mt-3'
                : 'text-sm md:text-lg font-black text-slate-950 mt-3'
            }
          >
            {filtersActive ? 'مفعلة' : 'غير مفعلة'}
          </h3>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث باسم المنتج أو البراند أو الكود أو الوصف..."
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
            />
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleSearch}
              className="bg-slate-950 text-white px-5 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
            >
              بحث
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-slate-100 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-200 transition"
            >
              {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
            </button>

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl font-black hover:bg-red-100 transition"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
            >
              <option value="all">كل الأقسام</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
            >
              <option value="all">كل حالات الظهور</option>
              <option value="visible">ظاهر</option>
              <option value="hidden">مخفي</option>
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
            >
              <option value="all">كل المنتجات</option>
              <option value="featured">منتجات مميزة</option>
              <option value="not_featured">منتجات عادية</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
            >
              <option value="all">كل حالات المخزون</option>
              <option value="in_stock">متوفر</option>
              <option value="out_of_stock">غير متوفر</option>
            </select>
          </div>
        )}

        <p className="text-sm text-slate-500 mt-3 font-bold">
          يتم عرض {products.length} من أصل {totalProducts} منتج
          {searchTerm && ` • بحث: ${searchTerm}`}
        </p>
      </section>

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-6 font-bold">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 bg-slate-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-4xl mb-4">
            📦
          </div>

          <h3 className="text-2xl font-black text-slate-950">
            لا توجد منتجات
          </h3>

          <p className="text-slate-500 mt-2 mb-6 font-bold">
            لا توجد منتجات مطابقة للفلاتر الحالية.
          </p>

          <Link
            to="/admin/products/add"
            className="inline-flex bg-slate-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
          >
            إضافة منتج
          </Link>
        </div>
      ) : (
        <>
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-200">
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                قائمة المنتجات
              </h2>

              <p className="text-slate-500 mt-1 font-bold text-sm">
                تعديل المنتجات وحالة الظهور والمخزون والتمييز
              </p>
            </div>

            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-right min-w-[1250px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 font-black text-slate-700">الصورة</th>
                    <th className="p-4 font-black text-slate-700">المنتج</th>
                    <th className="p-4 font-black text-slate-700">القسم</th>
                    <th className="p-4 font-black text-slate-700">السعر</th>
                    <th className="p-4 font-black text-slate-700">الكمية</th>
                    <th className="p-4 font-black text-slate-700">المخزون</th>
                    <th className="p-4 font-black text-slate-700">الظهور</th>
                    <th className="p-4 font-black text-slate-700">التمييز</th>
                    <th className="p-4 font-black text-slate-700">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const price = getDisplayPrice(product)

                    return (
                      <tr
                        key={product.id}
                        className="border-t border-slate-200 hover:bg-slate-50 transition"
                      >
                        <td className="p-4">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-16 h-16 object-contain rounded-2xl border border-slate-200 bg-white p-1"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                              صورة
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-black text-slate-950 max-w-[320px]">
                            {product.title}
                          </div>

                          <div className="text-sm text-slate-500 mt-1 font-bold">
                            {product.brand ? product.brand : 'بدون براند'}
                            {product.sku ? ` • ${product.sku}` : ''}
                          </div>
                        </td>

                        <td className="p-4 text-slate-700 font-bold">
                          {product.categories?.name || '-'}
                        </td>

                        <td className="p-4">
                          <div className="font-black text-slate-950">
                            {price.main !== '-'
                              ? `${formatMoney(price.main)} جنيه`
                              : '-'}
                          </div>

                          {price.old && (
                            <div className="text-sm text-slate-400 line-through font-bold">
                              {formatMoney(price.old)} جنيه
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="text-2xl font-black text-slate-950">
                            {product.stock_quantity ?? 0}
                          </div>

                          <div className="text-xs text-slate-500 mt-1 font-bold">
                            قطعة متاحة
                          </div>
                        </td>

                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => toggleStock(product)}
                            className={
                              product.is_in_stock === false
                                ? 'px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-black text-sm hover:bg-red-100 transition'
                                : 'px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-black text-sm hover:bg-green-100 transition'
                            }
                          >
                            {product.is_in_stock === false
                              ? 'غير متوفر'
                              : 'متوفر'}
                          </button>
                        </td>

                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => toggleVisibility(product)}
                            className={
                              product.is_visible
                                ? 'px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-black text-sm hover:bg-green-100 transition'
                                : 'px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-black text-sm hover:bg-red-100 transition'
                            }
                          >
                            {product.is_visible ? 'ظاهر' : 'مخفي'}
                          </button>
                        </td>

                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => toggleFeatured(product)}
                            className={
                              product.is_featured
                                ? 'px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-black text-sm hover:bg-blue-100 transition'
                                : 'px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition'
                            }
                          >
                            {product.is_featured ? 'مميز' : 'عادي'}
                          </button>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/admin/products/edit/${product.id}`}
                              className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-black hover:bg-blue-100 transition"
                            >
                              تعديل
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black hover:bg-red-100 transition"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="xl:hidden p-4 space-y-4">
              {products.map((product) => {
                const price = getDisplayPrice(product)

                return (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-2">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold">
                            صورة
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-950 text-base leading-7">
                          {product.title}
                        </h3>

                        <p className="text-slate-500 text-sm font-bold mt-1">
                          {product.categories?.name || 'بدون قسم'}
                        </p>

                        <p className="text-slate-500 text-sm font-bold mt-1">
                          {product.brand ? product.brand : 'بدون براند'}
                          {product.sku ? ` • ${product.sku}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-xs font-bold">السعر</p>

                        <p className="text-slate-950 font-black mt-1">
                          {price.main !== '-'
                            ? `${formatMoney(price.main)} جنيه`
                            : '-'}
                        </p>

                        {price.old && (
                          <p className="text-slate-400 text-xs line-through font-bold mt-1">
                            {formatMoney(price.old)} جنيه
                          </p>
                        )}
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-xs font-bold">المخزون</p>

                        <p className="text-slate-950 font-black mt-1">
                          {product.stock_quantity ?? 0} قطعة
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => toggleStock(product)}
                        className={
                          product.is_in_stock === false
                            ? 'bg-red-50 text-red-700 px-3 py-3 rounded-xl font-black hover:bg-red-100 transition'
                            : 'bg-green-50 text-green-700 px-3 py-3 rounded-xl font-black hover:bg-green-100 transition'
                        }
                      >
                        {product.is_in_stock === false ? 'غير متوفر' : 'متوفر'}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleVisibility(product)}
                        className={
                          product.is_visible
                            ? 'bg-green-50 text-green-700 px-3 py-3 rounded-xl font-black hover:bg-green-100 transition'
                            : 'bg-red-50 text-red-700 px-3 py-3 rounded-xl font-black hover:bg-red-100 transition'
                        }
                      >
                        {product.is_visible ? 'ظاهر' : 'مخفي'}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFeatured(product)}
                        className={
                          product.is_featured
                            ? 'bg-blue-50 text-blue-700 px-3 py-3 rounded-xl font-black hover:bg-blue-100 transition'
                            : 'bg-slate-100 text-slate-600 px-3 py-3 rounded-xl font-black hover:bg-slate-200 transition'
                        }
                      >
                        {product.is_featured ? 'مميز' : 'عادي'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl font-black text-center hover:bg-blue-100 transition"
                      >
                        تعديل
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-black hover:bg-red-100 transition"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 mt-4">
              <p className="text-sm text-slate-500 font-bold text-center sm:text-right">
                صفحة {currentPage} من {totalPages}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-950 font-black hover:bg-slate-200 disabled:opacity-50 transition"
                >
                  السابق
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-5 py-3 rounded-2xl bg-slate-950 text-white font-black hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}