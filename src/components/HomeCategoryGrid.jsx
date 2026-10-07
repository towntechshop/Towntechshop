import { Link } from 'react-router-dom'
import Reveal from './Reveal'

function TileImage({ src, className }) {
  if (!src) return null

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.visibility = 'hidden'
      }}
      className={className}
    />
  )
}

// أكبر قسمين: كروت عريضة مميزة
function FeaturedTile({ tile, delay }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Link
        to={tile.to}
        className="group relative flex h-full min-h-[170px] md:min-h-[210px] items-center gap-4 md:gap-6 overflow-hidden rounded-2xl bg-[#0B1F3A] p-4 md:p-6 text-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_-22px_rgba(11,31,58,0.8)]"
      >
        <div
          aria-hidden="true"
          className="absolute -left-16 -bottom-20 w-64 h-64 rounded-full bg-[#38BDF8]/10 transition-transform duration-500 group-hover:scale-125"
        />

        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-white/60 text-sm font-semibold">{tile.count} منتج</p>
          <h3 className="mt-1 text-2xl md:text-[32px] font-bold leading-tight">{tile.name}</h3>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#D7262E] px-4 py-2 text-sm font-bold transition group-hover:bg-[#bf1f27]">
            تسوق الآن
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>
          </span>
        </div>

        <div className="relative z-10 flex-shrink-0 w-[118px] h-[118px] md:w-[160px] md:h-[160px] rounded-2xl bg-white p-3 md:p-4 shadow-lg">
          <TileImage
            src={tile.image}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2"
          />
        </div>
      </Link>
    </Reveal>
  )
}

function CompactTile({ tile, delay }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Link
        to={tile.to}
        className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3 transition duration-300 hover:-translate-y-1 hover:border-[#0B1F3A]/30 hover:shadow-[0_16px_30px_-20px_rgba(11,31,58,0.55)]"
      >
        <div className="aspect-square rounded-xl bg-[#F5F7FA] p-2.5 overflow-hidden">
          <TileImage
            src={tile.image}
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        <div className="flex items-end justify-between gap-2 px-1 pt-3 pb-1">
          <div className="min-w-0">
            <h3 className="font-bold text-[15px] md:text-base text-[#0B1F3A] leading-6 truncate">
              {tile.name}
            </h3>
            <p className="text-xs md:text-[13px] text-slate-500">{tile.count} منتج</p>
          </div>
          <span
            aria-hidden="true"
            className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-[#0B1F3A] flex items-center justify-center transition group-hover:bg-[#D7262E] group-hover:text-white"
          >
            ←
          </span>
        </div>
      </Link>
    </Reveal>
  )
}

export default function HomeCategoryGrid({ title, tiles }) {
  if (!tiles?.length) return null

  const featured = tiles.length >= 4 ? tiles.slice(0, 2) : []
  const rest = featured.length ? tiles.slice(2) : tiles

  return (
    <section className="px-4 py-7 md:py-10">
      <div className="max-w-[1500px] mx-auto">
        <Reveal className="flex items-end justify-between gap-4 mb-5">
          <h2 className="text-2xl md:text-[30px] font-bold text-[#0B1F3A] leading-tight">{title}</h2>
          <Link
            to="/products"
            className="text-sm md:text-base font-bold text-[#0B1F3A]/70 hover:text-[#D7262E] transition whitespace-nowrap"
          >
            كل المنتجات
          </Link>
        </Reveal>

        {featured.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
            {featured.map((tile, index) => (
              <FeaturedTile key={tile.id} tile={tile} delay={index * 90} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {rest.map((tile, index) => (
            <CompactTile key={tile.id} tile={tile} delay={(index % 5) * 70} />
          ))}
        </div>
      </div>
    </section>
  )
}
