import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useSiteSettings from '../hooks/useSiteSettings'
import ReviewsCarousel from '../components/ReviewsCarousel'
import ProductCard from '../components/ProductCard'
import HomeProductSection from '../components/HomeProductSection'
import HomeOurWorkSection from '../components/HomeOurWorkSection'
import HomeDesignBlock from '../components/HomeDesignBlock'
import HomeCategoryGrid from '../components/HomeCategoryGrid'
import HomeWhyUs from '../components/HomeWhyUs'
import Reveal from '../components/Reveal'
import HomePromoBanners from '../components/HomePromoBanners'
import { addToCart } from '../lib/cart'
import { RETURN_POLICY_SUMMARY, STORE_SEO_DESCRIPTION_LINES } from '../lib/siteContent'
import { getCategoryPath } from '../lib/categoryUrls'

const BRAND_COLORS = {
  primary: '#0B1F3A',
  primaryHover: '#10294B',
  accent: '#38BDF8',
}

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" fill="none">
      <circle cx="78" cy="82" r="66" fill="#38BDF8" opacity="0.18" />
      <path d="M32 88h70V54H32v34Z" fill="#FFFFFF" />
      <path d="M102 66h22l14 22v20h-36V66Z" fill="#38BDF8" />
      <circle cx="53" cy="111" r="11" fill="#F59E0B" />
      <circle cx="124" cy="111" r="11" fill="#F59E0B" />
      <path
        d="M27 67H8M27 80H2M27 93H12"
        stroke="#38BDF8"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WarrantyIcon() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" fill="none">
      <circle cx="80" cy="80" r="66" fill="#F59E0B" opacity="0.18" />
      <rect x="34" y="49" width="86" height="62" rx="10" fill="#FFFFFF" />
      <path
        d="M54 74h42M54 88h30"
        stroke="#0B1F3A"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="113" cy="50" r="23" fill="#F59E0B" />
      <path
        d="M102 50l8 8 16-19"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ReturnIcon() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" fill="none">
      <circle cx="80" cy="80" r="66" fill="#22C55E" opacity="0.16" />
      <path
        d="M102 40H65C47 40 34 54 34 72s14 32 32 32h48"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M72 70 43 102l29 29"
        stroke="#38BDF8"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="84" y="78" width="48" height="40" rx="7" fill="#F59E0B" />
    </svg>
  )
}

function findSurveillanceParentCategory(categories) {
  return (
    categories.find((category) => {
      const name = String(category.name || '').toLowerCase()
      const hasSystems =
        name.includes('أنظمة') ||
        name.includes('انظمة') ||
        name.includes('نظام')
      const hasSurveillance =
        name.includes('مراقبة') ||
        name.includes('مراقبه') ||
        name.includes('surveillance')

      return hasSystems && hasSurveillance
    }) ||
    categories.find((category) => {
      const name = String(category.name || '').toLowerCase()
      return name.includes('مراقبة') || name.includes('surveillance')
    }) ||
    null
  )
}

const CONNECTIONS_CHARGERS_KEYWORD_GROUPS = [
  ['جاك باور', 'jack power', 'power jack'],
  ['جاك فيديو', 'jack video', 'video jack'],
  ['شاحن', 'شواحن', 'charger'],
]
const CAMERA_EXCLUDE_KEYWORDS = ['سلك', 'كابل', 'كابلات', 'wire', 'cable']

function isExcludedName(name, excludeKeywords) {
  const normalized = String(name || '').toLowerCase()

  return excludeKeywords.some((keyword) =>
    normalized.includes(String(keyword).toLowerCase())
  )
}

function matchesSubcategoryName(name, keywords) {
  const normalized = String(name || '').toLowerCase()

  return keywords.some((keyword) =>
    normalized.includes(String(keyword).toLowerCase())
  )
}

function findSubcategoryByKeywords(
  subcategories,
  keywords,
  usedIds,
  excludeKeywords = []
) {
  return (subcategories || []).find(
    (subcategory) =>
      subcategory.is_active &&
      !usedIds.has(subcategory.id) &&
      !isExcludedName(subcategory.name, excludeKeywords) &&
      matchesSubcategoryName(subcategory.name, keywords)
  )
}

function findAllSubcategoriesByKeywords(
  subcategories,
  keywords,
  usedIds,
  excludeKeywords = []
) {
  return (subcategories || []).filter(
    (subcategory) =>
      subcategory.is_active &&
      !usedIds.has(subcategory.id) &&
      !isExcludedName(subcategory.name, excludeKeywords) &&
      matchesSubcategoryName(subcategory.name, keywords)
  )
}

