import { useEffect, useState } from 'react'

export default function ImageLightbox({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const current = images[index]

  useEffect(() => {
    setIndex(startIndex)
  }, [startIndex])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'ArrowRight') {
        setIndex((prev) => (prev - 1 + images.length) % images.length)
      }

      if (event.key === 'ArrowLeft') {
        setIndex((prev) => (prev + 1) % images.length)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [images.length, onClose])

  if (!current) return null

  const goPrev = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goNext = () => {
    setIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="عرض الصورة"
    >
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 z-0"
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="إغلاق"
        className="absolute top-3 left-3 md:top-5 md:left-5 z-30 w-11 h-11 rounded-full bg-black/50 text-white text-2xl font-black hover:bg-black/70 transition backdrop-blur-sm"
      >
        ✕
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="الصورة السابقة"
            className="absolute right-2 md:right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/50 text-white text-xl font-black hover:bg-black/70 transition backdrop-blur-sm"
          >
            →
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="الصورة التالية"
            className="absolute left-2 md:left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/50 text-white text-xl font-black hover:bg-black/70 transition backdrop-blur-sm"
          >
            ←
          </button>
        </>
      )}

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <img
          src={current.imageUrl}
          alt={current.title || 'صورة'}
          className="w-[100vw] h-[100dvh] object-contain select-none"
          draggable={false}
        />
      </div>

      {(current.title || current.caption || images.length > 1) && (
        <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-16 pb-5 md:pb-6 text-center">
          {current.title && (
            <p className="text-white font-black text-base md:text-xl">
              {current.title}
            </p>
          )}
          {current.caption && (
            <p className="text-white/75 font-bold text-sm md:text-base mt-1">
              {current.caption}
            </p>
          )}
          {images.length > 1 && (
            <p className="text-white/60 font-bold text-sm mt-2">
              {index + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
