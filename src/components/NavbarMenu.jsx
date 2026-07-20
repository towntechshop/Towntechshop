import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { getCategoryPath } from '../lib/categoryUrls'
import { NAV_COLORS, PRIMARY_NAV_LINKS } from '../lib/navbarConstants'

function ChevronDownIcon({ className = 'w-4 h-4', open = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function MenuItemLink({ item, isActive, onClick, variant, isOpen = false }) {
  const url = item.url || '/products'
  const isHighlighted = Boolean(item.highlight)
  const hasDropdown = item.hasDropdown
  const isMobile = variant === 'mobile'

  const desktopLinkClass = isActive || isOpen
    ? 'inline-flex items-center gap-1 px-3 py-2 rounded-xl font-black shadow-sm transition whitespace-nowrap'
    : 'inline-flex items-center gap-1 px-3 py-2 rounded-xl font-bold transition whitespace-nowrap'

  const mobileLinkClass = isActive
    ? 'flex items-center justify-between w-full px-4 py-3 rounded-xl font-black shadow-sm transition'
    : 'flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold transition hover:bg-white hover:shadow-sm'

  const linkClass = isMobile ? mobileLinkClass : desktopLinkClass

  const linkStyle =
    isActive || isOpen
      ? {
          backgroundColor: NAV_COLORS.activeBg,
          color: NAV_COLORS.activeText,
        }
      : {
          color: isHighlighted ? NAV_COLORS.highlight : NAV_COLORS.bottomText,
        }

  const hoverClass =
    isMobile || isActive || isOpen
      ? ''
      : isHighlighted
        ? 'hover:bg-orange-50'
        : 'hover:bg-white hover:shadow-sm'

  const content = (
    <>
      <span>{item.label}</span>
      {hasDropdown && (
        <span
          className={
            isMobile
              ? `w-4 h-4 ${isActive || isOpen ? 'text-sky-300' : 'opacity-70'}`
              : `text-xs ${isActive || isOpen ? 'text-sky-300' : 'opacity-70'}`
          }
        >
          {isMobile ? (
            <ChevronDownIcon open={isOpen} className="w-4 h-4" />
          ) : (
            '▾'
          )}
        </span>
      )}
    </>
  )

  if (url.startsWith('/')) {
    return (
      <Link
        to={url}
        onClick={onClick}
        className={`${linkClass} ${hoverClass}`}
        style={linkStyle}
      >
        {content}
      </Link>
    )
  }

  return (
    <a
      href={url}
      onClick={onClick}
      target="_blank"
      rel="noreferrer"
      className={`${linkClass} ${hoverClass}`}
      style={linkStyle}
    >
      {content}
    </a>
  )
}

function DropdownPanel({ item, onClose, variant }) {
  const isMobile = variant === 'mobile'

  if (isMobile) {
    return (
      <div className="mt-1 mr-2 space-y-1 border-r border-slate-200 pr-2 pb-1">
        {item.subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            to={getCategoryPath(
              { slug: item.parentSlug, id: item.categoryId },
              subcategory
            )}
            onClick={onClose}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition"
          >
            {subcategory.name}
          </Link>
        ))}

        <Link
          to={getCategoryPath({ slug: item.parentSlug, id: item.categoryId })}
          onClick={onClose}
          className="block px-4 py-2.5 rounded-xl text-sm font-black text-sky-700 hover:bg-sky-50 transition"
        >
          عرض كل {item.label}
        </Link>
      </div>
    )
  }

  return (
    <div className="absolute top-full right-0 z-50 mt-2 w-[min(92vw,720px)] bg-white rounded-2xl border border-slate-200 shadow-xl p-4 md:p-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-right">
        {item.subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            to={getCategoryPath(
              { slug: item.parentSlug, id: item.categoryId },
              subcategory
            )}
            className="block px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition"
            onClick={onClose}
          >
            {subcategory.name}
          </Link>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-left">
        <Link
          to={getCategoryPath({ slug: item.parentSlug, id: item.categoryId })}
          className="text-sm font-black text-sky-700 hover:text-sky-900"
          onClick={onClose}
        >
          عرض كل {item.label} ←
        </Link>
      </div>
    </div>
  )
}

function NavbarMenuItem({
  item,
  index,
  isOpen,
  isActive,
  onOpen,
  onClose,
  variant,
  onItemClick,
}) {
  const isMobile = variant === 'mobile'
  const hasDropdown = item.hasDropdown

  if (!hasDropdown) {
    return (
      <MenuItemLink
        item={item}
        isActive={isActive}
        onClick={onItemClick}
        variant={variant}
      />
    )
  }

  if (isMobile) {
    return (
      <div className="rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => onOpen(isOpen ? null : index)}
          className={
            isActive || isOpen
              ? 'flex items-center justify-between w-full px-4 py-3 rounded-xl font-black shadow-sm transition'
              : 'flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold transition hover:bg-white hover:shadow-sm'
          }
          style={
            isActive || isOpen
              ? {
                  backgroundColor: NAV_COLORS.activeBg,
                  color: NAV_COLORS.activeText,
                }
              : {
                  color: Boolean(item.highlight)
                    ? NAV_COLORS.highlight
                    : NAV_COLORS.bottomText,
                }
          }
        >
          <span>{item.label}</span>
          <ChevronDownIcon
            className={`w-4 h-4 ${isActive || isOpen ? 'text-sky-300' : 'opacity-70'}`}
            open={isOpen}
          />
        </button>

        {isOpen && (
          <DropdownPanel item={item} onClose={onClose} variant={variant} />
        )}
      </div>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => onOpen(index)}
    >
      <MenuItemLink
        item={item}
        isActive={isActive}
        isOpen={isOpen}
        variant={variant}
      />

      {isOpen && (
        <DropdownPanel item={item} onClose={onClose} variant={variant} />
      )}
    </div>
  )
}

export function PrimaryNavLinks({ variant = 'desktop', onItemClick }) {
  const navLinkClass = ({ isActive }) =>
    isActive
      ? 'text-sky-300 font-black'
      : 'text-white/90 hover:text-sky-300 transition'

  if (variant === 'mobile') {
    return (
      <nav className="flex flex-col gap-1 text-base font-bold">
        {PRIMARY_NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onItemClick}
            className={({ isActive }) =>
              isActive
                ? 'block px-4 py-3 rounded-2xl font-black text-sky-300 bg-white/10 transition'
                : 'block px-4 py-3 rounded-2xl font-bold text-white/90 hover:bg-white/10 transition'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <div className="flex items-center justify-center gap-10 pt-4 text-sm font-semibold">
      {PRIMARY_NAV_LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} className={navLinkClass}>
          {link.label}
        </NavLink>
      ))}
    </div>
  )
}

export default function NavbarMenu({
  items = [],
  variant = 'desktop',
  isMenuItemActive,
  onItemClick,
}) {
  const [openIndex, setOpenIndex] = useState(null)

  if (items.length === 0) return null

  const menuContent = (
    <>
      {items.map((item, index) => (
        <NavbarMenuItem
          key={`${item.label}-${index}`}
          item={item}
          index={index}
          isOpen={openIndex === index}
          isActive={isMenuItemActive?.(item)}
          onOpen={setOpenIndex}
          onClose={() => {
            setOpenIndex(null)
            onItemClick?.()
          }}
          variant={variant}
          onItemClick={onItemClick}
        />
      ))}
    </>
  )

  if (variant === 'mobile') {
    return (
      <div
        className="rounded-2xl border p-3"
        style={{
          backgroundColor: NAV_COLORS.bottomBg,
          borderColor: '#D8E8F6',
        }}
      >
        <nav className="flex flex-col gap-1 text-base font-bold">{menuContent}</nav>
      </div>
    )
  }

  return (
    <div className="relative" onMouseLeave={() => setOpenIndex(null)}>
      <div className="flex items-center justify-center gap-1 min-h-[58px] text-sm flex-wrap">
        {menuContent}
      </div>
    </div>
  )
}
