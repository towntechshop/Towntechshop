import { useEffect, useState } from 'react'
import ImageLightbox from './ImageLightbox'

const AUTO_PLAY_MS = 3800

function getOffset(index, activeIndex, total) {
  let diff = index - activeIndex
  const half = Math.floor(total / 2)

  if (diff > half) diff -= total
  if (diff < -half) diff += total

  return diff
}

function CarouselArrow({ direction, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'الصورة السابقة' : 'الصورة التالية'}
      className={`w-11 h-11 md:w-12 md:h-12 rounded-full bg-white border border-slate-200 text-[#0B1F3A] font-black text-lg shadow-md hover:bg-slate-50 transition ${className}`}
    >
      {direction === 'prev' ? '→' : '←'}
    </button>
  )
}

function getSlideSize(viewportWidth, variant) {
  if (variant === 'page') {
    if (viewportWidth >= 1280) {
      return {
        width: 300,
        height: 520,
        spacing: 198,
        stageHeight: 560,
        mode: 'page-gallery',
      }
    }

    if (viewportWidth >= 1024) {
      return {
        width: 280,
        height: 480,
        spacing: 182,
        stageHeight: 520,
        mode: 'page-gallery',
      }
    }

    if (viewportWidth >= 768) {
      return {
        width: 250,
        height: 430,
        spacing: 165,
        stageHeight: 470,
        mode: 'page-gallery',
      }
    }

    if (viewportWidth >= 640) {
      return {
        width: 220,
        height: 390,
        spacing: 118,
        stageHeight: 430,
        mode: 'page-gallery',
      }
    }

    if (viewportWidth >= 400) {
      return {
        width: 200,
        height: 355,
        spacing: 104,
        stageHeight: 395,
        mode: 'page-gallery',
      }
    }

    return {
      width: 185,
      height: 330,
      spacing: 96,
      stageHeight: 370,
      mode: 'page-gallery',
    }
  }

  if (viewportWidth >= 1280) {
    return { width: 600, height: 470, spacing: 235, stageHeight: 520, mode: 'cover' }
  }

  if (viewportWidth >= 1024) {
    return { width: 530, height: 415, spacing: 205, stageHeight: 460, mode: 'cover' }
  }

  if (viewportWidth >= 768) {
    return { width: 500, height: 390, spacing: 195, stageHeight: 440, mode: 'cover' }
  }

  if (viewportWidth >= 640) {
    return { width: 420, height: 340, spacing: 175, stageHeight: 400, mode: 'cover' }
  }

  return { width: 320, height: 260, spacing: 145, stageHeight: 320, mode: 'cover' }
}

function getSlideMetrics(offset, slideSize) {
  const isActive = offset === 0
  const absOffset = Math.abs(offset)

  if (slideSize.mode === 'page-gallery') {
    return {
      translateX: offset * slideSize.spacing,
      scale: isActive ? 1 : absOffset === 1 ? 0.88 : 0.76,
      rotateY: 0,
      translateZ: isActive ? 40 : -absOffset * 70,
      opacity: isActive ? 1 : absOffset === 1 ? 0.92 : 0.68,
      blur: isActive ? 0 : absOffset === 1 ? 2 : 4.5,
    }
  }

  return {
    translateX: offset * slideSize.spacing,
    scale: isActive ? 1 : 0.86 - absOffset * 0.06,
    rotateY: offset * -20,
    translateZ: isActive ? 100 : -absOffset * 120,
    opacity: isActive ? 1 : Math.max(0.45, 0.82 - absOffset * 0.18),
    blur: isActive ? 0 : absOffset * 1.5,
  }
}

