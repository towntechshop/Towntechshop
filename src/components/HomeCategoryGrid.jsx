import { Link } from 'react-router-dom'
import { SectionHeading } from './HomeProductSection'

function TileImage({ src, className }) {
  if (!src) return null

  return (
    <img
      src={src}
      alt=""
      loading="eager"
      onError={(event) => {
        event.currentTarget.style.visibility = 'hidden'
      }}
      className={className}
    />
  )
}

// أكبر قسم: كارت مميز كبير
function FeaturedTile({ tile }) {
  return (
    <Link
      to={tile.to}
      className="category-pop-in group relative col-span-2 sm:col-span-3 lg:col-span-2 lg:row-span-2 flex flex-row lg:flex-col items-center lg:items-stretch justify-between gap-3 overflow-hidden rounded-3xl bg-[#0B1F3A] text-white p-5 sm:p-6 lg:p-8 min-h-[190px] lg:min-h-0 transition duration-300 hover:shadow-[0_28px_50px_-28px_rgba(11,31,58,0.9)]"
    >
      <div aria-hidden="true" className="absolute -left-20 -bottom-24 w-80 h-80 rounded-full bg-[#1D4ED8]/40 blur-3xl transition-transform duration-700 group-hover:scale-125" />
      <div aria-hidden="true" className="why-us-grid absolute inset-0 opacity-[0.06]" />

      <div className="relative z-10 min-w-0 max-w-[260px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold text-white/85">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
          الأكثر طلباً
        </span>
        <h3 className="mt-3 text-[22px] sm:text-3xl lg:text-4xl font-bold leading-tight">{tile.name}</h3>
        <p className="mt-1.5 text-white/65 text-sm">{tile.count} منتج متاح</p>
        <span className="mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-xl bg-white text-[#0B1F3A] px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-bold transition group-hover:bg-[#38BDF8] group-hover:text-[#07111F]">
          تسوق الآن
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
        </span>
      </div>

      <div className="relative z-10 flex-shrink-0 lg:self-end w-28 h-28 sm:w-44 sm:h-44 lg:w-64 lg:h-64 rounded-2xl sm:rounded-[28px] bg-white p-3 sm:p-4 lg:p-6 shadow-[0_24px_40px_-18px_rgba(0,0,0,0.6)] rotate-[-4deg] transition duration-500 group-hover:rotate-0 group-hover:scale-105">
        <TileImage src={tile.image} className="w-full h-full object-contain" />
      </div>
    </Link>
  )
}

function CompactTile({ tile, index }) {
  return (
    <Link
      to={tile.to}
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
      className="category-pop-in group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 transition duration-300 hover:-translate-y-1 hover:border-[#1D4ED8]/40 hover:shadow-[0_20px_36px_-24px_rgba(29,78,216,0.6)]"
    >
      <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-[#EEF4FF] text-[#1D4ED8] text-[11px] font-bold px-2 py-0.5">
        {tile.count}
      </span>

      <div className="relative aspect-[4/3] bg-white">
        <TileImage
          src={tile.image}
          className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <div className="relative mt-auto flex items-center justify-between gap-2 border-t border-slate-100 px-3.5 py-3">
        <span className="font-bold text-[15px] text-[#0B1F3A] truncate">{tile.name}</span>
        <span
          aria-hidden="true"
          className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-[#0B1F3A] flex items-center justify-center text-sm transition duration-300 group-hover:bg-[#1D4ED8] group-hover:text-white"
        >
          ←
        </span>
      </div>

      <span
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-[3px] bg-[#1D4ED8] origin-right scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
      />
    </Link>
  )
}

// تسوق حسب القسم: أكبر قسم كارت مميز + باقي الأقسام حواليه (Bento)
export default function HomeCategoryGrid({ title, tiles }) {
  if (!tiles?.length) return null

  const [featured, ...rest] = tiles

  return (
    <section className="px-4 pt-5 pb-2 md:pt-8">
      <div className="max-w-[1500px] mx-auto">
        <SectionHeading title={title} viewAllUrl="/products" viewAllLabel="كل المنتجات" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 [grid-auto-flow:dense]">
          <FeaturedTile tile={featured} />
          {rest.map((tile, index) => (
            <CompactTile key={tile.id} tile={tile} index={index + 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
