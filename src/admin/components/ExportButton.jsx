import { useState } from 'react'

// زرار (تصدير Excel) — بياخد دالة بتجهز البيانات وتنزّل الملف
export default function ExportButton({ onExport, label = 'تصدير Excel' }) {
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    setBusy(true)
    try {
      await onExport()
    } catch (error) {
      window.alert(error?.message || 'تعذر التصدير')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black hover:bg-emerald-700 disabled:opacity-60 transition"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
      </svg>
      {busy ? 'جاري التجهيز...' : label}
    </button>
  )
}
