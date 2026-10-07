import { Link } from 'react-router-dom'
import useSiteSettings from '../hooks/useSiteSettings'
import Reveal from './Reveal'

function BannerLink({ banner, children, className }) {
  const link = String(banner.link || '').trim()

  if (!link) return <div className={className}>{children}</div>

  if (/^https?:\/\//i.test(link)) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link to={link.startsWith('/') ? link : `/${link}`} className={className}>
      {children}
    </Link>
  )
}

// بانرات عروض (لحد 3) — بتتحكم فيها من لوحة التحكم ← مميزات الموقع
export default function HomePromoBanners() {
  const { features } = useSiteSettings()
  const banners = (features.home_banners || []).filter((banner) => banner?.image_url)

  if (!features.home_banners_enabled || banners.length === 0) return null

  const columns =
    banners.length === 1 ? 'grid-cols-1' : banners.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'

  return (
    <section className="px-4 py-3 md:py-5">
      <div className={`max-w-[1500px] mx-auto grid grid-cols-1 ${columns} gap-3 md:gap-4`}>
        {banners.map((banner, index) => (
          <Reveal key={`${banner.image_url}-${index}`} delay={index * 90}>
            <BannerLink
              banner={banner}
              className="group block overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <img
                src={banner.image_url}
                alt={banner.alt || ''}
                loading="lazy"
                className="w-full h-auto aspect-[16/7] object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </BannerLink>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
