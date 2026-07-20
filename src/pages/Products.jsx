import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductListingPage from '../components/products/ProductListingPage'
import { getCategoryPathById } from '../lib/categoryUrls'

export default function Products() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [redirecting, setRedirecting] = useState(false)

  const categoryId = searchParams.get('category')
  const subcategoryId = searchParams.get('subcategory')

  useEffect(() => {
    if (!categoryId) return

    const redirectToCategoryPage = async () => {
      setRedirecting(true)

      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug, parent_id')
        .eq('is_active', true)

      const targetPath = getCategoryPathById(
        categories || [],
        categoryId,
        subcategoryId || null
      )

      if (targetPath !== '/products') {
        navigate(targetPath, { replace: true })
        return
      }

      setRedirecting(false)
    }

    redirectToCategoryPage()
  }, [categoryId, subcategoryId, navigate])

  if (redirecting && categoryId) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <p className="text-slate-600 font-bold">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <ProductListingPage initialCategoryId="all" initialSubcategoryId="all" />
  )
}
