import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useSiteSettings from '../hooks/useSiteSettings'
import { getCartItems } from '../lib/cart'
import { getCustomerOrders } from '../lib/customerOrders'
import NavbarMenu, { PrimaryNavLinks } from './NavbarMenu'
import useEnrichedNavbarMenuItems from '../hooks/useEnrichedNavbarMenuItems'
import { NAV_COLORS } from '../lib/navbarConstants'

const POPULAR_SEARCHES = [
  'كاميرات المراقبة',
  'DVR',
  'NVR',
  'هاردات',
  'كابلات',
]

const COLORS = {
  topBg: NAV_COLORS.topBg,
  topBgSoft: '#0A2238',
  mobilePanel: NAV_COLORS.mobilePanel,
  mobileItemBg: '#102F4A',
  bottomBg: NAV_COLORS.bottomBg,
  bottomText: NAV_COLORS.bottomText,
  accent: '#38BDF8',
  accentDark: '#0284C7',
  highlight: NAV_COLORS.highlight,
  badge: '#22C55E',
  activeBg: NAV_COLORS.activeBg,
  activeText: NAV_COLORS.activeText,
  white: '#FFFFFF',
}

function CategoryMenuSkeleton() {
  return (
    <div className="flex items-center justify-center gap-3 min-h-[58px] py-2">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="hidden sm:block h-4 rounded-full bg-slate-200/80 animate-pulse"
          style={{ width: `${72 + item * 8}px` }}
        />
      ))}
      <div className="sm:hidden h-4 w-32 rounded-full bg-slate-200/80 animate-pulse" />
    </div>
  )
}

function SearchIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L17 17" />
    </svg>
  )
}

function CartIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h9.9a1 1 0 0 0 1-.8L21 7H7" />
    </svg>
  )
}

function OrdersIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" />
      <path d="M3.3 7.7 12 12.5l8.7-4.8" />
      <path d="M12 22V12.5" />
    </svg>
  )
}

function MenuIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}

function CloseIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  )
}

function UserIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.8-4 5-6 8-6s6.2 2 8 6" />
    </svg>
  )
}

