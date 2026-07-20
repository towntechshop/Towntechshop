import { Link } from 'react-router-dom'
import {
  formatPrice,
  getProductPrice,
  getRegularPrice,
  getSavedAmount,
  hasSale,
  isProductInStock,
} from '../lib/productUtils'

const BRAND_PRIMARY = '#0B1F3A'

export default function ProductCard({
  product,
  added = false,
  onAddToCart,
  className = '',
  variant = 'grid',
}) {
  const price = getProductPrice(product)
  const regularPrice = getRegularPrice(product)
  const sale = hasSale(product)
  const saved = getSavedAmount(product)
  const inStock = isProductInStock(product)

  const isCarousel = variant === 'carousel' || variant === 'carousel-fill'
  const isFill = variant === 'carousel-fill'
  const isCategory = variant === 'category'

  const imageBoxClass = isFill
    ? 'aspect-square w-full rounded-xl'
    : isCarousel
      ? 'h-[132px] sm:h-[148px] md:h-[164px] rounded-xl'
      : isCategory
        ? 'aspect-square rounded-xl'
        : 'aspect-[4/3] sm:aspect-square rounded-lg sm:rounded-xl'

  return (
    <article
      className={`group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-sky-200/70 transition-all duration-200 text-right h-full flex flex-col ${
        isFill
          ? 'p-3 sm:p-4'
          : isCategory
            ? 'p-3 sm:p-4 border-slate-100'
            : isCarousel
              ? 'p-3 sm:p-3.5'
              : 'p-2 sm:p-2.5 md:p-3.5'
      } ${className}`}
    >
      <div className="relative mb-2">
        {sale && inStock && (
          <span className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm leading-none">
            {isCategory ? `وفر ${formatPrice(saved)} جنيه` : `-${formatPrice(saved)}`}
          </span>
        )}

        {!inStock && (
          <span className="absolute top-2 right-2 z-10 bg-slate-800 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
            نفذ
          </span>
        )}

        <Link
          to={`/products/${product.id}`}
          className={`block bg-[#F8FAFC] overflow-hidden ring-1 ring-slate-100 ${imageBoxClass}`}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-contain p-2 sm:p-3 transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
              بدون صورة
            </div>
          )}
        </Link>
      </div>

      {(product.brand || product.sku) && !isFill && (
        <p
          className={`uppercase tracking-wide font-black truncate mb-0.5 ${
            isCategory
              ? 'text-[11px] text-slate-400'
              : 'text-[10px] text-sky-700/90'
          }`}
        >
          {product.brand || product.sku}
        </p>
      )}

      <Link to={`/products/${product.id}`} className="flex-1">
        <h3
          className={`text-slate-800 font-black hover:text-sky-700 transition leading-snug ${
            isFill
              ? 'text-sm sm:text-[15px] min-h-[42px] sm:min-h-[46px]'
              : isCategory
                ? 'text-sm sm:text-[15px] min-h-[44px]'
                : isCarousel
                  ? 'text-[13px] sm:text-[14px] md:text-[15px] min-h-[40px] sm:min-h-[44px]'
                  : 'text-[11px] sm:text-[13px] md:text-[14px] min-h-[32px] sm:min-h-[40px]'
          }`}
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

      <div className={`${isCarousel ? 'mt-2' : 'mt-1.5 sm:mt-2'}`}>
        {sale && (
          <p className="text-xs text-slate-400 line-through font-bold leading-tight">
            {formatPrice(regularPrice)} جنيه
          </p>
        )}
        <p
          className={`font-black leading-tight ${
            sale && isCategory ? 'text-red-600' : 'text-slate-900'
          } ${
            isFill
              ? 'text-lg sm:text-xl'
              : isCategory
                ? 'text-lg sm:text-xl'
                : isCarousel
                  ? 'text-base sm:text-lg md:text-xl'
                  : 'text-sm sm:text-base md:text-lg'
          }`}
        >
          {formatPrice(price)}{' '}
          <span className="text-xs font-bold text-slate-500">جنيه</span>
        </p>
      </div>

      <div className="mt-1.5 flex items-center justify-start gap-1.5 text-xs font-black">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            inStock ? 'bg-green-600' : 'bg-red-600'
          }`}
        />
        <span className={inStock ? 'text-green-700' : 'text-red-700'}>
          {inStock ? 'متوفر' : 'نفذ'}
        </span>
      </div>

      <div className="mt-auto pt-3">
        {inStock ? (
          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            className="w-full text-white rounded-xl py-2.5 font-black text-xs sm:text-sm transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: BRAND_PRIMARY }}
          >
            {added ? (
              'تم ✓'
            ) : isFill ? (
              <>
                <span className="md:hidden">أضف للسلة</span>
                <span className="hidden md:inline">إضافة إلى عربة التسوق</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">أضف للسلة</span>
                <span className="hidden sm:inline">إضافة إلى عربة التسوق</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full bg-slate-100 text-slate-400 rounded-xl py-2.5 font-black text-xs sm:text-sm cursor-not-allowed"
          >
            غير متوفر
          </button>
        )}
      </div>
    </article>
  )
}
