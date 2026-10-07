import useSiteSettings from '../hooks/useSiteSettings'

// طرق الدفع المفعّلة في الموقع + أيقوناتها
// لو رفعت شعار رسمي لأي طريقة من لوحة التحكم ← مميزات الموقع، بيظهر بدل الأيقونة
export function getPaymentMethods(settings, features) {
  const logos = features?.payment_logos || {}

  return [
    { id: 'cash_on_delivery', label: 'الدفع عند الاستلام', short: 'كاش', icon: 'cash', enabled: true },
    { id: 'paymob', label: 'فيزا / ماستركارد', short: 'كارت', icon: 'card', enabled: Boolean(settings?.paymob_enabled) },
    { id: 'vodafone_cash', label: 'فودافون كاش', short: 'محفظة', icon: 'wallet', enabled: Boolean(settings?.enable_vodafone_cash) },
    { id: 'instapay', label: 'إنستا باي', short: 'تحويل', icon: 'bank', enabled: Boolean(settings?.enable_instapay) },
  ]
    .filter((method) => method.enabled)
    .map((method) => ({ ...method, logo: logos[method.id] || '' }))
}

export function PaymentIcon({ name, className = 'w-5 h-5' }) {
  const common = {
    viewBox: '0 0 24 24',
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'card') {
    return (
      <svg {...common}>
        <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
        <path d="M2.5 10h19M6.5 15h4" />
      </svg>
    )
  }

  if (name === 'wallet') {
    return (
      <svg {...common}>
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
        <path d="M10.5 18.5h3M9 6.5h6" />
      </svg>
    )
  }

  if (name === 'bank') {
    return (
      <svg {...common}>
        <path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5v5M18 9.5v5" />
    </svg>
  )
}

// شارة طريقة دفع واحدة (شعار أو أيقونة + اسم)
export function PaymentBadge({ method, tone = 'light', size = 'md' }) {
  const isDark = tone === 'dark'
  const height = size === 'sm' ? 'h-9' : 'h-10'

  return (
    <span
      title={method.label}
      className={`inline-flex items-center gap-2 ${height} px-3 rounded-md border text-xs font-bold whitespace-nowrap ${
        isDark ? 'bg-white border-white text-[#0B1F3A]' : 'bg-white border-slate-200 text-[#0B1F3A]'
      }`}
    >
      {method.logo ? (
        <img src={method.logo} alt={method.label} className="h-6 w-auto max-w-[72px] object-contain" />
      ) : (
        <>
          <PaymentIcon name={method.icon} className="w-5 h-5 text-[#1D4ED8]" />
          {method.label}
        </>
      )}
    </span>
  )
}

// صف كل طرق الدفع المتاحة
export default function PaymentMethodsRow({ tone = 'light', size = 'md', className = '' }) {
  const { settings, features } = useSiteSettings()
  const methods = getPaymentMethods(settings, features)

  if (!methods.length) return null

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="طرق الدفع المتاحة">
      {methods.map((method) => (
        <li key={method.id}>
          <PaymentBadge method={method} tone={tone} size={size} />
        </li>
      ))}
    </ul>
  )
}
