import { Link } from 'react-router-dom'
import Reveal from './Reveal'

// صف الأقسام بدوائر (تحت البانر)
export default function HomeCategoryGrid({ title, tiles }) {
  if (!tiles?.length) return null

  return (
    <section className="px-4 pt-4 pb-2 md:pt-6">
      <div className="max-w-[1500px] mx-auto bg-white rounded-lg border border-slate-200">
        <h2 className="text-center text-base md:text-xl font-bold text-[#0B1F3A] py-3 md:py-4 border-b border-slate-100">
          {title}
        </h2>

        <div className="flex md:flex-wrap md:justify-center gap-4 md:gap-x-8 md:gap-y-6 overflow-x-auto md:overflow-visible px-4 py-5 md:py-7 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tiles.map((tile, index) => (
            <Reveal key={tile.id} delay={Math.min(index, 8) * 60} className="flex-shrink-0">
              <Link
                to={tile.to}
                className="group flex w-[84px] md:w-[124px] flex-col items-center text-center focus-visible:outline-none"
              >
                <span className="relative flex items-center justify-center w-[76px] h-[76px] md:w-[112px] md:h-[112px] rounded-full bg-[#F5F7FA] ring-2 ring-[#0B1F3A]/80 ring-offset-2 ring-offset-white transition duration-300 group-hover:ring-[#38BDF8] group-hover:-translate-y-1 group-focus-visible:ring-[#D7262E] overflow-hidden">
                  {tile.image ? (
                    <img
                      src={tile.image}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden'
                      }}
                      className="w-full h-full object-contain mix-blend-multiply p-3 md:p-4 transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-[#0B1F3A]">{tile.name.charAt(0)}</span>
                  )}
                </span>

                <span className="mt-2.5 text-[13px] md:text-[15px] font-bold text-slate-800 leading-5 line-clamp-2 group-hover:text-[#0B1F3A]">
                  {tile.name}
                </span>
                <span className="mt-0.5 text-[11px] md:text-xs text-slate-400">{tile.count} منتج</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
