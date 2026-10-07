import { Link, useLocation } from 'react-router-dom'
import useSavedList from '../hooks/useSavedList'
import { clearList, COMPARE_MAX } from '../lib/savedLists'

// شريط صغير بيظهر لما فيه منتجات في المقارنة
export default function CompareBar() {
  const items = useSavedList('compare')
  const location = useLocation()

  if (items.length === 0) return null
  if (['/compare', '/checkout', '/payment', '/cart'].some((path) => location.pathname.startsWith(path))) return null

  return (
    <div className="animate-slide-up fixed bottom-20 md:bottom-6 inset-x-0 z-[66] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-[#0B1F3A] text-white rounded-full shadow-2xl pl-2 pr-4 py-2">
        <div className="flex -space-x-2 space-x-reverse">
          {items.slice(0, COMPARE_MAX).map((item) => (
            <span key={item.id} className="w-8 h-8 rounded-full bg-white ring-2 ring-[#0B1F3A] overflow-hidden">
              {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-contain p-0.5" />}
            </span>
          ))}
        </div>
        <span className="text-sm font-bold whitespace-nowrap">{items.length} للمقارنة</span>
        <Link to="/compare" className="bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-full px-4 py-1.5 text-sm font-bold">
          قارن
        </Link>
        <button type="button" onClick={() => clearList('compare')} aria-label="مسح المقارنة" className="w-7 h-7 rounded-full text-white/70 hover:text-white hover:bg-white/10">
          ×
        </button>
      </div>
    </div>
  )
}
