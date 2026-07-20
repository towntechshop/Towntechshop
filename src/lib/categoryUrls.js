export function getCategoryPath(parentCategory, subcategory = null) {
  const parentSlug = parentCategory?.slug?.trim()

  if (!parentSlug) return '/products'

  if (subcategory?.slug?.trim()) {
    return `/category/${encodeURIComponent(parentSlug)}/${encodeURIComponent(subcategory.slug.trim())}`
  }

  return `/category/${encodeURIComponent(parentSlug)}`
}

export function getCategoryPathById(categories, parentId, subcategoryId = null) {
  const parent = categories.find((category) => category.id === parentId)

  if (!parent) return '/products'

  const subcategory = subcategoryId
    ? categories.find((category) => category.id === subcategoryId)
    : null

  return getCategoryPath(parent, subcategory)
}

export function parseCategorySlugFromUrl(url) {
  if (!url || typeof url !== 'string') return null

  const normalized = url.startsWith('/') ? url : `/${url}`

  if (!normalized.startsWith('/category/')) return null

  const parts = normalized.replace(/^\/category\//, '').split('/').filter(Boolean)

  if (parts.length === 0) return null

  return {
    parentSlug: decodeURIComponent(parts[0]),
    subcategorySlug: parts[1] ? decodeURIComponent(parts[1]) : null,
  }
}

export function parseLegacyCategoryIdFromUrl(url) {
  if (!url || !url.startsWith('/')) return null

  try {
    const parsed = new URL(url, window.location.origin)

    if (parsed.pathname !== '/products') return null

    return {
      categoryId: parsed.searchParams.get('category'),
      subcategoryId: parsed.searchParams.get('subcategory'),
    }
  } catch {
    return null
  }
}

export function resolveCategoryFromSlugs(categories, parentSlug, subcategorySlug) {
  const parent = categories.find(
    (category) => !category.parent_id && category.slug === parentSlug
  )

  if (!parent) return null

  if (!subcategorySlug) {
    return {
      parent,
      subcategory: null,
      parentId: parent.id,
      subcategoryId: 'all',
    }
  }

  const subcategory = categories.find(
    (category) =>
      category.parent_id === parent.id && category.slug === subcategorySlug
  )

  if (!subcategory) return null

  return {
    parent,
    subcategory,
    parentId: parent.id,
    subcategoryId: subcategory.id,
  }
}

export function getCategoryDescription(name) {
  return `تسوق أفضل ${name} بأسعار منافسة وجودة مضمونة. اختر من بين تشكيلة واسعة من المنتجات الأصلية مع ضمان وخدمة ما بعد البيع.`
}
