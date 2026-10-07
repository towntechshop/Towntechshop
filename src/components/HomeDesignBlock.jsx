import { useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import { BadgeIcon } from './TrustBadges'

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

// كاميرا مرسومة (بتظهر لو مفيش صورة منتج)
function CameraArt() {
  return (
    <svg viewBox="0 0 200 140" className="w-full h-full" fill="none" aria-hidden="true">
      <rect x="128" y="18" width="16" height="44" rx="5" fill="#CBD5E1" />
      <rect x="112" y="8" width="60" height="16" rx="6" fill="#E2E8F0" />
      <rect x="22" y="44" width="140" height="58" rx="26" fill="#F8FAFC" />
      <rect x="22" y="44" width="140" height="58" rx="26" stroke="#CBD5E1" strokeWidth="2" />
      <rect x="14" y="38" width="40" height="70" rx="20" fill="#0F172A" />
      <circle cx="34" cy="73" r="20" fill="#1E293B" />
      <circle cx="34" cy="73" r="12" fill="#0B1F3A" stroke="#38BDF8" strokeWidth="3" />
      <circle cx="30" cy="69" r="4" fill="#E0F2FE" opacity="0.85" />
      <circle cx="146" cy="60" r="4" fill="#EF4444" />
    </svg>
  )
}

const BANNER_POINTS = ['جودة Full HD و 4K', 'رؤية ليلية واضحة', 'متابعة من الموبايل']

function SecurityBanner({ linkUrl, imageUrl }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <section className="px-4 py-4 md:py-6">
      <div className="max-w-[1500px] mx-auto">
        <Link
          to={linkUrl || '/products'}
          className="sec-banner group relative grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center overflow-hidden rounded-3xl bg-[#0B1F3A] text-white shadow-[0_30px_60px_-35px_rgba(11,31,58,0.9)]"
        >
          {/* الخلفية */}
          <div aria-hidden="true" className="why-us-grid absolute inset-0 opacity-[0.06]" />
          <div aria-hidden="true" className="why-us-glow absolute -top-28 right-1/4 w-96 h-96 rounded-full bg-[#1D4ED8] blur-3xl opacity-40" />
          <div aria-hidden="true" className="why-us-glow why-us-glow--slow absolute -bottom-32 left-0 w-80 h-80 rounded-full bg-[#38BDF8] blur-3xl opacity-20" />

          {/* الكلام */}
          <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold tracking-wide text-white/90">
              <span className="rec-blink w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_10px_#EF4444]" />
              Security First
            </span>

            <h3 className="mt-4 text-[26px] sm:text-3xl md:text-4xl lg:text-[44px] font-bold leading-[1.3] text-balance">
              الأمان يبدأ من{' '}
              <span className="sec-gradient-text">كاميرا واضحة</span>
            </h3>

            <p className="mt-3 text-white/70 text-sm md:text-base leading-7 max-w-md">
              حلول مراقبة للمنزل والمحل والشركة بجودة موثوقة وتركيب احترافي.
            </p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {BANNER_POINTS.map((point) => (
                <li
                  key={point}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-1.5 text-xs md:text-[13px] font-semibold text-white/85"
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#38BDF8] text-[#07111F]">
                    <CheckIcon />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <span className="btn-shine relative overflow-hidden mt-7 inline-flex items-center gap-2 rounded-xl bg-white text-[#0B1F3A] px-6 py-3 text-sm md:text-base font-bold transition group-hover:bg-[#38BDF8] group-hover:text-[#07111F]">
              تسوق الكاميرات
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
            </span>
          </div>

          {/* الرسمة: رادار بيلف وكاميرا في النص */}
          <div aria-hidden="true" className="relative z-10 h-[230px] sm:h-[260px] md:h-full md:min-h-[340px] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[260px] h-[260px] md:w-[340px] md:h-[340px]">
                <span className="absolute inset-0 rounded-full border border-white/10" />
                <span className="absolute inset-[16%] rounded-full border border-white/10" />
                <span className="absolute inset-[32%] rounded-full border border-white/15" />
                <span className="sec-radar absolute inset-0 rounded-full" />
                <span className="sec-ping absolute top-[22%] left-[24%] w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                <span className="sec-ping sec-ping--late absolute bottom-[26%] right-[18%] w-2 h-2 rounded-full bg-[#38BDF8]" />

                <div className="sec-float absolute inset-[24%] rounded-[28px] bg-white p-3 md:p-4 shadow-[0_30px_50px_-20px_rgba(0,0,0,0.7)] transition duration-500 group-hover:scale-105">
                  {imageUrl && !imageFailed ? (
                    <img src={imageUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} className="w-full h-full object-contain" />
                  ) : (
                    <CameraArt />
                  )}
                </div>
              </div>
            </div>

            <div className="sec-float sec-float--delay absolute top-5 left-5 md:top-10 md:left-8 inline-flex items-center gap-1.5 rounded-lg bg-[#07111F]/80 border border-white/10 backdrop-blur px-2.5 py-1.5 text-[11px] font-bold" dir="ltr">
              <span className="rec-blink w-2 h-2 rounded-full bg-[#EF4444]" />
              REC 24/7
            </div>

            <div className="sec-float absolute bottom-5 right-5 md:bottom-10 md:right-auto md:left-10 flex items-center gap-2.5 rounded-xl bg-white text-[#0B1F3A] px-3 py-2 shadow-xl">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#1D4ED8]">
                <BellIcon />
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-bold">تنبيه فوري</span>
                <span className="block text-[11px] text-slate-500">على موبايلك</span>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}

function TrustStrip() {
  const items = [
    { icon: 'truck', title: 'شحن سريع', desc: 'توصيل آمن لباب البيت' },
    { icon: 'shield', title: 'ضمان أصلي', desc: 'منتجات موثوقة 100%' },
    { icon: 'support', title: 'دعم فني', desc: 'مساعدة قبل وبعد البيع' },
  ]

  return (
    <section className="px-4 py-4 md:py-5">
      <div className="max-w-[1500px] mx-auto">
        <div className="grid grid-cols-3 rounded-3xl bg-white border border-slate-200 shadow-[0_18px_40px_-30px_rgba(11,31,58,0.5)] divide-x divide-x-reverse divide-slate-100 overflow-hidden">
          {items.map((item, index) => (
            <Reveal key={item.title} delay={index * 120}>
              <div className="group relative h-full flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 px-2 py-4 sm:px-6 sm:py-5 text-center sm:text-right transition-colors duration-300 hover:bg-[#F5F8FF]">
                <span className="flex-shrink-0 flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0B1F3A] to-[#1D4ED8] text-white shadow-[0_12px_24px_-12px_rgba(29,78,216,0.9)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-8deg]">
                  <BadgeIcon name={item.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] sm:text-base md:text-lg font-bold text-[#0B1F3A] leading-tight">{item.title}</span>
                  <span className="block mt-1 text-slate-500 text-[11px] sm:text-sm leading-5">{item.desc}</span>
                </span>
                <span aria-hidden="true" className="absolute bottom-0 inset-x-6 h-[3px] rounded-full bg-gradient-to-l from-[#1D4ED8] to-[#38BDF8] scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
              </div>
            </Reveal>
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
