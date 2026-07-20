import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useSiteSettings from '../hooks/useSiteSettings'
import {
  STORE_BRANCHES,
  STORE_EMAIL,
  STORE_FACEBOOK_URL,
  STORE_PHONES,
  toTelHref,
  toWhatsAppHref,
} from '../lib/siteContent'

const SOCIAL_LINKS = [
  {
    id: 'facebook',
    label: 'Facebook',
    href: STORE_FACEBOOK_URL,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
]

const POPULAR_SEARCHES = [
  'كاميرات المراقبة',
  'DVR',
  'NVR',
  'هاردات',
  'كابلات',
  'أجهزة تسجيل',
]

const INTEREST_LINKS = [
  { label: 'طلباتي', to: '/my-orders' },
  { label: 'من نحن', to: '/about' },
  { label: 'أعمالنا', to: '/our-work' },
  { label: 'تواصل معنا', to: '/contact' },
  { label: 'سياسة الشحن', to: '/shipping-policy' },
  { label: 'سياسة الاستبدال والاسترجاع', to: '/return-policy' },
]

const linkClass =
  'block text-sm md:text-[15px] text-white/70 hover:text-white font-bold transition'

function FooterLinkList({ title, children }) {
  return (
    <div className="text-right">
      <h4 className="font-black text-base md:text-lg mb-4 text-white">{title}</h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function FooterTextLink({ to, children }) {
  return (
    <Link to={to} className={linkClass}>
      {children}
    </Link>
  )
}

function FooterAccordionItem({ id, title, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-white/15">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between gap-4 py-4 text-right"
        aria-expanded={isOpen}
      >
        <span className="font-black text-[15px] text-white">{title}</span>
        <span
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-white/90 text-xl leading-none font-light"
          aria-hidden="true"
        >
          {isOpen ? '−' : '+'}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[800px] opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-2.5 text-right">{children}</div>
      </div>
    </div>
  )
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

export default function Footer() {
  const { settings } = useSiteSettings()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [openSections, setOpenSections] = useState({})

  const shopLinks = useMemo(
    () =>
      (settings.navbar_menu_items || [])
        .filter((item) => item?.label && item?.url)
        .map((item) => ({
          label: item.label,
          url: item.url,
        })),
    [settings.navbar_menu_items]
  )

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleNewsletterSubmit = (event) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  const contactEmail = settings.email || STORE_EMAIL
  const whatsappNumber = settings.whatsapp || '201112826999'

  const popularSearchLinks = POPULAR_SEARCHES.map((term) => (
    <Link
      key={term}
      to={`/products?search=${encodeURIComponent(term)}`}
      className={linkClass}
    >
      {term}
    </Link>
  ))

  const interestLinks = INTEREST_LINKS.map((link) => (
    <FooterTextLink key={link.to} to={link.to}>
      {link.label}
    </FooterTextLink>
  ))

  const shopLinksContent = (
    <>
      <FooterTextLink to="/products">كل المنتجات</FooterTextLink>
      {shopLinks.map((item) =>
        item.url.startsWith('/') ? (
          <Link key={`${item.label}-${item.url}`} to={item.url} className={linkClass}>
            {item.label}
          </Link>
        ) : (
          <a
            key={`${item.label}-${item.url}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            {item.label}
          </a>
        )
      )}
    </>
  )

  const aboutStoreContent = (
    <div className="space-y-3.5">
      {settings.address ? (
        <div className="flex items-start gap-3 text-white/70">
          <LocationIcon />
          <p className="text-sm font-bold leading-7 whitespace-pre-line">{settings.address}</p>
        </div>
      ) : (
        STORE_BRANCHES.map((branch) => (
          <div key={branch.label} className="flex items-start gap-3 text-white/70">
            <LocationIcon />
            <div>
              <p className="text-sm font-black text-white/85">{branch.label}</p>
              <p className="text-sm font-bold leading-7">{branch.address}</p>
            </div>
          </div>
        ))
      )}

      {STORE_PHONES.map((phone) => (
        <a
          key={phone}
          href={toTelHref(phone)}
          className="flex items-center gap-3 text-white/70 hover:text-white transition font-bold text-sm"
        >
          <PhoneIcon />
          <span dir="ltr">{phone}</span>
        </a>
      ))}

      <a href={`mailto:${contactEmail}`} className={`${linkClass} !inline-block`}>
        {contactEmail}
      </a>

      <a
        href={toWhatsAppHref(whatsappNumber)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-black text-sm transition"
      >
        واتساب
      </a>
    </div>
  )

  return (
    <footer className="bg-[#07111F] text-white" dir="rtl">
      <div className="border-b border-white/10">
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-8 md:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center md:text-right lg:max-w-md">
              <h4 className="text-xl md:text-2xl font-black mb-2">النشرة البريدية</h4>
              <p className="text-white/70 font-bold text-sm md:text-base leading-7">
                اشترك في نشرتنا البريدية لتصلك كل عروضنا
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="w-full lg:max-w-xl flex flex-col gap-3 md:flex-row md:items-center md:gap-2 md:bg-white md:rounded-full md:p-1.5 md:shadow-sm"
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="بريدك الإلكتروني"
                className="w-full h-12 px-4 rounded-xl md:rounded-full bg-white text-slate-900 outline-none text-right font-bold placeholder:text-slate-400 md:bg-transparent"
              />
              <button
                type="submit"
                className="w-full md:w-auto flex-shrink-0 h-12 px-8 rounded-full bg-[#1E6BB8] md:bg-[#FACC15] text-white md:text-slate-900 font-black hover:opacity-90 md:hover:bg-[#FDE047] transition text-sm md:text-base"
              >
                {subscribed ? 'تم ✓' : 'إشترك'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-2 md:py-12">
        <div className="md:hidden">
          <FooterAccordionItem
            id="popular"
            title="الأكثر بحثاً"
            isOpen={Boolean(openSections.popular)}
            onToggle={toggleSection}
          >
            {popularSearchLinks}
          </FooterAccordionItem>

          <FooterAccordionItem
            id="interest"
            title="روابط قد تهمك"
            isOpen={Boolean(openSections.interest)}
            onToggle={toggleSection}
          >
            {interestLinks}
          </FooterAccordionItem>

          <FooterAccordionItem
            id="shop"
            title="تسوق معنا"
            isOpen={Boolean(openSections.shop)}
            onToggle={toggleSection}
          >
            {shopLinksContent}
          </FooterAccordionItem>

          <FooterAccordionItem
            id="about"
            title="عن متجرنا"
            isOpen={Boolean(openSections.about)}
            onToggle={toggleSection}
          >
            {aboutStoreContent}
          </FooterAccordionItem>
        </div>

        <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-8 md:gap-10">
          <FooterLinkList title="الأكثر بحثاً">{popularSearchLinks}</FooterLinkList>
          <FooterLinkList title="روابط قد تهمك">{interestLinks}</FooterLinkList>
          <FooterLinkList title="تسوق معنا">{shopLinksContent}</FooterLinkList>

          <div className="text-right">
            <h4 className="font-black text-base md:text-lg mb-4 text-white">عن متجرنا</h4>
            {aboutStoreContent}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-8 md:py-7">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-6">
            {SOCIAL_LINKS.length > 0 && (
              <div className="text-right md:text-center">
                <p className="text-sm font-black text-white/80 mb-3">انضم لمتابعينا</p>
                <div className="flex items-center gap-3 justify-start md:justify-center">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.id}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="text-right">
              <p className="text-sm md:text-base font-black text-white/90">
                © {new Date().getFullYear()} {settings.brand_name}
              </p>
              <p className="text-xs md:text-sm text-white/50 font-bold mt-1 leading-6">
                جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