function collectCombinedSubcategories(subcategories, keywordGroups, usedIds) {
  const collected = keywordGroups.flatMap((keywords) =>
    findAllSubcategoriesByKeywords(subcategories, keywords, usedIds)
  )

  return collected.filter(
    (subcategory, index, list) =>
      list.findIndex((item) => item.id === subcategory.id) === index
  )
}

function findCamerasSubcategory(subcategories, usedIds) {
  const candidates = (subcategories || []).filter(
    (subcategory) =>
      subcategory.is_active &&
      !usedIds.has(subcategory.id) &&
      !isExcludedName(subcategory.name, CAMERA_EXCLUDE_KEYWORDS) &&
      matchesSubcategoryName(subcategory.name, [
        'كاميرات مراقبة',
        'كاميرات المراقبة',
        'كاميرا مراقبة',
        'كاميرات',
        'كاميرا',
        'cctv',
        'camera',
      ])
  )

  return (
    candidates.find((subcategory) =>
      matchesSubcategoryName(subcategory.name, [
        'مراقبة',
        'مراقبه',
        'surveillance',
      ])
    ) || candidates[0] || null
  )
}

function SectionDivider() {
  return <div className="h-1 md:h-2" aria-hidden="true" />
}

const benefitCards = [
  {
    title: 'شحن آمن وسريع',
    subtitle: 'تجهيز وشحن الطلبات بعناية حتى باب البيت',
    icon: <DeliveryIcon />,
  },
  {
    title: 'أجهزة أصلية بضمان',
    subtitle: 'منتجات موثوقة من موردين معتمدين وجودة مضمونة',
    icon: <WarrantyIcon />,
  },
  {
    title: 'استبدال واسترجاع',
    subtitle: RETURN_POLICY_SUMMARY,
    icon: <ReturnIcon />,
  },
]