export default function Navbar() {
  const { settings, menuReady } = useSiteSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchTerm, setSearchTerm] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const logoUrl = settings?.logo_url
  const brandName = settings?.brand_name || 'Town Tech'
  const brandSubtitle =
    settings?.brand_subtitle || 'كاميرات ومستلزمات إلكترونية'

  const menuItems = menuReady
    ? settings.navbar_menu_items || []
    : []

  const { enrichedItems } = useEnrichedNavbarMenuItems(menuItems)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const brandAreaWidthDesktop = Number(
    settings?.brand_area_width_desktop || 430
  )

  const logoDesktopWidth = Number(settings?.logo_desktop_width || 75)
  const logoDesktopHeight = Number(settings?.logo_desktop_height || 75)
  const logoMobileWidth = Number(settings?.logo_mobile_width || 42)
  const logoMobileHeight = Number(settings?.logo_mobile_height || 42)

  const brandTextSizeDesktop = Number(
    settings?.brand_text_size_desktop || 28
  )
  const brandTextSizeMobile = Number(settings?.brand_text_size_mobile || 18)

  const brandSubtitleSizeDesktop = Number(
    settings?.brand_subtitle_size_desktop || 13
  )
  const brandSubtitleSizeMobile = Number(
    settings?.brand_subtitle_size_mobile || 10
  )

  const syncCartCount = () => {
    const items = getCartItems()
    const count = items.reduce(
      (total, item) => total + Number(item.quantity || 1),
      0
    )

    setCartCount(count)
  }

  const syncOrdersCount = () => {
    setOrdersCount(getCustomerOrders().length)
  }

  useEffect(() => {
    syncCartCount()
    syncOrdersCount()

    window.addEventListener('storage', syncCartCount)
    window.addEventListener('storage', syncOrdersCount)
    window.addEventListener('focus', syncCartCount)
    window.addEventListener('focus', syncOrdersCount)
    window.addEventListener('cart-updated', syncCartCount)
    window.addEventListener('cartUpdated', syncCartCount)
    window.addEventListener('customer-orders-updated', syncOrdersCount)

    return () => {
      window.removeEventListener('storage', syncCartCount)
      window.removeEventListener('storage', syncOrdersCount)
      window.removeEventListener('focus', syncCartCount)
      window.removeEventListener('focus', syncOrdersCount)
      window.removeEventListener('cart-updated', syncCartCount)
      window.removeEventListener('cartUpdated', syncCartCount)
      window.removeEventListener('customer-orders-updated', syncOrdersCount)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setSearchTerm(params.get('search') || '')
  }, [location.search])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleSearchSubmit = (e) => {
    e.preventDefault()

    const cleanSearch = searchTerm.trim()

    if (!cleanSearch) {
      navigate('/products')
      closeMobileMenu()
      return
    }

    navigate(`/products?search=${encodeURIComponent(cleanSearch)}`)
    closeMobileMenu()
  }

  const isMenuItemActive = (item) => {
    const itemUrl = item?.url || ''

    if (!itemUrl || !itemUrl.startsWith('/')) {
      return false
    }

    try {
      const targetUrl = new URL(itemUrl, window.location.origin)
      const currentUrl = new URL(
        `${location.pathname}${location.search}`,
        window.location.origin
      )

      if (targetUrl.pathname !== currentUrl.pathname) {
        if (targetUrl.pathname.startsWith('/category/')) {
          return (
            currentUrl.pathname === targetUrl.pathname ||
            currentUrl.pathname.startsWith(`${targetUrl.pathname}/`)
          )
        }

        return false
      }

      const targetParams = targetUrl.searchParams
      const currentParams = currentUrl.searchParams

      const hasTargetParams = Array.from(targetParams.keys()).length > 0

      if (!hasTargetParams) {
        return currentUrl.search === ''
      }

      for (const [key, value] of targetParams.entries()) {
        if (currentParams.get(key) !== value) {
          return false
        }
      }

      return true
    } catch {
      return false
    }
  }

  return (
    <header className="sticky top-0 z-50 shadow-md" dir="rtl">
      <div
        className="hidden md:block text-white border-b border-white/10"
        style={{ backgroundColor: COLORS.topBg }}
      >
        <div className="max-w-[1500px] mx-auto px-6 py-4">
          <div
            className="grid items-center gap-6"
            style={{
              gridTemplateColumns: `${brandAreaWidthDesktop}px minmax(420px, 1fr) 360px`,
            }}
          >
            <Link
              to="/"
              className="flex items-center gap-4 min-w-0 overflow-visible"
              style={{ width: `${brandAreaWidthDesktop}px` }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="object-contain flex-shrink-0 bg-white rounded-xl p-1"
                  style={{
                    width: `${logoDesktopWidth}px`,
                    height: `${logoDesktopHeight}px`,
                  }}
                />
              ) : (
                <div
                  className="rounded-xl bg-white flex items-center justify-center font-black flex-shrink-0"
                  style={{
                    width: `${logoDesktopWidth}px`,
                    height: `${logoDesktopHeight}px`,
                    color: COLORS.topBg,
                    fontSize: `${Math.max(18, logoDesktopHeight / 2)}px`,
                  }}
                >
                  {brandName?.charAt(0) || 'S'}
                </div>
              )}

              <div className="text-right leading-tight flex-1 min-w-0 overflow-visible">
                <div
                  className="font-black whitespace-nowrap overflow-visible"
                  style={{
                    fontSize: `${brandTextSizeDesktop}px`,
                    lineHeight: '1.05',
                  }}
                >
                  {brandName}
                </div>

                <div
                  className="text-white/75 whitespace-nowrap overflow-visible mt-1"
                  style={{
                    fontSize: `${brandSubtitleSizeDesktop}px`,
                  }}
                >
                  {brandSubtitle}
                </div>
              </div>
            </Link>

            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <div className="flex items-center bg-white rounded-full overflow-hidden shadow-sm ring-1 ring-white/10">
                <button
                  type="submit"
                  className="h-14 w-20 text-white flex items-center justify-center transition"
                  style={{ backgroundColor: COLORS.accent }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.accentDark
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.accent
                  }}
                >
                  <SearchIcon className="w-8 h-8" />
                </button>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  placeholder="ابحث عن كاميرات، أجهزة تسجيل، إكسسوارات..."
                  className="flex-1 h-14 px-5 text-slate-800 outline-none bg-white text-right"
                />
              </div>

              {searchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 text-right z-50">
                  <p className="text-xs font-black text-slate-500 mb-2">الأكثر بحثاً</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onMouseDown={() => {
                          navigate(`/products?search=${encodeURIComponent(term)}`)
                          setSearchFocused(false)
                        }}
                        className="text-xs font-bold bg-slate-100 hover:bg-sky-50 text-slate-700 px-3 py-1.5 rounded-full transition"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>

            <div className="flex items-center justify-start gap-5 text-sm">
              <Link
                to="/contact"
                className="flex items-center gap-3 border-l border-white/15 pl-5 hover:text-sky-300 transition"
              >
                <UserIcon className="w-5 h-5" />
                <div className="text-right leading-tight">
                  <div className="text-white/60 text-xs">الدعم والمساعدة</div>
                  <div className="font-bold">تواصل معنا</div>
                </div>
              </Link>

              <Link
                to="/my-orders"
                className="relative flex items-center gap-3 border-l border-white/15 pl-5 hover:text-sky-300 transition"
                title="طلباتي"
              >
                <div className="relative">
                  <OrdersIcon className="w-8 h-8" />

                  {ordersCount > 0 && (
                    <span
                      className="absolute -top-2 -right-3 min-w-[22px] h-[22px] px-1 rounded-full text-white text-xs font-black flex items-center justify-center"
                      style={{ backgroundColor: COLORS.accent }}
                    >
                      {ordersCount}
                    </span>
                  )}
                </div>

                <div className="text-right leading-tight">
                  <div className="text-white/60 text-xs">طلباتك</div>
                  <div className="font-bold">طلباتي</div>
                </div>
              </Link>

              <Link
                to="/cart"
                className="relative flex items-center gap-3 hover:text-sky-300 transition"
              >
                <div className="relative">
                  <CartIcon className="w-8 h-8" />

                  <span
                    className="absolute -top-2 -right-3 min-w-[22px] h-[22px] px-1 rounded-full text-white text-xs font-black flex items-center justify-center"
                    style={{ backgroundColor: COLORS.badge }}
                  >
                    {cartCount}
                  </span>
                </div>

                <div className="text-right leading-tight">
                  <div className="text-white/60 text-xs">عربة التسوق</div>
                  <div className="font-bold">عرض السلة</div>
                </div>
              </Link>
            </div>
          </div>

          <PrimaryNavLinks variant="desktop" />
        </div>
      </div>

      <div
        className="hidden md:block border-b"
        style={{
          backgroundColor: COLORS.bottomBg,
          borderColor: '#D8E8F6',
        }}
      >
        <div className="max-w-[1500px] mx-auto px-6">
          {menuReady ? (
            <NavbarMenu
              items={enrichedItems}
              variant="desktop"
              isMenuItemActive={isMenuItemActive}
            />
          ) : (
            <CategoryMenuSkeleton />
          )}
        </div>
      </div>

      <div
        className="md:hidden text-white"
        style={{ backgroundColor: COLORS.topBg }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="w-11 h-11 rounded-xl border border-white/30 flex items-center justify-center hover:bg-white/10 transition flex-shrink-0"
            >
              {mobileMenuOpen ? (
                <CloseIcon className="w-7 h-7" />
              ) : (
                <MenuIcon className="w-7 h-7" />
              )}
            </button>

            <Link to="/" className="flex items-center gap-2 min-w-0 overflow-visible">
              <div className="text-right leading-tight min-w-0 overflow-visible">
                <div
                  className="font-black whitespace-nowrap overflow-visible"
                  style={{
                    fontSize: `${brandTextSizeMobile}px`,
                    lineHeight: '1.05',
                  }}
                >
                  {brandName}
                </div>

                <div
                  className="text-white/70 whitespace-nowrap overflow-visible mt-0.5"
                  style={{
                    fontSize: `${brandSubtitleSizeMobile}px`,
                  }}
                >
                  {brandSubtitle}
                </div>
              </div>

              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="object-contain flex-shrink-0 bg-white rounded-lg p-0.5"
                  style={{
                    width: `${logoMobileWidth}px`,
                    height: `${logoMobileHeight}px`,
                  }}
                />
              ) : (
                <div
                  className="rounded-lg bg-white flex items-center justify-center font-black flex-shrink-0"
                  style={{
                    width: `${logoMobileWidth}px`,
                    height: `${logoMobileHeight}px`,
                    color: COLORS.topBg,
                    fontSize: `${Math.max(14, logoMobileHeight / 2)}px`,
                  }}
                >
                  {brandName?.charAt(0) || 'S'}
                </div>
              )}
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to="/my-orders"
                className="relative hover:text-sky-300 transition"
                title="طلباتي"
              >
                <OrdersIcon className="w-7 h-7" />

                {ordersCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full text-white text-[11px] font-black flex items-center justify-center"
                    style={{ backgroundColor: COLORS.accent }}
                  >
                    {ordersCount}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="relative hover:text-sky-300 transition">
                <CartIcon className="w-7 h-7" />

                <span
                  className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full text-white text-[11px] font-black flex items-center justify-center"
                  style={{ backgroundColor: COLORS.badge }}
                >
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            className="fixed left-0 right-0 bottom-0 z-40 overflow-y-auto"
            style={{
              top: '68px',
              backgroundColor: COLORS.mobilePanel,
            }}
          >
            <div className="px-5 py-6 min-h-full space-y-4">
              <form onSubmit={handleSearchSubmit}>
                <div className="flex items-center bg-white rounded-full overflow-hidden">
                  <button
                    type="submit"
                    className="h-12 w-14 text-white flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: COLORS.accent }}
                  >
                    <SearchIcon className="w-6 h-6" />
                  </button>

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث عن منتج..."
                    className="flex-1 h-12 px-4 text-slate-800 outline-none text-right font-bold"
                  />
                </div>
              </form>

              <PrimaryNavLinks
                variant="mobile"
                onItemClick={closeMobileMenu}
              />

              {menuReady ? (
                <NavbarMenu
                  items={enrichedItems}
                  variant="mobile"
                  isMenuItemActive={isMenuItemActive}
                  onItemClick={closeMobileMenu}
                />
              ) : (
                <CategoryMenuSkeleton />
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}