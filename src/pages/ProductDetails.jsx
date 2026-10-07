import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { addToCart } from '../lib/cart'
import ProductCard from '../components/ProductCard'
import useSiteSettings from '../hooks/useSiteSettings'
import usePageSeo from '../hooks/usePageSeo'
import { SITE_URL } from '../lib/seo'
import { getCategoryPath } from '../lib/categoryUrls'
import { buildProductWhatsAppMessage } from '../lib/siteFeatures'
import {
  formatPrice,
  getProductPrice,
  getRegularPrice,
  getSavedAmount,
  hasSale,
  isProductInStock,
} from '../lib/productUtils'
import {
  WhatsAppIcon,
  buildWhatsAppUrl,
  getWhatsAppNumber,
} from '../components/SiteExtras'

const BRAND_COLORS = {
  primary: '#0B1F3A',
  secondary: '#24308A',
}

const PRODUCT_SELECT = `
  *,
  categories (
    id,
    name,
    slug,
    parent_id
  )
`

function normalizeGallery(gallery) {
  if (!gallery) return []

  if (Array.isArray(gallery)) {
    return gallery.filter(Boolean)
  }

  try {
    const parsed = JSON.parse(gallery)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function BadgeIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'w-6 h-6',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (name) {
    case 'truck':
      return (
        <svg {...common}>
          <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
          <circle cx="7" cy="17.5" r="1.8" />
          <circle cx="17" cy="17.5" r="1.8" />
        </svg>
      )
    case 'cash':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6.5 9.5v5M17.5 9.5v5" />
        </svg>
      )
    case 'support':
      return (
        <svg {...common}>
          <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
          <rect x="3" y="13" width="4" height="6" rx="1.5" />
          <rect x="17" y="13" width="4" height="6" rx="1.5" />
          <path d="M19 19c0 1.5-2 2.5-5 2.5" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
        </svg>
      )
    case 'tools':
      return (
        <svg {...common}>
          <path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-.5-.5-2.5z" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />
          <path d="m8.8 12.2 2.2 2.2 4.2-4.4" />
        </svg>
      )
  }
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings, features } = useSiteSettings()

  const [product, setProduct] = useState(null)
  const [parentCategory, setParentCategory] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [addedProductId, setAddedProductId] = useState(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  const relatedLimit = features.related_products_enabled
    ? features.related_products_count
    : 0

  useEffect(() => {
    let cancelled = false

    const loadProduct = async () => {
      setLoading(true)
      setQuantity(1)
      setDescriptionExpanded(false)

      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('id', id)
        .eq('is_visible', true)
        .maybeSingle()

      if (cancelled) return

      if (error || !data) {
        setProduct(null)
        setRelatedProducts([])
        setLoading(false)
        return
      }

      setProduct(data)

      const galleryImages = normalizeGallery(data.gallery_urls)
      setSelectedImage(data.image_url || galleryImages[0] || '')

      const category = data.categories

      if (category?.parent_id) {
        const { data: parent } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('id', category.parent_id)
          .maybeSingle()

        if (!cancelled) setParentCategory(parent || null)
      } else {
        setParentCategory(null)
      }

      setLoading(false)

      if (relatedLimit <= 0) {
        setRelatedProducts([])
        return
      }

      // منتجات من نفس القسم، ولو قليلة نكمّل بأحدث المنتجات
      let related = []

      if (data.category_id) {
        const { data: sameCategory } = await supabase
          .from('products')
          .select(PRODUCT_SELECT)
          .eq('is_visible', true)
          .eq('category_id', data.category_id)
          .neq('id', data.id)
          .order('is_in_stock', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(relatedLimit)

        related = sameCategory || []
      }

      if (related.length < relatedLimit) {
        const excludeIds = [data.id, ...related.map((item) => item.id)]

        const { data: latest } = await supabase
          .from('products')
          .select(PRODUCT_SELECT)
          .eq('is_visible', true)
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(relatedLimit - related.length)

        related = [...related, ...(latest || [])]
      }

      if (!cancelled) setRelatedProducts(related)
    }

    loadProduct()
    window.scrollTo({ top: 0, behavior: 'smooth' })

    return () => {
      cancelled = true
    }
  }, [id, relatedLimit])

  const productImages = useMemo(() => {
    if (!product) return []

    const images = [product.image_url, ...normalizeGallery(product.gallery_urls)].filter(Boolean)
    return [...new Set(images)]
  }, [product])

  const price = product ? getProductPrice(product) : 0
  const inStock = product ? isProductInStock(product) : false
  const stockLimit =
    product && typeof product.stock_quantity === 'number' && product.stock_quantity > 0
      ? product.stock_quantity
      : null

  const productUrl = product ? `${SITE_URL}/products/${product.id}` : ''
  const category = product?.categories || null

  const categoryLinks = useMemo(() => {
    if (!category) return []

    if (parentCategory) {
      return [
        { label: parentCategory.name, to: getCategoryPath(parentCategory) },
        { label: category.name, to: getCategoryPath(parentCategory, category) },
      ]
    }

    if (!category.parent_id) {
      return [{ label: category.name, to: getCategoryPath(category) }]
    }

    return []
  }, [category, parentCategory])

  usePageSeo({
    title: product?.title || null,
    description:
      product?.description && product.description.length > 40
        ? product.description
        : product
          ? `اشترِ ${product.title} بسعر ${formatPrice(price)} جنيه من ${
              settings.brand_name || 'Town Tech'
            }. ضمان حقيقي وتوصيل لكل المحافظات.`
          : '',
    image: productImages[0],
    type: 'product',
    path: product ? `/products/${product.id}` : undefined,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title,
          image: productImages,
          description: product.description || product.title,
          sku: product.sku || undefined,
          brand: product.brand
            ? { '@type': 'Brand', name: product.brand }
            : undefined,
          category: category?.name || undefined,
          offers: {
            '@type': 'Offer',
            url: productUrl,
            priceCurrency: 'EGP',
            price: price.toFixed(2),
            availability: inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
          },
        }
      : null,
  })

  const increaseQuantity = () => {
    setQuantity((prev) => (stockLimit ? Math.min(prev + 1, stockLimit) : prev + 1))
  }

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const handleAddToCart = (item = product, qty = quantity) => {
    if (!item || !isProductInStock(item)) return

    addToCart(item, qty)
    setAddedProductId(item.id)

    setTimeout(() => {
      setAddedProductId(null)
    }, 1500)
  }

  const handleBuyNow = () => {
    if (!product || !inStock) return

    addToCart(product, quantity)
    navigate('/checkout')
  }

  const whatsappNumber = getWhatsAppNumber(settings)
  const productWhatsAppUrl =
    product && features.product_whatsapp_enabled && whatsappNumber
      ? buildWhatsAppUrl(
          whatsappNumber,
          buildProductWhatsAppMessage(features.product_whatsapp_message, product, productUrl)
        )
      : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] px-4 py-8" dir="rtl">
        <div className="max-w-[1220px] mx-auto">
          <div className="h-4 w-64 bg-slate-200 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-pulse">
              <div className="h-[370px] bg-slate-100 rounded-2xl" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-pulse">
              <div className="h-8 bg-slate-100 rounded mb-4" />
              <div className="h-5 bg-slate-100 rounded w-40 mb-5" />
              <div className="h-20 bg-slate-100 rounded mb-5" />
              <div className="h-8 bg-slate-100 rounded w-52 mb-5" />
              <div className="h-11 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] px-4 py-20" dir="rtl">
        <div className="max-w-[900px] mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
          <h1 className="text-3xl font-black text-slate-900">المنتج غير موجود</h1>

          <p className="text-slate-500 mt-3 font-bold">
            المنتج غير متاح حالياً أو تم حذفه.
          </p>

          <Link
            to="/products"
            className="inline-flex mt-6 text-white px-7 py-3 rounded-xl font-black hover:opacity-90 transition"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            تصفح كل المنتجات
          </Link>
        </div>
      </div>
    )
  }

  const regularPrice = getRegularPrice(product)
  const sale = hasSale(product)
  const saved = getSavedAmount(product)
  const savedPercent = sale && regularPrice > 0 ? Math.round((saved / regularPrice) * 100) : 0
  const description = String(product.description || '').trim()
  const longDescription = description.length > 220 || description.split('\n').length > 3
  const showStickyBar = features.sticky_buy_bar_enabled
  const trustBadges = features.trust_badges_enabled
    ? features.trust_badges.filter((badge) => badge?.title)
    : []

  return (
    <div className={`min-h-screen bg-[#F4F7FB] ${showStickyBar ? 'pb-24 md:pb-0' : ''}`} dir="rtl">
      <section className="px-4 py-5">
        <div className="max-w-[1220px] mx-auto">
          <nav className="flex flex-wrap items-center gap-2 mb-5 text-sm text-slate-500 font-bold" aria-label="مسار الصفحة">
            <Link to="/" className="hover:text-slate-900">
              الرئيسية
            </Link>
            <span className="text-slate-300">‹</span>
            <Link to="/products" className="hover:text-slate-900">
              المنتجات
            </Link>
            {categoryLinks.map((item) => (
              <span key={item.to} className="contents">
                <span className="text-slate-300">‹</span>
                <Link to={item.to} className="hover:text-slate-900">
                  {item.label}
                </Link>
              </span>
            ))}
            <span className="text-slate-300">‹</span>
            <span className="text-slate-900 truncate max-w-[220px] sm:max-w-[360px]">
              {product.title}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* الصور */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 lg:sticky lg:top-24">
              <div className="grid grid-cols-1 md:grid-cols-[66px_1fr] gap-3">
                <div className="order-2 md:order-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {productImages.length > 1 &&
                    productImages.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        aria-label={`صورة ${index + 1}`}
                        className={
                          selectedImage === image
                            ? 'flex-shrink-0 w-[58px] h-[58px] rounded-xl border-2 border-slate-950 bg-white p-1'
                            : 'flex-shrink-0 w-[58px] h-[58px] rounded-xl border border-slate-200 bg-white p-1 hover:border-slate-500 transition'
                        }
                      >
                        <img src={image} alt="" className="w-full h-full object-contain" />
                      </button>
                    ))}
                </div>

                <button
                  type="button"
                  onClick={() => selectedImage && setImageModalOpen(true)}
                  className={`order-1 md:order-2 relative h-[300px] sm:h-[360px] lg:h-[420px] bg-white rounded-2xl flex items-center justify-center overflow-hidden cursor-zoom-in ${
                    productImages.length > 1 ? '' : 'md:col-span-2'
                  }`}
                  aria-label="تكبير الصورة"
                >
                  {sale && inStock && (
                    <span className="absolute top-3 right-3 z-10 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg">
                      خصم {savedPercent}%
                    </span>
                  )}

                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={product.title}
                      className="w-full h-full object-contain p-3 md:p-5"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black">
                      بدون صورة
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* التفاصيل */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col">
              {(product.brand || category?.name) && (
                <p className="text-sky-700 font-black text-sm mb-2">
                  {[product.brand, category?.name].filter(Boolean).join(' · ')}
                </p>
              )}

              <h1 className="text-2xl md:text-[28px] font-black leading-[1.4] text-slate-900">
                {product.title}
              </h1>

              {product.sku && (
                <p className="mt-2 text-slate-500 font-bold text-sm">
                  كود المنتج: <span className="text-slate-800 font-black" dir="ltr">{product.sku}</span>
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-1">
                <p className="text-3xl md:text-[34px] font-black text-slate-950 leading-none">
                  {formatPrice(price)} <span className="text-lg text-slate-500">جنيه</span>
                </p>

                {sale && (
                  <>
                    <p className="text-lg text-slate-400 line-through font-bold leading-none">
                      {formatPrice(regularPrice)} جنيه
                    </p>
                    <span className="bg-red-50 text-red-700 text-sm font-black px-3 py-1 rounded-full">
                      وفّر {formatPrice(saved)} جنيه
                    </span>
                  </>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-black">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-600' : 'bg-red-600'}`} />
                  {inStock ? 'متوفر في المخزون' : 'غير متوفر حالياً'}
                </span>

                {inStock && features.show_stock_quantity && stockLimit && stockLimit <= 5 && (
                  <span className="text-amber-700">باقي {stockLimit} قطع بس</span>
                )}

                {inStock && features.show_stock_quantity && stockLimit && stockLimit > 5 && (
                  <span className="text-slate-500">الكمية المتاحة: {stockLimit}</span>
                )}
              </div>

              {description && (
                <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <h2 className="font-black text-slate-900 mb-2">تفاصيل المنتج</h2>
                  <p
                    className="text-slate-600 leading-7 whitespace-pre-line text-sm md:text-base"
                    style={
                      longDescription && !descriptionExpanded
                        ? {
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }
                        : undefined
                    }
                  >
                    {description}
                  </p>
                  {longDescription && (
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded((value) => !value)}
                      className="mt-2 text-sky-700 font-black text-sm hover:underline"
                    >
                      {descriptionExpanded ? 'عرض أقل' : 'اقرأ المزيد'}
                    </button>
                  )}
                </div>
              )}

              {inStock && (
                <div className="mt-5 flex items-center gap-4">
                  <p className="text-slate-700 font-black">الكمية:</p>

                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={Boolean(stockLimit) && quantity >= stockLimit}
                      aria-label="زيادة الكمية"
                      className="w-11 h-11 text-xl font-black text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                    >
                      +
                    </button>

                    <div className="w-14 h-11 flex items-center justify-center border-x border-slate-200 font-black text-slate-900">
                      {quantity}
                    </div>

                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      aria-label="تقليل الكمية"
                      className="w-11 h-11 text-xl font-black text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                    >
                      −
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => handleAddToCart(product, quantity)}
                  disabled={!inStock}
                  className={
                    inStock
                      ? 'text-white rounded-xl py-3.5 font-black text-base hover:opacity-90 transition active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-500 rounded-xl py-3.5 font-black text-base cursor-not-allowed'
                  }
                  style={inStock ? { backgroundColor: BRAND_COLORS.primary } : undefined}
                >
                  {addedProductId === product.id ? 'تمت الإضافة ✓' : 'أضف إلى عربة التسوق'}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className={
                    inStock
                      ? 'text-white rounded-xl py-3.5 font-black text-base hover:opacity-90 transition active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-500 rounded-xl py-3.5 font-black text-base cursor-not-allowed'
                  }
                  style={inStock ? { backgroundColor: BRAND_COLORS.secondary } : undefined}
                >
                  اشترِ الآن
                </button>
              </div>

              {productWhatsAppUrl && (
                <a
                  href={productWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl py-3 font-black text-[#128C4A] bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/15 transition"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  {inStock ? 'اسأل عن المنتج على واتساب' : 'اسأل عن موعد توفّره على واتساب'}
                </a>
              )}

              {trustBadges.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                  {trustBadges.map((badge, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                        <BadgeIcon name={badge.icon} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm leading-6">{badge.title}</p>
                        {badge.text && (
                          <p className="text-slate-500 text-xs font-bold leading-5">{badge.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="px-3 sm:px-4 pt-6 pb-12 md:pb-14">
          <div className="max-w-[1220px] mx-auto">
            <div
              className="rounded-2xl px-5 md:px-6 py-4 flex items-center justify-between text-white"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              <h2 className="text-xl md:text-2xl font-black">منتجات مشابهة</h2>

              <Link
                to={categoryLinks.length ? categoryLinks[categoryLinks.length - 1].to : '/products'}
                className="text-sm md:text-base font-black hover:opacity-80 transition"
              >
                عرض الكل ←
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4 pt-4">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  added={addedProductId === item.id}
                  onAddToCart={(relatedProduct) => handleAddToCart(relatedProduct, 1)}
                  variant="grid"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* شريط الشراء الثابت على الموبايل */}
      {showStickyBar && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-[60] bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] px-3 py-2.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-500 truncate">{product.title}</p>
              <p className="font-black text-slate-950 text-lg leading-tight">
                {formatPrice(price)} <span className="text-xs text-slate-500">جنيه</span>
              </p>
            </div>

            {inStock ? (
              <>
                <button
                  type="button"
                  onClick={() => handleAddToCart(product, quantity)}
                  className="px-4 py-3 rounded-xl font-black text-sm text-white"
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                >
                  {addedProductId === product.id ? 'تم ✓' : 'أضف للسلة'}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="px-4 py-3 rounded-xl font-black text-sm text-white"
                  style={{ backgroundColor: BRAND_COLORS.secondary }}
                >
                  اشترِ الآن
                </button>
              </>
            ) : productWhatsAppUrl ? (
              <a
                href={productWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-xl font-black text-sm text-white bg-[#25D366]"
              >
                اسأل على واتساب
              </a>
            ) : (
              <span className="px-4 py-3 rounded-xl font-black text-sm bg-slate-100 text-slate-500">
                غير متوفر
              </span>
            )}
          </div>
        </div>
      )}

      {imageModalOpen && selectedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 p-4 flex items-center justify-center"
          onClick={() => setImageModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setImageModalOpen(false)}
            aria-label="إغلاق"
            className="absolute top-5 left-5 w-12 h-12 rounded-full bg-white text-slate-900 font-black text-2xl"
          >
            ×
          </button>

          <img
            src={selectedImage}
            alt={product.title}
            className="max-w-full max-h-full object-contain bg-white rounded-2xl p-4"
          />
        </div>
      )}
    </div>
  )
}
