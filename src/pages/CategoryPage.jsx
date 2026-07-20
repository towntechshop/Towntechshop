import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveCategoryFromSlugs } from '../lib/categoryUrls'
import ProductListingPage from '../components/products/ProductListingPage'

export default function CategoryPage() {
  const { categorySlug, subcategorySlug } = useParams()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id, is_active')
        .eq('is_active', true)

      setCategories(data || [])
      setLoading(false)
    }

    loadCategories()
  }, [])

  const resolved = useMemo(() => {
    if (!categorySlug || categories.length === 0) return null

    return resolveCategoryFromSlugs(
      categories,
      categorySlug,
      subcategorySlug || null
    )
  }, [categories, categorySlug, subcategorySlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <p className="text-slate-600 font-bold">جاري التحميل...</p>
      </div>
    )
  }

  if (!resolved) {
    return (
      <div
        className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-md">
          <h1 className="text-2xl font-black text-slate-900">القسم غير موجود</h1>
          <p className="text-slate-500 mt-2 text-sm">
            لم نتمكن من العثور على هذا القسم. ربما تم حذفه أو تغيير رابطه.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/products"
              className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] text-white font-black text-sm"
            >
              كل المنتجات
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-black text-sm"
            >
              رجوع
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProductListingPage
      initialCategoryId={resolved.parentId}
      initialSubcategoryId={resolved.subcategoryId}
    />
  )
}
