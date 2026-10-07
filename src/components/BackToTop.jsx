import { useEffect, useState } from 'react'

// زرار الرجوع لأول الصفحة (بيظهر بعد ما تنزل شوية)
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      aria-label="الرجوع لأعلى الصفحة"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-4 bottom-24 md:bottom-6 z-[65] w-11 h-11 rounded-full bg-white border border-slate-200 text-[#0B1F3A] shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-[#0B1F3A] hover:text-white ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 14 6-6 6 6" />
      </svg>
    </button>
  )
}
