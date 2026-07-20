import { Link } from 'react-router-dom'
import ProductCarousel from './ProductCarousel'

const BRAND_PRIMARY = '#0B1F3A'

export default function HomeProductSection({
  title,
  subtitle,
  viewAllUrl,
  loading,
  emptyText,
  children,
}) {
  return (
    <section className="px-4 py-5 md:py-7">
      <div className="max-w-[1500px] mx-auto">
        <div
          className="rounded-t-2xl md:rounded-t-[20px] px-5 md:px-6 py-4 flex items-center justify-between gap-4 text-white"
          style={{ backgroundColor: BRAND_PRIMARY }}
        >
          <div className="text-right min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-white/70 text-xs md:text-sm font-bold mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>

          <Link
            to={viewAllUrl}
            className="flex-shrink-0 text-sm md:text-base font-black text-white/90 hover:text-white transition whitespace-nowrap"
          >
            عرض الكل ←
          </Link>
        </div>

        <div className="bg-white rounded-b-2xl md:rounded-b-[20px] border border-slate-200 border-t-0 p-4 md:p-5 shadow-sm">
          {loading ? (
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex-shrink-0 w-[185px] md:w-[280px] bg-slate-50 rounded-2xl border border-slate-100 p-3 animate-pulse"
                >
                  <div className="h-[132px] md:h-[164px] bg-slate-100 rounded-xl mb-3" />
                  <div className="h-3 bg-slate-100 rounded mb-2" />
                  <div className="h-9 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : !children || (Array.isArray(children) && children.length === 0) ? (
            <div className="py-10 text-center">
              <p className="text-slate-500 font-bold">{emptyText}</p>
            </div>
          ) : (
            <ProductCarousel>{children}</ProductCarousel>
          )}
        </div>
      </div>
    </section>
  )
}
