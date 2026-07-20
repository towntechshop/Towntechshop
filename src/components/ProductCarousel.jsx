import { useRef, useState, useEffect, Children } from 'react'

function CarouselArrow({ direction, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-700 font-black hover:bg-slate-50 hover:border-sky-300 transition disabled:opacity-35 disabled:pointer-events-none"
      style={direction === 'prev' ? { right: '-6px' } : { left: '-6px' }}
      aria-label={direction === 'prev' ? 'السابق' : 'التالي'}
    >
      {direction === 'prev' ? '→' : '←'}
    </button>
  )
}

export default function ProductCarousel({ children, className = '' }) {
  const scrollRef = useRef(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const itemCount = Children.count(children)

  const updateScrollState = () => {
    const container = scrollRef.current
    if (!container) return

    const maxScroll = container.scrollWidth - container.clientWidth
    const current = Math.abs(container.scrollLeft)

    setCanScrollPrev(current > 8)
    setCanScrollNext(maxScroll - current > 8)
  }

  useEffect(() => {
    updateScrollState()
    const container = scrollRef.current
    if (!container) return undefined

    container.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      resizeObserver.disconnect()
    }
  }, [children])

  const scroll = (direction) => {
    const container = scrollRef.current
    if (!container) return

    const amount = Math.max(container.clientWidth * 0.78, 300)
    container.scrollBy({
      left: direction === 'next' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  const showArrows = itemCount > 1

  return (
    <div className={`relative md:px-2 ${className}`}>
      {showArrows && (
        <CarouselArrow
          direction="prev"
          onClick={() => scroll('prev')}
          disabled={!canScrollPrev}
        />
      )}
      {showArrows && (
        <CarouselArrow
          direction="next"
          onClick={() => scroll('next')}
          disabled={!canScrollNext}
        />
      )}

      <div
        ref={scrollRef}
        dir="rtl"
        className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:cursor-grab md:active:cursor-grabbing"
      >
        {children}
      </div>
    </div>
  )
}
