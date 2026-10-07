import { Link } from 'react-router-dom'
import {
  formatPrice,
  getProductPrice,
  getRegularPrice,
  getSavedAmount,
  hasSale,
  isProductInStock,
} from '../lib/productUtils'
import useSiteSettings from '../hooks/useSiteSettings'
import useSavedList from '../hooks/useSavedList'
import { COMPARE_MAX, toggleInList } from '../lib/savedLists'

function HeartIcon({ filled, className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
    </svg>
  )
}

function CompareIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4v16M17 4v16M3 8l4-4 4 4M13 16l4 4 4-4" />
    </svg>
  )
}

const BRAND_PRIMARY = '#0B1F3A'

function CartIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.6-6.8H6.2" />
    </svg>
  )
}

// كارت المنتج (نفس الشكل في الرئيسية وصفحة المنتجات والمنتجات المشابهة)
export default function ProductCard({
  product,
  added = false,
  onAddToCart,
  className = '',
}) {
  const { features } = useSiteSettings()
  const wishlist = useSavedList('wishlist')
  const compareList = useSavedList('compare')
  const inWishlist = wishlist.some((item) => item.id === product.id)
  const inCompare = compareList.some((item) => item.id === product.id)

  const handleCompare = () => {
    const result = toggleInList('compare', product)
    if (result.full) {
      window.alert(`تقدر تقارن لحد ${COMPARE_MAX} منتجات. شيل منتج من المقارنة الأول.`)
    }
  }

  const price = getProductPrice(product)
  const regularPrice = getRegularPrice(product)
  const sale = hasSale(product)
  const saved = getSavedAmount(product)
  const inStock = isProductInStock(product)
  const savedPercent = sale && regularPrice > 0 ? Math.round((saved / regularPrice) * 100) : 0

  const discountLabel =
    features.discount_badge_style === 'percent'
      ? `خصم ${savedPercent}%`
      : `وفّر ${formatPrice(saved)}`

  return (
    <article
      className={`group h-full flex flex-col bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 text-right transition duration-300 hover:border-[#0B1F3A]/25 hover:shadow-[0_14px_30px_-18px_rgba(11,31,58,0.45)] ${className}`}
    >
      <div className="relative">
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => toggleInList('wishlist', product)}
          aria-label={inWishlist ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          aria-pressed={inWishlist}
          className={`w-8 h-8 rounded-full bg-white/95 border border-slate-200 shadow-sm flex items-center justify-center transition hover:scale-110 ${
            inWishlist ? 'text-[#D7262E]' : 'text-slate-500 hover:text-[#D7262E]'
          }`}
        >
          <HeartIcon filled={inWishlist} />
        </button>
        <button
          type="button"
          onClick={handleCompare}
          aria-label={inCompare ? 'إزالة من المقارنة' : 'إضافة للمقارنة'}
          aria-pressed={inCompare}
          className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition hover:scale-110 ${
            inCompare ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white' : 'bg-white/95 border-slate-200 text-slate-500 hover:text-[#1D4ED8]'
          }`}
        >
          <CompareIcon />
        </button>
      </div>
      <Link
        to={`/products/${product.id}`}
        className="relative block aspect-square rounded-md bg-[#F5F7FA] overflow-hidden"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain mix-blend-multiply p-2 sm:p-3 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
            بدون صورة
          </span>
        )}

        {!inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-white text-center text-xs font-bold py-1.5">
            نفذت الكمية
          </span>
        )}
      </Link>
      </div>

      <Link to={`/products/${product.id}`} className="mt-2.5 block">
        <h3
          className="text-[13px] sm:text-sm font-semibold text-slate-800 leading-[1.55] min-h-[2.6rem] group-hover:text-[#0B1F3A] transition"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.title}
        </h3>
      </Link>

      {(product.brand || product.sku) && (
        <p className="mt-1 text-[11px] text-slate-400 truncate" dir="auto">
          {product.brand || product.sku}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-base sm:text-lg font-bold text-[#0B1F3A] leading-none">
          {formatPrice(price)} <span className="text-xs font-semibold text-slate-500">جنيه</span>
        </p>
        {sale && (
          <>
            <span className="text-xs text-slate-400 line-through leading-none">
              {formatPrice(regularPrice)}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#D7262E] bg-red-50 px-1.5 py-0.5 rounded leading-none">
              {discountLabel}
            </span>
          </>
        )}
      </div>

      <div className="mt-auto pt-3">
        {inStock ? (
          <button
            key={added ? 'added' : 'idle'}
            type="button"
            onClick={() => onAddToCart?.(product)}
            className="added-pop w-full flex items-center justify-center gap-2 text-white rounded-md py-2.5 font-bold text-xs sm:text-sm transition hover:brightness-125 active:scale-[0.98]"
            style={{ backgroundColor: BRAND_PRIMARY }}
          >
            {added ? (
              'تمت الإضافة ✓'
            ) : (
              <>
                <CartIcon />
                أضف للسلة
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full bg-slate-100 text-slate-400 rounded-md py-2.5 font-bold text-xs sm:text-sm cursor-not-allowed"
          >
            غير متوفر
          </button>
        )}
      </div>
    </article>
  )
}
