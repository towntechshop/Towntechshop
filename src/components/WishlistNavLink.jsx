import { Link } from 'react-router-dom'
import useSavedList from '../hooks/useSavedList'

export default function WishlistNavLink({ variant = 'desktop' }) {
  const items = useSavedList('wishlist')
  const isDesktop = variant === 'desktop'

  return (
    <Link
      to="/wishlist"
      title="المفضلة"
      aria-label={`المفضلة (${items.length})`}
      className={`relative flex items-center gap-3 hover:text-sky-300 transition ${
        isDesktop ? 'border-l border-white/15 pl-5' : ''
      }`}
    >
      <span className="relative">
        <svg viewBox="0 0 24 24" className={isDesktop ? 'w-7 h-7' : 'w-6 h-6'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
        </svg>
        {items.length > 0 && (
          <span
            key={`wish-${items.length}`}
            className="badge-pop absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D7262E] text-white text-[10px] font-black flex items-center justify-center"
          >
            {items.length}
          </span>
        )}
      </span>
      {isDesktop && (
        <span className="text-right leading-tight">
          <span className="block text-white/60 text-xs">منتجاتك</span>
          <span className="block font-bold">المفضلة</span>
        </span>
      )}
    </Link>
  )
}
