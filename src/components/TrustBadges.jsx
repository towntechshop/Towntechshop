import useSiteSettings from '../hooks/useSiteSettings'

export function BadgeIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'w-6 h-6',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (name) {
    case 'truck':
      return (
        <svg {...common}>
          <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
          <circle cx="7" cy="17.5" r="1.8" />
          <circle cx="17" cy="17.5" r="1.8" />
        </svg>
      )
    case 'cash':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6.5 9.5v5M17.5 9.5v5" />
        </svg>
      )
    case 'support':
      return (
        <svg {...common}>
          <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
          <rect x="3" y="13" width="4" height="6" rx="1.5" />
          <rect x="17" y="13" width="4" height="6" rx="1.5" />
          <path d="M19 19c0 1.5-2 2.5-5 2.5" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
        </svg>
      )
    case 'tools':
      return (
        <svg {...common}>
          <path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-.5-.5-2.5z" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />
          <path d="m8.8 12.2 2.2 2.2 4.2-4.4" />
        </svg>
      )
  }
}

// شريط مميزات المتجر في الصفحة الرئيسية (نفس البيانات اللي في لوحة التحكم ← مميزات الموقع)
export function TrustBadgesStrip() {
  const { features } = useSiteSettings()

  if (!features.home_trust_strip_enabled) return null

  const badges = (features.trust_badges || []).filter((badge) => badge?.title)
  if (!badges.length) return null

  return (
    <section className="px-4 -mt-px md:mt-0 md:pt-5">
      <div className="max-w-[1500px] mx-auto">
        <ul className="grid grid-cols-2 lg:grid-cols-4 bg-white md:rounded-2xl border-y md:border border-slate-200 divide-x divide-x-reverse divide-slate-100">
          {badges.map((badge, index) => (
            <li
              key={index}
              className={`flex items-center gap-3 px-3.5 md:px-5 py-3.5 md:py-4 ${
                index >= 2 ? 'border-t lg:border-t-0 border-slate-100' : ''
              }`}
            >
              <span className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center">
                <BadgeIcon name={badge.icon} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[#0B1F3A] text-sm md:text-[15px] leading-6 truncate">
                  {badge.title}
                </p>
                {badge.text && (
                  <p className="text-slate-500 text-xs md:text-[13px] leading-5 truncate">
                    {badge.text}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
