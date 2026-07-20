import { Link } from 'react-router-dom'

function SecurityBanner({ linkUrl, imageUrl }) {
  return (
    <section className="px-4 py-4 md:py-5">
      <div className="max-w-[1500px] mx-auto">
        <Link
          to={linkUrl || '/products'}
          className="group relative block overflow-hidden rounded-2xl md:rounded-3xl min-h-[140px] md:min-h-[180px] shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-l from-[#07111F] via-[#0B2A45] to-[#1E5A83]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(56,189,248,0.25),transparent_45%)]" />

          <div className="relative z-10 flex items-center justify-between gap-4 p-5 md:p-8">
            <div className="text-white text-right flex-1">
              <span className="inline-block bg-white/15 text-sky-200 px-3 py-1 rounded-full text-xs font-black mb-2">
                Security First
              </span>
              <h3 className="text-xl md:text-3xl font-black leading-tight">
                الأمان يبدأ من كاميرا واضحة
              </h3>
              <p className="text-white/75 font-bold text-sm md:text-base mt-2 max-w-xl">
                حلول مراقبة للمنزل والمحل والشركة بجودة موثوقة
              </p>
              <span className="inline-flex items-center gap-2 mt-4 bg-white text-[#0B1F3A] px-4 py-2 rounded-xl font-black text-sm group-hover:bg-sky-100 transition">
                تسوق الآن ←
              </span>
            </div>

            {imageUrl && (
              <div className="hidden sm:block w-32 md:w-48 h-28 md:h-36 flex-shrink-0">
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-contain group-hover:scale-105 transition"
                />
              </div>
            )}
          </div>
        </Link>
      </div>
    </section>
  )
}

function TrustStrip() {
  const items = [
    { title: 'شحن سريع', desc: 'توصيل آمن لباب البيت' },
    { title: 'ضمان أصلي', desc: 'منتجات موثوقة 100%' },
    { title: 'دعم فني', desc: 'مساعدة قبل وبعد البيع' },
  ]

  return (
    <section className="px-4 py-4 md:py-5">
      <div className="max-w-[1500px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm px-5 py-4 md:py-5 text-right"
            >
              <div className="w-10 h-1 rounded-full bg-[#38BDF8] mb-3" />
              <h4 className="text-base md:text-lg font-black text-slate-900">
                {item.title}
              </h4>
              <p className="text-slate-500 font-bold text-sm mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomeDesignBlock({ variant, linkUrl, imageUrl }) {
  if (variant === 'security') {
    return <SecurityBanner linkUrl={linkUrl} imageUrl={imageUrl} />
  }

  if (variant === 'trust') {
    return <TrustStrip />
  }

  return null
}
