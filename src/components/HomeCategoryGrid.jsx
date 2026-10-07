import { Link } from 'react-router-dom'

// شبكة الأقسام بشكل شاشة DVR متعددة الكاميرات — كل قسم "قناة"
export default function HomeCategoryGrid({ title, tiles }) {
  if (!tiles?.length) return null

  return (
    <section className="px-4 py-6 md:py-9">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex items-end justify-between gap-4 mb-4 md:mb-5">
          <h2 className="text-xl md:text-[28px] font-bold text-[#0B1F3A] leading-tight">
            {title}
          </h2>
          <Link
            to="/products"
            className="text-sm md:text-base font-bold text-[#0B1F3A]/70 hover:text-[#0B1F3A] transition whitespace-nowrap"
          >
            كل المنتجات
          </Link>
        </div>

        <div className="rounded-[22px] bg-[#07111F] p-1.5 md:p-2 shadow-[0_18px_40px_-24px_rgba(7,17,31,0.75)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-2">
            {tiles.map((tile, index) => (
              <Link
                key={tile.id}
                to={tile.to}
                className="group flex flex-col rounded-[14px] overflow-hidden bg-[#0E2440] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5262F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]"
              >
                {/* شريط القناة العلوي */}
                <div className="flex items-center justify-between px-2.5 md:px-3 py-1.5 bg-[#0E2440]">
                  <span className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-semibold text-white/90 tracking-wide" dir="ltr">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#E5262F] shadow-[0_0_0_3px_rgba(229,38,47,0.22)]" />
                    CH{String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] md:text-[11px] font-semibold text-white/70">
                    {tile.count} منتج
                  </span>
                </div>

                <div className="relative aspect-[4/3] bg-white overflow-hidden">
                  {tile.image ? (
                    <img
                      src={tile.image}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden'
                      }}
                      className="absolute inset-0 w-full h-full object-contain p-4 md:p-6 transition duration-300 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#123566] to-[#07111F]" />
                  )}
                </div>

                {/* اسم القسم */}
                <div className="px-2.5 md:px-3.5 py-2 md:py-2.5 bg-[#07111F] flex items-center justify-between gap-2">
                  <span className="text-white font-semibold text-sm md:text-base truncate">
                    {tile.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex-shrink-0 text-white/50 group-hover:text-[#E5262F] transition"
                  >
                    ‹
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
