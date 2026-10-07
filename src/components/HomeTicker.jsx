import useSiteSettings from '../hooks/useSiteSettings'

function Sparkle() {
  return (
    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-[#38BDF8] flex-shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M10 0c.6 4.9 4.1 8.4 10 10-5.9 1.6-9.4 5.1-10 10-.6-4.9-4.1-8.4-10-10C5.9 8.4 9.4 4.9 10 0Z" />
    </svg>
  )
}

// شريط جمل بيتحرك من الشمال لليمين تحت البانر (بيتعدل من مميزات الموقع)
export default function HomeTicker() {
  const { features } = useSiteSettings()

  const items = String(features.home_ticker_text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!features.home_ticker_enabled || items.length === 0) return null

  // بنكرر الجمل لحد ما النص الواحد يبقى أعرض من الشاشة عشان الحركة متقطعش
  const repeat = Math.max(2, Math.ceil(12 / items.length))
  const half = Array.from({ length: repeat }, () => items).flat()
  const duration = Math.max(half.length * 4, 30)

  return (
    <div className="home-ticker relative overflow-hidden bg-[#0B1F3A] text-white border-y border-white/5" dir="ltr">
      <span className="sr-only" dir="rtl">{items.join(' - ')}</span>
      <div
        aria-hidden="true"
        className="home-ticker-track flex w-max items-center py-2.5 md:py-3"
        style={{ '--ticker-duration': `${duration}s` }}
      >
        {[...half, ...half].map((item, index) => (
          <span key={index} className="flex items-center gap-4 px-4 md:gap-6 md:px-6">
            <Sparkle />
            <span dir="rtl" className="whitespace-nowrap text-[13px] md:text-[15px] font-semibold text-white/90">
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
