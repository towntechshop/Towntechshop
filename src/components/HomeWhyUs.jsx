import { useEffect, useRef, useState } from 'react'
import useSiteSettings from '../hooks/useSiteSettings'
import { BadgeIcon } from './TrustBadges'

// عدّاد بيعدّ من 0 للرقم أول ما يظهر على الشاشة
function CountUp({ value, plain = false, duration = 1400 }) {
  const target = Number(value) || 0
  const ref = useRef(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      setCurrent(target)
      return undefined
    }

    let frame
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const start = performance.now()
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCurrent(Math.round(target * eased))
          if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, duration])

  return <span ref={ref}>{plain ? current : current.toLocaleString('en-US')}</span>
}

// بيظهر العناصر واحد ورا التاني أول ما القسم يدخل الشاشة
function useInView() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, visible]
}

export default function HomeWhyUs() {
  const { features } = useSiteSettings()
  const [ref, visible] = useInView()

  const showAbout = features.home_intro_enabled
  const showBadges = features.home_trust_strip_enabled
  const badges = (features.trust_badges || []).filter((badge) => badge?.title)
  const stats = (features.home_stats || []).filter((stat) => stat?.label)

  if (!showAbout && (!showBadges || badges.length === 0)) return null

  return (
    <section className="px-4 py-6 md:py-10">
      <div
        ref={ref}
        className="why-us relative max-w-[1500px] mx-auto overflow-hidden rounded-3xl bg-[#0B1F3A] text-white"
      >
        {/* خلفية: شبكة خفيفة وإضاءة بتتحرك ببطء */}
        <div aria-hidden="true" className="why-us-grid absolute inset-0 opacity-[0.07]" />
        <div aria-hidden="true" className="why-us-glow absolute -top-24 -right-16 w-80 h-80 rounded-full bg-[#1D4ED8] blur-3xl opacity-40" />
        <div aria-hidden="true" className="why-us-glow why-us-glow--slow absolute -bottom-28 -left-10 w-72 h-72 rounded-full bg-[#38BDF8] blur-3xl opacity-20" />

        <div
          className={`relative grid grid-cols-1 gap-8 p-6 sm:p-8 md:p-10 ${
            showAbout && showBadges && badges.length ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:items-center' : ''
          }`}
        >
          {showAbout && (
            <div className={`why-us-fade ${visible ? 'is-visible' : ''}`}>
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold leading-[1.35] text-balance">
                {features.home_about_title}
              </h2>
              {features.home_about_text && (
                <p className="mt-3 text-white/70 text-[15px] md:text-base leading-8 max-w-xl">
                  {features.home_about_text}
                </p>
              )}

              {stats.length > 0 && (
                <dl className="mt-7 grid grid-cols-3 gap-3 md:gap-4">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-4 md:px-4 md:py-5 text-center"
                    >
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span className="block text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-none" dir="ltr">
                          {stat.prefix}
                          <CountUp value={stat.value} plain={Number(stat.value) >= 1900 && Number(stat.value) <= 2100} />
                          {stat.suffix}
                        </span>
                        <span className="block mt-2 text-[11px] sm:text-xs md:text-sm text-white/65 leading-5">
                          {stat.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}

          {showBadges && badges.length > 0 && (
            <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 md:gap-4">
              {badges.map((badge, index) => (
                <li
                  key={index}
                  style={{ transitionDelay: visible ? `${150 + index * 110}ms` : '0ms' }}
                  className={`why-us-card group relative rounded-2xl bg-white/[0.05] border border-white/10 p-4 md:p-5 transition duration-500 hover:bg-white/[0.09] hover:border-white/20 hover:-translate-y-1 ${
                    visible ? 'is-visible' : ''
                  }`}
                >
                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1D4ED8] text-white shadow-[0_10px_24px_-10px_rgba(29,78,216,0.9)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <BadgeIcon name={badge.icon} />
                  </span>
                  <h3 className="mt-3.5 font-bold text-base md:text-lg leading-7">{badge.title}</h3>
                  {badge.text && <p className="mt-1 text-white/65 text-sm leading-6">{badge.text}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
