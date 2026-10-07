import { Link } from 'react-router-dom'
import { SectionHeading } from './HomeProductSection'

// تسوق حسب القسم: كروت بصورة كبيرة واسم واضح
export default function HomeCategoryGrid({ title, tiles }) {
  if (!tiles?.length) return null

  return (
    <section className="px-4 pt-5 pb-2 md:pt-8">
      <div className="max-w-[1500px] mx-auto">
        <SectionHeading title={title} viewAllUrl="/products" viewAllLabel="كل المنتجات" />

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:gap-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tiles.map((tile, index) => (
            <Link
              key={tile.id}
              to={tile.to}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              className="category-pop-in group snap-start flex-shrink-0 w-[138px] md:w-auto flex flex-col rounded-2xl border border-[#DCE7F7] bg-gradient-to-b from-[#EAF2FF] via-white to-white p-3 transition duration-300 hover:-translate-y-1 hover:border-[#1D4ED8]/50 hover:shadow-[0_18px_34px_-22px_rgba(29,78,216,0.55)]"
            >
              <span className="relative aspect-square flex items-center justify-center">
                {tile.image ? (
                  <img
                    src={tile.image}
                    alt=""
                    loading="eager"
                    onError={(event) => {
                      event.currentTarget.style.visibility = 'hidden'
                    }}
                    className="w-[88%] h-[88%] object-contain mix-blend-multiply drop-shadow-[0_10px_12px_rgba(11,31,58,0.12)] transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <span className="text-4xl font-bold text-[#0B1F3A]/30">{tile.name.charAt(0)}</span>
                )}
              </span>

              <span className="mt-2 flex items-end justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-sm md:text-[15px] font-bold text-[#0B1F3A] leading-6 truncate">
                    {tile.name}
                  </span>
                  <span className="block text-[11px] md:text-xs text-slate-500">{tile.count} منتج</span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0B1F3A] text-white text-sm flex items-center justify-center transition duration-300 group-hover:bg-[#1D4ED8] group-hover:-translate-x-0.5"
                >
                  ←
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
