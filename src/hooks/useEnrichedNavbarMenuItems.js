import { useEffect, useMemo, useState } from 'react'
import {
  getCategoryPathById,
  parseCategorySlugFromUrl,
  parseLegacyCategoryIdFromUrl,
} from '../lib/categoryUrls'
import { supabase } from '../lib/supabase'

function isCameraMegaMenuLabel(label) {
  const value = String(label || '').trim()
  return /كاميرات?\s*(ال)?مراقبة|مراقبة/i.test(value)
}

export function shouldShowMegaMenu(item, subcategories, linkedSubcategory) {
  if (linkedSubcategory) return false
  if (!subcategories.length) return false
  if (item.showDropdown === true) return true
  if (item.showDropdown === false) return false

  return isCameraMegaMenuLabel(item.label)
}

export function enrichNavbarMenuItems(menuItems, categories, categoriesById) {
  const allCategories = categories.flatMap((category) => [
    category,
    ...(category.subcategories || []),
  ])

  return (menuItems || [])
    .filter((item) => item?.label?.trim())
    .map((item) => {
      const slugInfo = parseCategorySlugFromUrl(item.url)
      const legacyInfo = parseLegacyCategoryIdFromUrl(item.url)

      let category = null
      let linkedSubcategory = null

      if (slugInfo?.parentSlug) {
        category = categories.find(
          (entry) => entry.slug === slugInfo.parentSlug
        )

        if (slugInfo.subcategorySlug) {
          linkedSubcategory =
            allCategories.find(
              (entry) =>
                entry.parent_id === category?.id &&
                entry.slug === slugInfo.subcategorySlug
            ) || null
        }
      } else if (legacyInfo?.subcategoryId) {
        linkedSubcategory =
          allCategories.find(
            (entry) => entry.id === legacyInfo.subcategoryId
          ) || null

        if (linkedSubcategory?.parent_id) {
          category =
            categories.find(
              (entry) => entry.id === linkedSubcategory.parent_id
            ) || null
        }
      } else if (legacyInfo?.categoryId) {
        category = categoriesById[legacyInfo.categoryId] || null
      }

      const subcategories = category?.subcategories || []
      const normalizedUrl =
        category && (slugInfo || legacyInfo)
          ? getCategoryPathById(
              allCategories,
              category.id,
              linkedSubcategory?.id || legacyInfo?.subcategoryId || null
            )
          : item.url

      return {
        ...item,
        url: normalizedUrl || item.url,
        categoryId: category?.id || null,
        parentSlug: category?.slug || null,
        subcategories,
        hasDropdown: shouldShowMegaMenu(
          item,
          subcategories,
          linkedSubcategory
        ),
      }
    })
}

export default function useEnrichedNavbarMenuItems(menuItems = []) {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true })

      const parents = (data || [])
        .filter((category) => !category.parent_id)
        .map((parent) => ({
          ...parent,
          subcategories: (data || []).filter(
            (item) => item.parent_id === parent.id
          ),
        }))

      setCategories(parents)
    }

    loadCategories()
  }, [])

  const categoriesById = useMemo(() => {
    const map = {}

    categories.forEach((category) => {
      map[category.id] = category
    })

    return map
  }, [categories])

  const enrichedItems = useMemo(
    () => enrichNavbarMenuItems(menuItems, categories, categoriesById),
    [menuItems, categories, categoriesById]
  )

  return { enrichedItems, categoriesLoaded: categories.length > 0 }
}
