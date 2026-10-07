import { Link, useLocation } from 'react-router-dom'
import useSiteSettings from '../hooks/useSiteSettings'
import { STORE_WHATSAPP } from '../lib/siteContent'

export function getWhatsAppNumber(settings) {
  const raw = String(settings?.whatsapp || settings?.phone || STORE_WHATSAPP || '')
  const digits = raw.replace(/\D/g, '')

  if (!digits) return ''
  if (digits.startsWith('20')) return digits
  if (digits.startsWith('0')) return `20${digits.slice(1)}`

  return digits
}

export function buildWhatsAppUrl(number, message) {
  if (!number) return ''
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${number}${text}`
}

export function WhatsAppIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.04 3C9.4 3 4 8.36 4 14.97c0 2.11.56 4.17 1.62 5.99L4 29l8.25-1.6a12.1 12.1 0 0 0 3.79.6C22.67 28 28 22.64 28 16.03 28 9.42 22.67 3 16.04 3Zm0 22.86c-1.2 0-2.38-.2-3.5-.6l-.25-.09-4.9.95.98-4.73-.16-.26a9.83 9.83 0 0 1-1.5-5.16c0-5.43 4.44-9.85 9.9-9.85 5.45 0 9.87 4.42 9.87 9.85 0 5.44-4.42 9.89-9.87 9.89Zm5.42-7.38c-.3-.15-1.76-.86-2.03-.96-.27-.1-.47-.15-.67.15-.2.29-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.46a8.86 8.86 0 0 1-1.65-2.04c-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.57-.48-.5-.67-.5h-.57c-.2 0-.52.08-.79.37-.27.3-1.03 1-1.03 2.45 0 1.44 1.06 2.84 1.2 3.04.15.2 2.08 3.17 5.04 4.44.7.3 1.25.48 1.68.62.7.22 1.35.19 1.85.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  )
}

const HIDE_FLOATING_ON = ['/checkout', '/payment', '/order-success']

export function FloatingWhatsAppButton() {
  const { settings, features } = useSiteSettings()
  const location = useLocation()

  if (!features.whatsapp_button_enabled) return null
  if (HIDE_FLOATING_ON.some((path) => location.pathname.startsWith(path))) return null

  const number = getWhatsAppNumber(settings)
  if (!number) return null

  // في صفحة المنتج على الموبايل نرفع الزرار فوق شريط الشراء
  const onProductPage = location.pathname.startsWith('/products/')
  const lifted = onProductPage && features.sticky_buy_bar_enabled

  return (
    <a
      href={buildWhatsAppUrl(number, features.whatsapp_default_message)}
      target="_blank"
      rel="noreferrer"
      aria-label={features.whatsapp_button_label || 'واتساب'}
      className={`whatsapp-ring fixed left-4 z-[70] group flex items-center gap-2 bg-[#25D366] text-white rounded-full shadow-lg shadow-emerald-900/20 hover:bg-[#1ebe5b] transition-all p-3.5 md:pl-5 ${
        lifted ? 'bottom-24 md:bottom-6' : 'bottom-5 md:bottom-6'
      }`}
    >
      <WhatsAppIcon className="w-7 h-7" />
      {features.whatsapp_button_label && (
        <span className="hidden md:inline font-black text-sm whitespace-nowrap">
          {features.whatsapp_button_label}
        </span>
      )}
    </a>
  )
}

export function AnnouncementBar() {
  const { features } = useSiteSettings()
  const text = String(features.announcement_text || '').trim()

  if (!features.announcement_enabled || !text) return null

  const link = String(features.announcement_link || '').trim()
  const className =
    'block bg-gradient-to-l from-[#0B1F3A] via-[#123566] to-[#0B1F3A] text-white text-center text-xs sm:text-sm font-black px-4 py-2.5 leading-6'

  if (!link) {
    return <div className={className}>{text}</div>
  }

  if (/^https?:\/\//i.test(link)) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className={`${className} hover:opacity-95`}>
        {text} <span aria-hidden="true">←</span>
      </a>
    )
  }

  return (
    <Link to={link.startsWith('/') ? link : `/${link}`} className={`${className} hover:opacity-95`}>
      {text} <span aria-hidden="true">←</span>
    </Link>
  )
}
