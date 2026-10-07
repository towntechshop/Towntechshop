import { supabase } from './supabase'

// عدد المنتجات الظاهرة لكل قسم (مباشرة)
export function countProductsByCategory(products = []) {
  const counts = {}

  products.forEach((product) => {
    if (!product?.category_id) return
    counts[product.category_id] = (counts[product.category_id] || 0) + 1
  })

  return counts
}

export async function fetchVisibleProductCounts() {
  const { data, error } = await supabase
    .from('products')
    .select('category_id')
    .eq('is_visible', true)
    .not('category_id', 'is', null)

  if (error) return null

  return countProductsByCategory(data || [])
}

// يرجّع الأقسام اللي فيها منتجات (القسم الرئيسي يظهر لو هو أو أي قسم فرعي تحته فيه منتجات)
export function filterNonEmptyCategories(categories = [], counts) {
  if (!counts) return categories

  const hasProducts = (category) => (counts[category.id] || 0) > 0

  const parentHasProducts = new Set()

  categories.forEach((category) => {
    if (category.parent_id && hasProducts(category)) {
      parentHasProducts.add(category.parent_id)
    }
  })

  return categories.filter((category) => {
    if (category.parent_id) return hasProducts(category)
    return hasProducts(category) || parentHasProducts.has(category.id)
  })
}
