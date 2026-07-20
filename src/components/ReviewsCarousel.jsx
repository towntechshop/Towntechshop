import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const BRAND_COLORS = {
  primary: '#0B1F3A',
  accent: '#38BDF8',
}

export default function ReviewsCarousel({
  title = 'آراء العملاء',
  subtitle = 'تقييمات حقيقية من عملائنا بعد مراجعتها من الإدارة',
  showWriteButton = true,
}) {
  const sliderRef = useRef(null)

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const getReviews = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(12)

    if (!error) {
      setReviews(data || [])
    } else {
      setReviews([])
    }

    setLoading(false)
  }

  useEffect(() => {
    getReviews()
  }, [])

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return

    const amount = direction === 'next' ? 340 : -340

    sliderRef.current.scrollBy({
      left: amount,
      behavior: 'smooth',
    })
  }

  const renderStars = (rating) => {
    const safeRating = Number(rating || 0)

    return (
      <div className="flex items-center gap-1 text-yellow-400 text-lg">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>{star <= safeRating ? '★' : '☆'}</span>
        ))}
      </div>
    )
  }

  return (
    <section className="px-4 py-12" dir="rtl">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              {title}
            </h2>

            <p className="text-slate-500 mt-2">
              {subtitle}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollSlider('prev')}
              className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black hover:bg-slate-50 transition"
            >
              →
            </button>

            <button
              type="button"
              onClick={() => scrollSlider('next')}
              className="w-11 h-11 rounded-full text-white shadow-sm flex items-center justify-center font-black hover:opacity-90 transition"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              ←
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex-shrink-0 w-[290px] md:w-[340px] bg-white rounded-3xl border border-slate-200 shadow-sm p-5 animate-pulse"
              >
                <div className="h-5 bg-slate-100 rounded w-32 mb-4" />
                <div className="h-4 bg-slate-100 rounded w-24 mb-5" />
                <div className="h-4 bg-slate-100 rounded mb-3" />
                <div className="h-4 bg-slate-100 rounded mb-3" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
            <h3 className="text-2xl font-black text-slate-900">
              لسه مفيش ريفيوهات معتمدة
            </h3>

            <p className="text-slate-500 mt-2">
              أول ريفيو يتم الموافقة عليه من الداشبورد هيظهر هنا.
            </p>
          </div>
        ) : (
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex-shrink-0 snap-start w-[290px] md:w-[340px] bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition p-5"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-black text-slate-900 text-lg">
                    {review.customer_name}
                  </h3>

                  {review.is_featured && (
                    <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-xs font-black">
                      مميز
                    </span>
                  )}
                </div>

                {renderStars(review.rating)}

                <p
                  className="text-slate-700 leading-8 mt-4"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {review.review_text}
                </p>
              </div>
            ))}
          </div>
        )}

        {showWriteButton && (
          <div className="flex justify-center mt-6">
            <Link
              to="/reviews"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-black text-sm hover:opacity-90 transition shadow-sm"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              اكتب رأيك
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}