export default function OurWorkCarousel({
  images = [],
  variant = 'home',
  autoPlay = true,
  showHint = true,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [slideSize, setSlideSize] = useState(getSlideSize(1024, variant))
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const hasMultiple = images.length > 1
  const isPageGallery = slideSize.mode === 'page-gallery'

  useEffect(() => {
    const updateSlideSize = () => {
      setSlideSize(getSlideSize(window.innerWidth, variant))
    }

    updateSlideSize()
    window.addEventListener('resize', updateSlideSize)
    return () => window.removeEventListener('resize', updateSlideSize)
  }, [variant])

  useEffect(() => {
    setActiveIndex(0)
  }, [images.length])

  useEffect(() => {
    if (!autoPlay || !hasMultiple || isPaused || lightboxIndex !== null) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length)
    }, AUTO_PLAY_MS)

    return () => window.clearInterval(timer)
  }, [autoPlay, hasMultiple, isPaused, images.length, lightboxIndex])

  const goTo = (index) => {
    if (index < 0) {
      setActiveIndex(images.length - 1)
      return
    }

    if (index >= images.length) {
      setActiveIndex(0)
      return
    }

    setActiveIndex(index)
  }

  const openLightbox = (index) => {
    setIsPaused(true)
    setLightboxIndex(index)
  }

  if (images.length === 0) return null

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          className="relative mx-auto flex items-center justify-center overflow-hidden"
          style={{
            height: slideSize.stageHeight,
            perspective: isPageGallery ? '1200px' : '1600px',
            transformStyle: 'preserve-3d',
          }}
        >
          {images.map((item, index) => {
            const offset = getOffset(index, activeIndex, images.length)

            if (Math.abs(offset) > 2) return null

            const isActive = offset === 0
            const absOffset = Math.abs(offset)
            const metrics = getSlideMetrics(offset, slideSize)

            return (
              <div
                key={item.id}
                className="absolute left-1/2 top-1/2 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
                style={{
                  transform: `translate(-50%, -50%) translateX(${metrics.translateX}px) translateZ(${metrics.translateZ}px) scale(${metrics.scale}) rotateY(${metrics.rotateY}deg)`,
                  zIndex: 30 - absOffset,
                  opacity: metrics.opacity,
                  filter: metrics.blur ? `blur(${metrics.blur}px)` : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => openLightbox(index)}
                  className={`flex items-center justify-center overflow-hidden shadow-[0_20px_50px_rgba(11,31,58,0.15)] border bg-white cursor-zoom-in focus:outline-none focus:ring-4 focus:ring-sky-300/50 ${
                    isPageGallery
                      ? 'rounded-[22px] border-slate-100'
                      : 'rounded-2xl md:rounded-[28px] border-white/80'
                  }`}
                  style={{
                    width: slideSize.width,
                    height: slideSize.height,
                  }}
                  aria-label={`عرض ${item.title || 'الصورة'} بالحجم الكامل`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title || 'عمل'}
                    className={
                      isPageGallery
                        ? 'w-full h-full object-contain p-1'
                        : 'object-cover'
                    }
                    style={
                      isPageGallery
                        ? undefined
                        : {
                            width: slideSize.width,
                            height: slideSize.height,
                          }
                    }
                    loading={isActive ? 'eager' : 'lazy'}
                  />
                </button>
              </div>
            )
          })}
        </div>

        {hasMultiple && (
          <>
            <div
              className={`absolute inset-y-0 flex items-center z-40 ${
                isPageGallery
                  ? 'right-[6%] sm:right-[10%] md:right-[14%]'
                  : 'right-0 pr-1 md:pr-4'
              }`}
            >
              <CarouselArrow
                direction="prev"
                onClick={() => goTo(activeIndex - 1)}
              />
            </div>

            <div
              className={`absolute inset-y-0 flex items-center z-40 ${
                isPageGallery
                  ? 'left-[6%] sm:left-[10%] md:left-[14%]'
                  : 'left-0 pl-1 md:pl-4'
              }`}
            >
              <CarouselArrow
                direction="next"
                onClick={() => goTo(activeIndex + 1)}
              />
            </div>

            <div className="flex items-center justify-center gap-2.5 mt-5">
              {images.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`عرض صورة ${index + 1}`}
                  onClick={() => goTo(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? 'w-8 bg-[#1E6BB8]'
                      : 'w-2.5 bg-sky-200 hover:bg-sky-300'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {showHint && (
          <p className="text-center text-slate-400 font-bold text-xs md:text-sm mt-3">
            اضغط على أي صورة لعرضها بالحجم الكامل
          </p>
        )}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => {
            setLightboxIndex(null)
            setIsPaused(false)
          }}
        />
      )}
    </>
  )
}
