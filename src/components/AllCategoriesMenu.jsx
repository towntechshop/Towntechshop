import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getCategoryPath } from '../lib/categoryUrls'

// زرار (كل الأقسام) في شريط النافبار — بيفتح قائمة بكل الأقسام والأقسام الفرعية
export default function AllCategoriesMenu({ categories = [] }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!open) return undefined

    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div
      ref={containerRef}
      className="relative self-stretch flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-5 font-bold text-sm whitespace-nowrap transition"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        كل الأقسام
      </button>

      {open && (
        <div className="animate-fade absolute top-full right-0 z-50 w-[min(760px,90vw)] bg-white text-slate-800 rounded-b-xl shadow-2xl border border-slate-200 p-5">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500">جاري تحميل الأقسام...</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              {categories.map((parent) => (
                <div key={parent.id} className="min-w-0">
                  <Link
                    to={getCategoryPath(parent)}
                    className="block font-bold text-[#0B1F3A] hover:text-[#1D4ED8] mb-2"
                  >
                    {parent.name}
                  </Link>
                  {(parent.subcategories || []).length > 0 && (
                    <ul className="space-y-1.5">
                      {parent.subcategories.map((subcategory) => (
                        <li key={subcategory.id}>
                          <Link
                            to={getCategoryPath(parent, subcategory)}
                            className="text-sm text-slate-600 hover:text-[#1D4ED8] transition"
                          >
                            {subcategory.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link to="/products" className="text-sm font-bold text-[#1D4ED8] hover:underline">
              تصفح كل المنتجات
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