export default function Home() {
  const { settings } = useSiteSettings()

  const [categories, setCategories] = useState([])
  const [categoryImages, setCategoryImages] = useState({})
  const [allProducts, setAllProducts] = useState([])
  const [addedProductId, setAddedProductId] = useState(null)
  const [loading, setLoading] = useState(true)

  const getHomeData = async () => {
    setLoading(true)

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name, slug, is_active, parent_id, image_url')
      .eq('is_active', true)
      .order('name', { ascending: true })

    const parentCategories = (categoriesData || [])
      .filter((category) => !category.parent_id)
      .map((category) => ({
        ...category,
        subcategories: (categoriesData || []).filter(
          (item) => item.parent_id === category.id
        ),
      }))

    const { data: productsForCategories } = await supabase
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
      .not('category_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(300)

    const imageMap = {}

    const categoryById = Object.fromEntries(
      (categoriesData || []).map((category) => [category.id, category])
    )

    ;(productsForCategories || []).forEach((product) => {
      if (
        product.category_id &&
        product.image_url &&
        !imageMap[product.category_id]
      ) {
        imageMap[product.category_id] = product.image_url
      }

      const parentId = categoryById[product.category_id]?.parent_id

      if (parentId && product.image_url && !imageMap[parentId]) {
        imageMap[parentId] = product.image_url
      }
    })

    setCategories(parentCategories)
    setCategoryImages(imageMap)
    setAllProducts(productsForCategories || [])
    setLoading(false)
  }

  useEffect(() => {
    void getHomeData()
  }, [])

  const heroImageUrl = settings?.hero_image_url || ''
  const { features } = useSiteSettings()

  // مربعات (تسوق حسب القسم): كل قسم فيه منتجات ظاهرة
  const categoryTiles = useMemo(() => {
    const counts = {}
    allProducts.forEach((product) => {
      counts[product.category_id] = (counts[product.category_id] || 0) + 1
    })

    const tiles = []

    categories.forEach((parent) => {
      const subcategories = (parent.subcategories || []).filter(
        (subcategory) => subcategory.is_active && counts[subcategory.id]
      )

      subcategories.forEach((subcategory) => {
        tiles.push({
          id: subcategory.id,
          name: subcategory.name,
          count: counts[subcategory.id],
          image: categoryImages[subcategory.id] || subcategory.image_url || '',
          to: getCategoryPath(parent, subcategory),
        })
      })

      if (!subcategories.length && counts[parent.id]) {
        tiles.push({
          id: parent.id,
          name: parent.name,
          count: counts[parent.id],
          image: categoryImages[parent.id] || parent.image_url || '',
          to: getCategoryPath(parent),
        })
      }
    })

    return tiles.sort((a, b) => b.count - a.count).slice(0, 12)
  }, [allProducts, categories, categoryImages])

  const handleAddToCart = (product) => {
    if (product?.is_in_stock === false) return

    addToCart(product, 1)
    setAddedProductId(product.id)

    setTimeout(() => {
      setAddedProductId(null)
    }, 1200)
  }

  const renderCarouselProduct = (product, index = 0) => (
    <div key={product.id} className={index >= 4 ? 'hidden sm:block' : ''}>
      <ProductCard
        product={product}
        added={addedProductId === product.id}
        onAddToCart={handleAddToCart}
        variant="carousel"
      />
    </div>
  )

  const surveillanceParent = useMemo(
    () => findSurveillanceParentCategory(categories),
    [categories]
  )

  const buildProductSection = (subcategory, overrides = {}) => {
    const products = allProducts
      .filter((product) => product.category_id === subcategory.id)
      .slice(0, 10)

    return {
      id: subcategory.id,
      title: overrides.title || subcategory.name,
      subtitle: overrides.subtitle || `منتجات ${subcategory.name}`,
      products,
      viewAllUrl:
        overrides.viewAllUrl ||
        getCategoryPath(surveillanceParent, subcategory),
      imageUrl:
        subcategory.image_url ||
        categoryImages[subcategory.id] ||
        products[0]?.image_url ||
        '',
    }
  }

  const buildCombinedProductSection = (subcategoriesList, title) => {
    const ids = subcategoriesList.map((subcategory) => subcategory.id)
    const products = allProducts
      .filter((product) => ids.includes(product.category_id))
      .slice(0, 10)

    return {
      id: ids.join('-') || title,
      title,
      subtitle: `منتجات ${title}`,
      products,
      viewAllUrl: getCategoryPath(surveillanceParent),
      imageUrl:
        subcategoriesList.find((subcategory) => subcategory.image_url)
          ?.image_url ||
        categoryImages[ids[0]] ||
        products[0]?.image_url ||
        '',
    }
  }

  const homeBlocks = useMemo(() => {
    if (!surveillanceParent) return []

    const subcategories = (surveillanceParent.subcategories || []).filter(
      (subcategory) => subcategory.is_active
    )
    const usedIds = new Set()
    const blocks = []

    const pushSection = (subcategory, overrides = {}) => {
      if (!subcategory) return
      usedIds.add(subcategory.id)
      blocks.push({
        type: 'section',
        section: buildProductSection(subcategory, overrides),
      })
    }

    const pushCombinedSection = (subcategoriesList, title) => {
      if (!subcategoriesList.length) return

      subcategoriesList.forEach((subcategory) => usedIds.add(subcategory.id))
      blocks.push({
        type: 'section',
        section: buildCombinedProductSection(subcategoriesList, title),
      })
    }

    const camerasSub = findCamerasSubcategory(subcategories, usedIds)
    pushSection(camerasSub, {
      title: 'كاميرات المراقبة',
      subtitle: 'منتجات كاميرات المراقبة',
    })

    blocks.push({
      type: 'design',
      variant: 'security',
      linkUrl: camerasSub
        ? getCategoryPath(surveillanceParent, camerasSub)
        : '/products',
      imageUrl:
        camerasSub?.image_url || categoryImages[camerasSub?.id] || '',
    })

    pushSection(
      findSubcategoryByKeywords(
        subcategories,
        ['هارد', 'هاردات', 'storage'],
        usedIds
      )
    )

    blocks.push({ type: 'design', variant: 'trust' })

    pushSection(
      findSubcategoryByKeywords(
        subcategories,
        ['صوت', 'audio', 'speaker', 'مكبر', 'سماع'],
        usedIds
      )
    )

    const connectionsAndChargers = collectCombinedSubcategories(
      subcategories,
      CONNECTIONS_CHARGERS_KEYWORD_GROUPS,
      usedIds
    )

    pushCombinedSection(connectionsAndChargers, 'وصلات وشواحن')

    subcategories
      .filter((subcategory) => !usedIds.has(subcategory.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
      .forEach((subcategory) => pushSection(subcategory))

    return blocks
  }, [allProducts, surveillanceParent, categoryImages])

  return (
    <div className="min-h-screen bg-[#F4F7FB]" dir="rtl">
      <section className="p-0 md:px-4 md:py-5">
        <div className="w-full md:max-w-[1500px] md:mx-auto">
          <div className="relative w-full overflow-hidden rounded-none md:rounded-3xl md:ring-1 md:ring-slate-200/70 shadow-none md:shadow-sm bg-[#1a0505] md:h-[460px] lg:h-[500px] xl:h-[520px]">
            {heroImageUrl ? (
              <img
                src={heroImageUrl}
                alt="Hero"
                className="hero-settle block w-full h-auto md:absolute md:inset-0 md:h-full md:w-full md:object-cover md:object-center"
              />
            ) : (
              <div className="w-full aspect-[1828/728] md:absolute md:inset-0 bg-gradient-to-l from-[#07111F] via-[#0B2A45] to-[#1E5A83]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/10 via-transparent to-transparent pointer-events-none hidden md:block" />
          </div>
        </div>
      </section>

      <h1 className="sr-only">Town Tech - أنظمة المراقبة والإلكترونيات</h1>

      {features.home_category_grid_enabled && categoryTiles.length >= 2 && (
        <HomeCategoryGrid
          title={features.home_category_grid_title || 'تسوق حسب القسم'}
          tiles={categoryTiles}
        />
      )}

      <HomeWhyUs />

      <SectionDivider />

      {surveillanceParent && !loading && !homeBlocks.some((block) => block.type === 'section') && (
        <section className="px-4 py-8">
          <div className="max-w-[1500px] mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 font-bold">
              أضف أقسام فرعية داخل &quot;{surveillanceParent.name}&quot; من لوحة التحكم لتظهر هنا.
            </p>
          </div>
        </section>
      )}

      {homeBlocks.map((block, index) => {
        if (block.type === 'design') {
          return (
            <div key={`design-${block.variant}-${index}`}>
              <HomeDesignBlock
                variant={block.variant}
                linkUrl={block.linkUrl}
                imageUrl={block.imageUrl}
              />
              <SectionDivider />
            </div>
          )
        }

        const section = block.section
        const sectionIndex = homeBlocks
          .slice(0, index)
          .filter((item) => item.type === 'section').length

        return (
          <div key={section.id}>
            <Reveal>
            <HomeProductSection
              title={section.title}
              subtitle={section.subtitle}
              viewAllUrl={section.viewAllUrl}
              loading={loading}
              emptyText={`لا توجد منتجات في ${section.title} حتى الآن.`}
            >
              {section.products
                .slice(0, 6)
                .map((product, productIndex) => renderCarouselProduct(product, productIndex))}
            </HomeProductSection>
            </Reveal>
            {sectionIndex === 0 && <HomePromoBanners />}
          </div>
        )
      })}

      <SectionDivider />

      <HomeOurWorkSection />

      <SectionDivider />

      <section className="px-4 pb-2">
        <div className="max-w-[1500px] mx-auto">
          <div className="md:hidden flex gap-4 overflow-x-auto pb-3 px-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {benefitCards.map((card, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 snap-start w-[360px] h-[170px] rounded-[28px] overflow-hidden shadow-md"
                style={{
                  background:
                    'linear-gradient(135deg, #0B1F3A 0%, #123D68 58%, #0B1F3A 100%)',
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_55%,rgba(56,189,248,0.24),transparent_38%)]" />

                <div className="absolute left-[-28px] bottom-[-22px] w-[155px] h-[155px] opacity-95">
                  {card.icon}
                </div>

                <div className="absolute right-0 top-0 z-10 h-full w-[62%] p-5 pr-6 flex flex-col justify-center text-white text-right">
                  <h3 className="text-[22px] font-black leading-8">
                    {card.title}
                  </h3>

                  <p className="text-white/78 text-[13px] leading-6 mt-2">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:grid grid-cols-3 gap-5">
            {benefitCards.map((card, index) => (
              <div
                key={index}
                className="min-h-[170px] rounded-3xl overflow-hidden relative shadow-sm hover:shadow-md transition"
                style={{
                  background:
                    'linear-gradient(135deg, #0B1F3A 0%, #123D68 55%, #0B1F3A 100%)',
                }}
              >
                <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-sky-400/20" />
                <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full bg-yellow-400/10" />

                <div className="relative z-10 h-full flex items-center gap-5 p-6">
                  <div className="w-32 h-32 flex-shrink-0">{card.icon}</div>

                  <div className="text-white">
                    <h3 className="text-3xl font-black leading-[1.25]">
                      {card.title}
                    </h3>

                    <p className="text-white/75 text-base leading-7 mt-3">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      <ReviewsCarousel />
    </div>
  )
}