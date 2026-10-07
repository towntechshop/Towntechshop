import { useEffect, useMemo, useState } from 'react'
import useSiteSettings from '../../hooks/useSiteSettings'
import usePageSeo from '../../hooks/usePageSeo'
import {
  countProductsByCategory,
  filterNonEmptyCategories,
} from '../../lib/categoryVisibility'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { addToCart } from '../../lib/cart'
import ProductCard from '../ProductCard'
import ProductsCategorySidebar, {
  useProductCountByCategory,
} from './ProductsCategorySidebar'
import CategorySubcategoryNav, {
  CategoryGroupedProducts,
} from './CategorySubcategoryNav'
import {
  getCategoryDescription,
  getCategoryPath,
  getCategoryPathById,
} from '../../lib/categoryUrls'
import {
  getProductPrice,
  isProductInStock as checkInStock,
} from '../../lib/productUtils'

const PER_PAGE_OPTIONS = [12, 24, 48]

export default function ProductListingPage({
  initialCategoryId = 'all',
  initialSubcategoryId = 'all',
}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { features } = useSiteSettings()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [addedProductId, setAddedProductId] = useState(null)

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  )
  const [sortBy, setSortBy] = useState(
    searchParams.get('sort') || 'featured'
  )
  const [activeCategory, setActiveCategory] = useState(initialCategoryId)
  const [activeSubcategory, setActiveSubcategory] = useState(
    initialSubcategoryId
  )

  const [inStockOnly, setInStockOnly] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [priceRange, setPriceRange] = useState('all')
  const [perPage, setPerPage] = useState(24)
  const [currentPage, setCurrentPage] = useState(1)

  const getProductsPageData = async () => {
    setLoading(true)

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name, slug, is_active, parent_id')
      .eq('is_active', true)
      .order('name', { ascending: true })

    const { data: productsData, error } = await supabase
      .from('products')
      .select(
        `
        *,
        categories (
          id,
          name
        )
      `
      )
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error.message)
      setProducts([])
    } else {
      setProducts(productsData || [])
    }

    setCategories(categoriesData || [])
    setLoading(false)
  }

  useEffect(() => {
    getProductsPageData()
  }, [])

  useEffect(() => {
    setActiveCategory(initialCategoryId)
    setActiveSubcategory(initialSubcategoryId)
    setCurrentPage(1)
    setSelectedBrand('')
    setPriceRange('all')
    setInStockOnly(false)
  }, [initialCategoryId, initialSubcategoryId])

  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || ''
    const sortFromUrl = searchParams.get('sort') || 'featured'

    setSearchTerm(searchFromUrl)
    setSortBy(sortFromUrl)
    setCurrentPage(1)
  }, [searchParams])

  // الأقسام الفاضية بتتخفي لو الإعداد مفعّل من لوحة التحكم (القسم المفتوح حالياً يفضل ظاهر)
  const displayCategories = useMemo(() => {
    if (!features.hide_empty_categories || loading) return categories

    const nonEmpty = filterNonEmptyCategories(
      categories,
      countProductsByCategory(products)
    )
    const keepIds = new Set(nonEmpty.map((category) => category.id))

    return categories.filter(
      (category) =>
        keepIds.has(category.id) ||
        category.id === activeCategory ||
        category.id === activeSubcategory
    )
  }, [
    categories,
    products,
    features.hide_empty_categories,
    loading,
    activeCategory,
    activeSubcategory,
  ])

  const parentCategories = useMemo(
    () => displayCategories.filter((category) => !category.parent_id),
    [displayCategories]
  )

  const subcategoriesByParent = useMemo(() => {
    const map = {}

    displayCategories
      .filter((category) => category.parent_id)
      .forEach((subcategory) => {
        if (!map[subcategory.parent_id]) {
          map[subcategory.parent_id] = []
        }

        map[subcategory.parent_id].push(subcategory)
      })

    return map
  }, [displayCategories])

  const productCountByCategory = useProductCountByCategory(products)

  const updateSortParam = (value) => {
    const params = new URLSearchParams(searchParams)

    if (value && value !== 'featured') {
      params.set('sort', value)
    } else {
      params.delete('sort')
    }

    setSearchParams(params, { replace: true })
  }

  const handleAddToCart = (product) => {
    if (!checkInStock(product)) return

    addToCart(product, 1)
    setAddedProductId(product.id)

    setTimeout(() => {
      setAddedProductId(null)
    }, 1200)
  }

  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'all') {
      navigate('/products')
      return
    }

    navigate(getCategoryPathById(categories, categoryId))
  }

  const handleSubcategoryClick = (subcategoryId) => {
    if (subcategoryId === 'all') {
      navigate(getCategoryPathById(categories, activeCategory))
      return
    }

    navigate(getCategoryPathById(categories, activeCategory, subcategoryId))
  }

  const handleSortChange = (value) => {
    setSortBy(value)
    setCurrentPage(1)
    updateSortParam(value)
  }

  const clearFilters = () => {
    setInStockOnly(false)
    setSelectedBrand('')
    setPriceRange('all')
    setCurrentPage(1)

    if (activeCategory === 'all') {
      setSearchParams({})
      return
    }

    setSearchParams({}, { replace: true })
  }

  const activeCategoryRecord = useMemo(() => {
    if (activeCategory === 'all') return null

    return parentCategories.find((item) => item.id === activeCategory) || null
  }, [activeCategory, parentCategories])

  const activeCategorySubcategories = useMemo(() => {
    if (activeCategory === 'all') return []

    return subcategoriesByParent[activeCategory] || []
  }, [activeCategory, subcategoriesByParent])

  const activeSubcategoryRecord = useMemo(() => {
    if (activeSubcategory === 'all') return null

    return (
      activeCategorySubcategories.find(
        (item) => item.id === activeSubcategory
      ) || null
    )
  }, [activeSubcategory, activeCategorySubcategories])

  const activeCategoryName = activeCategoryRecord?.name || ''
  const activeSubcategoryName = activeSubcategoryRecord?.name || ''

  const categoryScopedProducts = useMemo(() => {
    let result = [...products]

    if (activeCategory !== 'all') {
      if (activeSubcategory !== 'all') {
        result = result.filter(
          (product) => product.category_id === activeSubcategory
        )
      } else {
        const childIds = (subcategoriesByParent[activeCategory] || []).map(
          (subcategory) => subcategory.id
        )

        result = result.filter(
          (product) =>
            product.category_id === activeCategory ||
            childIds.includes(product.category_id)
        )
      }
    }

    return result
  }, [products, activeCategory, activeSubcategory, subcategoriesByParent])

  const availableBrands = useMemo(() => {
    const brands = new Set()

    categoryScopedProducts.forEach((product) => {
      if (product.brand?.trim()) {
        brands.add(product.brand.trim())
      }
    })

    return Array.from(brands).sort((a, b) => a.localeCompare(b, 'ar'))
  }, [categoryScopedProducts])

  const filteredProducts = useMemo(() => {
    let result = [...categoryScopedProducts]

    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase()

      result = result.filter((product) => {
        return (
          String(product.title || '').toLowerCase().includes(keyword) ||
          String(product.description || '').toLowerCase().includes(keyword) ||
          String(product.brand || '').toLowerCase().includes(keyword) ||
          String(product.sku || '').toLowerCase().includes(keyword) ||
          String(product.categories?.name || '').toLowerCase().includes(keyword)
        )
      })
    }

    if (inStockOnly) {
      result = result.filter((product) => checkInStock(product))
    }

    if (selectedBrand) {
      result = result.filter((product) => product.brand === selectedBrand)
    }

    if (priceRange === '0-500') {
      result = result.filter((product) => getProductPrice(product) < 500)
    } else if (priceRange === '500-1000') {
      result = result.filter((product) => {
        const price = getProductPrice(product)
        return price >= 500 && price <= 1000
      })
    } else if (priceRange === '1000-3000') {
      result = result.filter((product) => {
        const price = getProductPrice(product)
        return price >= 1000 && price <= 3000
      })
    } else if (priceRange === '3000+') {
      result = result.filter((product) => getProductPrice(product) > 3000)
    }

    if (sortBy === 'price_low') {
      result.sort((a, b) => getProductPrice(a) - getProductPrice(b))
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => getProductPrice(b) - getProductPrice(a))
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) =>
        String(a.title || '').localeCompare(String(b.title || ''), 'ar')
      )
    } else if (sortBy === 'newest') {
      result.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      )
    } else {
      result.sort((a, b) => {
        const featuredDiff =
          Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured))

        if (featuredDiff !== 0) return featuredDiff

        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      })
    }

    return result
  }, [
    categoryScopedProducts,
    searchTerm,
    inStockOnly,
    selectedBrand,
    priceRange,
    sortBy,
  ])

  const totalProducts = filteredProducts.length
  const totalPages = Math.max(1, Math.ceil(totalProducts / perPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex =
    totalProducts === 0 ? 0 : (safeCurrentPage - 1) * perPage + 1
  const endIndex = Math.min(safeCurrentPage * perPage, totalProducts)

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * perPage
    return filteredProducts.slice(start, start + perPage)
  }, [filteredProducts, safeCurrentPage, perPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [inStockOnly, selectedBrand, priceRange, perPage, searchTerm])

  const filtersActive =
    searchTerm.trim() ||
    sortBy !== 'featured' ||
    inStockOnly ||
    selectedBrand ||
    priceRange !== 'all'

  const pageTitle =
    activeSubcategory !== 'all'
      ? activeSubcategoryName
      : activeCategory !== 'all'
        ? activeCategoryName
        : searchTerm.trim()
          ? `نتائج البحث: ${searchTerm.trim()}`
          : 'جميع المنتجات'

  const pageDescription =
    activeCategory === 'all'
      ? 'تصفح كل منتجاتنا من خلال الأقسام أو استخدم الفلاتر للوصول لما تبحث عنه بسرعة.'
      : getCategoryDescription(pageTitle)

  const isCategoryPage = activeCategory !== 'all'

  const showGroupedSubcategoryView =
    isCategoryPage &&
    activeSubcategory === 'all' &&
    activeCategorySubcategories.length > 0

  const showSubcategoryNav =
    isCategoryPage && activeCategorySubcategories.length > 0

  const parentOnlyProducts = useMemo(() => {
    if (!showGroupedSubcategoryView) return []

    return filteredProducts.filter(
      (product) => product.category_id === activeCategory
    )
  }, [filteredProducts, showGroupedSubcategoryView, activeCategory])

  const parentCategoryPath = activeCategoryRecord
    ? getCategoryPath(activeCategoryRecord)
    : null

  usePageSeo({
    title: isCategoryPage && !loading ? pageTitle : null,
    description: pageDescription,
    image: paginatedProducts[0]?.image_url || filteredProducts[0]?.image_url,
  })

  useEffect(() => {
    setFiltersOpen(false)
  }, [activeCategory, activeSubcategory])

  useEffect(() => {
    if (!filtersOpen) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [filtersOpen])

  const activeFiltersCount =
    Number(inStockOnly) + Number(Boolean(selectedBrand)) + Number(priceRange !== 'all')

  const sidebar = (
    <ProductsCategorySidebar
      parentCategories={parentCategories}
      subcategoriesByParent={subcategoriesByParent}
      productCountByCategory={productCountByCategory}
      activeCategory={activeCategory}
      activeSubcategory={activeSubcategory}
      onCategorySelect={handleCategoryClick}
      onSubcategorySelect={handleSubcategoryClick}
      inStockOnly={inStockOnly}
      onInStockOnlyChange={setInStockOnly}
      brands={availableBrands}
      selectedBrand={selectedBrand}
      onBrandChange={(brand) => {
        setSelectedBrand(brand)
        setCurrentPage(1)
      }}
      priceRange={priceRange}
      onPriceRangeChange={(value) => {
        setPriceRange(value)
        setCurrentPage(1)
      }}
    />
  )

  return (
    <div className="min-h-screen bg-[#F4F7FB]" dir="rtl">
      <section className="px-3 sm:px-4 pt-5 pb-6 md:pt-7">
        <div className="max-w-[1500px] mx-auto">
          <nav className="flex items-center justify-end gap-2 text-sm font-bold text-slate-500">
            <Link to="/" className="hover:text-sky-700 transition">
              الصفحة الرئيسية
            </Link>

            {activeCategory !== 'all' && parentCategoryPath && (
              <>
                <span className="text-slate-300">&gt;</span>
                {activeSubcategory !== 'all' ? (
                  <Link
                    to={parentCategoryPath}
                    className="hover:text-sky-700 transition max-w-[180px] truncate"
                  >
                    {activeCategoryName}
                  </Link>
                ) : (
                  <span className="text-slate-800 max-w-[180px] truncate">
                    {activeCategoryName}
                  </span>
                )}

                {activeSubcategory !== 'all' && (
                  <>
                    <span className="text-slate-300">&gt;</span>
                    <span className="text-slate-800 max-w-[180px] truncate">
                      {activeSubcategoryName}
                    </span>
                  </>
                )}
              </>
            )}

            {activeCategory === 'all' && searchTerm.trim() && (
              <>
                <span className="text-slate-300">&gt;</span>
                <span className="text-slate-800">نتائج البحث</span>
              </>
            )}
          </nav>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">
            <div className="hidden lg:block lg:sticky lg:top-24">{sidebar}</div>

            {/* الموبايل: أقسام أفقية + زرار فلترة بدل القائمة الطويلة */}
            <div className="lg:hidden -mt-1 space-y-3 min-w-0">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => handleCategoryClick('all')}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-black border transition ${
                    activeCategory === 'all'
                      ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  الكل
                </button>
                {parentCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-black border transition whitespace-nowrap ${
                      activeCategory === category.id
                        ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-3 font-black text-slate-800 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M7 12h10M10 18h4" />
                </svg>
                الفلترة والأقسام
                {activeFiltersCount > 0 && (
                  <span className="bg-sky-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {filtersOpen && (
              <div className="lg:hidden fixed inset-0 z-[80]" role="dialog" aria-modal="true">
                <button
                  type="button"
                  aria-label="إغلاق"
                  onClick={() => setFiltersOpen(false)}
                  className="animate-fade absolute inset-0 bg-slate-950/50"
                />
                <div className="animate-drawer absolute inset-y-0 right-0 w-[86%] max-w-sm bg-[#F4F7FB] shadow-2xl flex flex-col">
                  <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200">
                    <h2 className="text-lg font-black text-slate-950">الفلترة والأقسام</h2>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 text-xl font-black"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">{sidebar}</div>
                  <div className="p-3 bg-white border-t border-slate-200 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="py-3 rounded-xl font-black bg-slate-100 text-slate-800"
                    >
                      مسح الفلاتر
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="py-3 rounded-xl font-black bg-[#0B1F3A] text-white"
                    >
                      عرض {totalProducts} منتج
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-7 min-w-0">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
                  {pageTitle}
                </h1>
                {isCategoryPage && (
                  <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed max-w-4xl">
                    {pageDescription}
                  </p>
                )}
              </div>

              {showSubcategoryNav && (
                <CategorySubcategoryNav
                  parentCategory={activeCategoryRecord}
                  subcategories={activeCategorySubcategories}
                  activeSubcategory={activeSubcategory}
                  onSelectAll={() => handleSubcategoryClick('all')}
                  onSelectSubcategory={handleSubcategoryClick}
                />
              )}

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
                <p className="text-sm font-bold text-slate-600 order-2 lg:order-1">
                  {totalProducts === 0
                    ? 'لا توجد منتجات'
                    : `عرض ${startIndex} - ${endIndex} من ${totalProducts} منتجات`}
                </p>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 order-1 lg:order-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <span className="whitespace-nowrap">ترتيب حسب:</span>
                    <select
                      value={sortBy}
                      onChange={(event) => handleSortChange(event.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-sky-400 min-w-[130px]"
                    >
                      <option value="featured">متميز</option>
                      <option value="newest">الأحدث</option>
                      <option value="price_low">السعر: الأقل</option>
                      <option value="price_high">السعر: الأعلى</option>
                      <option value="name_asc">الاسم: أ-ي</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <span className="whitespace-nowrap">عرض:</span>
                    <select
                      value={perPage}
                      onChange={(event) => setPerPage(Number(event.target.value))}
                      className="border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-sky-400 min-w-[120px]"
                    >
                      {PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option} للصفحة
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <div
                      key={item}
                      className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse"
                    >
                      <div className="aspect-square bg-slate-100 rounded-xl mb-3" />
                      <div className="h-3 bg-slate-100 rounded mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-2/3 mb-3" />
                      <div className="h-9 bg-slate-100 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-black text-slate-900">
                    لا توجد منتجات
                  </h3>
                  <p className="text-slate-500 mt-2 text-sm">
                    جرب تغيير الفلاتر أو اختيار قسم آخر.
                  </p>
                  {filtersActive && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 text-sky-700 font-black text-sm hover:underline"
                    >
                      مسح الفلاتر
                    </button>
                  )}
                </div>
              ) : showGroupedSubcategoryView ? (
                <CategoryGroupedProducts
                  parentCategory={activeCategoryRecord}
                  subcategories={activeCategorySubcategories}
                  products={filteredProducts}
                  parentOnlyProducts={parentOnlyProducts}
                  addedProductId={addedProductId}
                  onAddToCart={handleAddToCart}
                  onViewSubcategory={handleSubcategoryClick}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        added={addedProductId === product.id}
                        onAddToCart={handleAddToCart}
                        variant="category"
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        type="button"
                        disabled={safeCurrentPage <= 1}
                        onClick={() => setCurrentPage((page) => page - 1)}
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-black text-sm disabled:opacity-40"
                      >
                        السابق
                      </button>

                      <span className="px-3 py-2 text-sm font-bold text-slate-600">
                        {safeCurrentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={safeCurrentPage >= totalPages}
                        onClick={() => setCurrentPage((page) => page + 1)}
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-black text-sm disabled:opacity-40"
                      >
                        التالي
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
