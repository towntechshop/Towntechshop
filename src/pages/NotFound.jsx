import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function NotFound() {
  useEffect(() => {
    document.title = 'الصفحة غير موجودة | Town Tech'
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex')
    return () => robots?.remove()
  }, [])

  return (
    <div className="min-h-[70vh] bg-[#F4F7FB] px-4 py-16 flex items-center justify-center" dir="rtl">
      <div className="max-w-lg w-full text-center">
        <p className="text-7xl md:text-8xl font-bold text-[#0B1F3A]/15 leading-none" dir="ltr">404</p>
        <h1 className="mt-4 text-2xl md:text-3xl font-bold text-[#0B1F3A]">الصفحة دي مش موجودة</h1>
        <p className="mt-3 text-slate-500 leading-7">
          ممكن يكون اللينك اتغير أو المنتج اتشال. جرّب تدوّر على اللي محتاجه أو ارجع للرئيسية.
        </p>

        <form action="/products" className="mt-6 flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5">
          <input
            type="search"
            name="search"
            placeholder="ابحث عن منتج..."
            className="flex-1 min-w-0 px-3 py-2.5 outline-none bg-transparent"
          />
          <button type="submit" className="bg-[#0B1F3A] text-white px-5 rounded-lg font-bold">
            بحث
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/" className="bg-[#D7262E] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#bf1f27] transition">
            الصفحة الرئيسية
          </Link>
          <Link to="/products" className="bg-white border border-slate-200 text-[#0B1F3A] px-6 py-3 rounded-xl font-bold hover:border-[#0B1F3A] transition">
            كل المنتجات
          </Link>
        </div>
      </div>
    </div>
  )
}
