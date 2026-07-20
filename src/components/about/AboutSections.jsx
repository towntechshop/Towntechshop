function PriceIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none" stroke="#0B1F3A" strokeWidth="2.5">
      <circle cx="32" cy="32" r="22" />
      <path d="M24 28h12a6 6 0 1 1 0 12H26" strokeLinecap="round" />
      <path d="M32 22v24" strokeLinecap="round" />
    </svg>
  )
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none" stroke="#0B1F3A" strokeWidth="2.5">
      <rect x="10" y="18" width="44" height="30" rx="4" />
      <path d="M10 28h44" />
      <path d="M18 40h10" strokeLinecap="round" />
    </svg>
  )
}

function WarrantyIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none" stroke="#0B1F3A" strokeWidth="2.5">
      <path d="M32 8 52 16v16c0 12-8 20-20 24C20 52 12 44 12 32V16L32 8Z" />
      <path d="M24 32l6 6 12-12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ReturnIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none" stroke="#0B1F3A" strokeWidth="2.5">
      <path d="M14 24h28a10 10 0 1 1-10 10H18" strokeLinecap="round" />
      <path d="M22 18 14 24l8 6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="34" y="34" width="16" height="14" rx="2" />
    </svg>
  )
}

const ICON_MAP = {
  price: PriceIcon,
  payment: PaymentIcon,
  warranty: WarrantyIcon,
  return: ReturnIcon,
}

export function AboutFeatureIcon({ iconKey, iconUrl }) {
  if (iconUrl) {
    return (
      <img src={iconUrl} alt="" className="w-14 h-14 object-contain" loading="lazy" />
    )
  }

  const Icon = ICON_MAP[iconKey] || PriceIcon
  return <Icon />
}

export function AboutFramedMedia({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute top-0 left-0 w-14 h-14 md:w-20 md:h-20 border-t-[5px] border-l-[5px] border-[#0B1F3A] z-10 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-14 h-14 md:w-20 md:h-20 border-b-[5px] border-r-[5px] border-[#0B1F3A] z-10 pointer-events-none" />
      <div className="relative w-full h-full overflow-hidden">{children}</div>
    </div>
  )
}

export function AboutMedia({ imageUrl, alt = '', className = '', cover = false }) {
  const mediaClass = cover
    ? 'w-full h-full object-cover'
    : 'w-full h-full object-cover rounded-sm'

  if (imageUrl) {
    return <img src={imageUrl} alt={alt} className={mediaClass} loading="lazy" />
  }

  return (
    <div className={`bg-slate-200 flex items-center justify-center ${className}`}>
      <span className="text-slate-400 font-bold text-sm">أضف صورة</span>
    </div>
  )
}

export function AboutHeroMedia({ imageUrl, alt }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
    )
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3A] via-[#123D68] to-[#07111F]" />
  )
}
