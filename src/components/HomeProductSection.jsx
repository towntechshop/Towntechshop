import { Link } from 'react-router-dom'

function GridIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}

export function SectionHeading({ title, viewAllUrl, viewAllLabel = 'عرض الكل' }) {
  return (
    <div className="flex items-center gap-3 md:gap-4 mb-4">
      <h2 className="flex-shrink-0 text-lg sm:text-xl md:text-2xl font-bold text-[#0B1F3A]">{title}</h2>
      <span
        aria-hidden="true"
        className="flex-1 h-[3px] rounded-full bg-gradient-to-l from-[#0B1F3A] via-[#38BDF8]/60 to-transparent"
      />
      {viewAllUrl && (
        <Link
          to={viewAllUrl}
          className="flex-shrink-0 inline-flex items-center gap-1.5 border border-slate-300 bg-white rounded-md px-3 py-1.5 text-xs sm:text-sm font-bold text-[#0B1F3A] hover:border-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white transition"
        >
          <GridIcon className="w-3.5 h-3.5" />
          {viewAllLabel}
        </Link>
      )}
    </div>
  )
}

// قسم منتجات في الرئيسية: عنوان + خط + زرار (عرض الكل) + شبكة منتجات
export default function HomeProductSection({
  title,
  viewAllUrl,
  loading,
  emptyText,
  children,
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0)

  return (
    <section className="px-4 py-5 md:py-7">
      <div className="max-w-[1500px] mx-auto">
        <SectionHeading title={title} viewAllUrl={viewAllUrl} />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className={`bg-white rounded-lg border border-slate-200 p-3 animate-pulse ${item > 4 ? 'hidden sm:block' : ''}`}
              >
                <div className="aspect-square bg-slate-100 rounded-md mb-3" />
                <div className="h-3 bg-slate-100 rounded mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                <div className="h-9 bg-slate-100 rounded-md" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="py-10 text-center bg-white rounded-lg border border-slate-200">
            <p className="text-slate-500 font-bold">{emptyText}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3">
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
