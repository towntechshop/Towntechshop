import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAdminNotifications, {
  getNotificationCount,
} from '../hooks/useAdminNotifications'

const menuItems = [
  { label: 'لوحة التحكم', path: '/admin', end: true },
  { label: 'الطلبات', path: '/admin/orders', notificationKey: 'orders' },
  {
    label: 'رسائل التواصل',
    path: '/admin/contact-messages',
    notificationKey: 'messages',
  },
  { label: 'التقييمات', path: '/admin/reviews', notificationKey: 'reviews' },
  { label: 'المنتجات', path: '/admin/products' },
  { label: 'إضافة منتج', path: '/admin/products/add' },
  { label: 'الأقسام', path: '/admin/categories' },
  { label: 'الكوبونات', path: '/admin/coupons' },
  { label: 'العملاء', path: '/admin/customers' },
  { label: 'التقارير', path: '/admin/reports' },
  { label: 'إعدادات الشحن', path: '/admin/shipping-settings' },
  { label: 'إعدادات الموقع', path: '/admin/site-settings' },
  { label: 'الصفحات والسياسات', path: '/admin/pages' },
]

const pageTitles = [
  { match: '/admin/orders', title: 'الطلبات' },
  { match: '/admin/contact-messages', title: 'رسائل التواصل' },
  { match: '/admin/reviews', title: 'التقييمات' },
  { match: '/admin/products/add', title: 'إضافة منتج' },
  { match: '/admin/products/edit', title: 'تعديل منتج' },
  { match: '/admin/products', title: 'المنتجات' },
  { match: '/admin/categories', title: 'الأقسام' },
  { match: '/admin/coupons', title: 'الكوبونات' },
  { match: '/admin/customers', title: 'العملاء' },
  { match: '/admin/reports', title: 'التقارير' },
  { match: '/admin/shipping-settings', title: 'إعدادات الشحن' },
  { match: '/admin/site-settings', title: 'إعدادات الموقع' },
  { match: '/admin/pages', title: 'الصفحات والسياسات' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const notificationCounts = useAdminNotifications()

  const totalNotifications =
    notificationCounts.orders +
    notificationCounts.reviews +
    notificationCounts.messages

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const currentPageTitle =
    pageTitles.find((item) => location.pathname.startsWith(item.match))?.title ||
    'لوحة التحكم'

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const linkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center justify-between gap-3 bg-white text-slate-950 px-5 py-3 rounded-2xl font-black shadow-sm'
      : 'flex items-center justify-between gap-3 text-white/85 hover:text-white hover:bg-white/10 px-5 py-3 rounded-2xl font-black transition'

  const renderNotificationBadge = (count, isActive = false) => {
    if (!count || count <= 0) return null

    const label = count > 99 ? '99+' : count

    return (
      <span
        className={`min-w-[24px] h-6 px-2 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
          isActive
            ? 'bg-red-500 text-white'
            : 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.45)]'
        }`}
        aria-label={`${label} إشعار جديد`}
      >
        {label}
      </span>
    )
  }

  const renderMenu = () => (
    <nav className="space-y-2">
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          onClick={closeMobileMenu}
          className={linkClass}
        >
          {({ isActive }) => (
            <>
              <span>{item.label}</span>
              {renderNotificationBadge(
                getNotificationCount(notificationCounts, item.notificationKey),
                isActive
              )}
            </>
          )}
        </NavLink>
      ))}

      <div className="pt-5 mt-5 border-t border-white/10 space-y-2">
      <a
  href="/"
  target="_blank"
  rel="noreferrer"
  className="group relative overflow-hidden flex items-center justify-center gap-3 rounded-2xl px-5 py-4 font-black text-white border border-sky-400/30 bg-gradient-to-l from-sky-500/20 via-slate-800 to-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.18)] hover:shadow-[0_0_35px_rgba(56,189,248,0.35)] transition-all duration-300"
>
  <span className="absolute inset-0 bg-gradient-to-l from-sky-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

  <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300 border border-sky-300/20">
    ↗
  </span>

  <span className="relative">
    عرض الموقع
  </span>
</a>

        <button
          type="button"
          onClick={logout}
          className="w-full text-right text-white/85 hover:text-white hover:bg-red-500/15 px-5 py-3 rounded-2xl font-black transition"
        >
          تسجيل الخروج
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed right-0 top-0 h-screen w-72 bg-[#07111F] text-white p-6 flex-col overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black leading-none">
            Town Tech
          </h1>

          <p className="text-white/45 mt-3 text-sm font-bold">
            لوحة إدارة الموقع
          </p>
        </div>

        <div className="flex-1">
          {renderMenu()}
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#07111F] text-white border-b border-white/10">
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="relative w-11 h-11 rounded-2xl border border-white/15 flex items-center justify-center text-2xl font-black"
          >
            ☰
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {totalNotifications > 99 ? '99+' : totalNotifications}
              </span>
            )}
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="w-11 h-11 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-black"
          >
            ↗
          </a>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9999]">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/55"
          />

          <aside className="absolute right-0 top-0 h-full w-[86%] max-w-[340px] bg-[#07111F] text-white p-5 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-7">
              <div>
                <h2 className="text-3xl font-black">
            Town Tech
                </h2>

                <p className="text-white/45 mt-2 text-sm font-bold">
                  لوحة إدارة الموقع
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-11 h-11 rounded-2xl border border-white/15 flex items-center justify-center text-2xl"
              >
                ×
              </button>
            </div>

            {renderMenu()}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:mr-72 min-h-screen">
        <div className="p-4 sm:p-5 md:p-7 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="hidden lg:block mb-6">
              <h2 className="text-3xl md:text-4xl font-black text-slate-950">
                {currentPageTitle}
              </h2>

              <p className="text-slate-500 mt-2 font-bold">
                إدارة متجر Town Tech
              </p>
            </div>

            <div className="admin-page-wrap">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}