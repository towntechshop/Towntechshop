import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Stars({ rating, className = 'w-4 h-4' }) {
  const value = Math.round(Number(rating || 0))

  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          className={`${className} ${star <= value ? 'text-[#F59E0B]' : 'text-slate-200'}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8L10 1.8Z" />
        </svg>
      ))}
    </div>
  )
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-5 h-5" fill="currentColor" aria-hidden="true">
      <path d="M13 8H7a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3v1a3 3 0 0 1-3 3H6v3h1a6 6 0 0 0 6-6V8Zm15 0h-6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3v1a3 3 0 0 1-3 3h-1v3h1a6 6 0 0 0 6-6V8Z" />
    </svg>
  )
}

const AVATAR_COLORS = [
  'from-[#0B1F3A] to-[#1D4ED8]',
  'from-[#1D4ED8] to-[#38BDF8]',
  'from-[#0F766E] to-[#14B8A6]',
  'from-[#7C3AED] to-[#A78BFA]',
]

function formatReviewDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

function ReviewCard({ review, index }) {
  const name = String(review.customer_name || 'عميل').trim()
  const initial = name.charAt(0).toUpperCase()

  return (
    <article
      dir="rtl"
      className="review-card group relative h-full flex flex-col w-[290px] sm:w-[340px] md:w-[370px] rounded-3xl bg-white border border-slate-200 p-5 md:p-6 transition duration-300 hover:-translate-y-1 hover:border-[#1D4ED8]/30 hover:shadow-[0_24px_44px_-28px_rgba(29,78,216,0.55)]"
    >
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EEF4FF] text-[#1D4ED8] transition duration-300 group-hover:bg-[#1D4ED8] group-hover:text-white group-hover:rotate-12">
          <QuoteIcon />
        </span>
      </div>

      <p
        className="mt-4 text-slate-700 text-[15px] leading-8 flex-1"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {review.review_text}
      </p>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
        <span
          className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br ${
            AVATAR_COLORS[index % AVATAR_COLORS.length]
          } text-white font-bold text-lg`}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#0B1F3A] truncate" dir="auto">
            {name}
          </p>
          <p className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
              <path d="M10 1.5 3.5 4v5.2c0 4 2.8 7.6 6.5 8.8 3.7-1.2 6.5-4.8 6.5-8.8V4L10 1.5Zm-1.1 11.3-3-3 1.2-1.2 1.8 1.8 4.1-4.1 1.2 1.2-5.3 5.3Z" />
            </svg>
            عميل موثّق
            {review.created_at && (
              <span className="text-slate-400 font-normal">· {formatReviewDate(review.created_at)}</span>
            )}
          </p>
        </div>
        {review.is_featured && (
          <span className="flex-shrink-0 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-[11px] font-bold">
            مميز
          </span>
        )}
      </div>
    </article>
  )
}

export default function ReviewsCarousel({
  title = 'آراء العملاء',
  subtitle = 'تقييمات حقيقية من عملائنا بعد مراجعتها من الإدارة',
  showWriteButton = true,
}) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (!active) return
        setReviews(error ? [] : data || [])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const average = useMemo(() => {
    const rated = reviews.filter((review) => Number(review.rating) > 0)
    if (!rated.length) return 0
    return rated.reduce((sum, review) => sum + Number(review.rating), 0) / rated.length
  }, [reviews])

  // شريط بيتحرك لوحده لو فيه 3 آراء أو أكتر (بيقف لما تقف عليه بالماوس)
  const animate = reviews.length >= 3
  const duration = Math.max(reviews.length * 7, 28)

  return (
    <section className="py-10 md:py-14" dir="rtl">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-7">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4FF] text-[#1D4ED8] px-3 py-1 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
              قالوا عننا
            </span>
            <h2 className="mt-3 text-[28px] md:text-4xl font-bold text-[#0B1F3A]">{title}</h2>
            <p className="text-slate-500 mt-1.5 text-sm md:text-base">{subtitle}</p>
          </div>

          {reviews.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
                <span className="text-3xl font-bold text-[#0B1F3A] leading-none" dir="ltr">
                  {average.toFixed(1)}
                </span>
                <span>
                  <Stars rating={average} />
                  <span className="block mt-1 text-xs text-slate-500">من {reviews.length} تقييم</span>
                </span>
              </div>

              {showWriteButton && (
                <Link
                  to="/reviews"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F3A] text-white px-5 py-3.5 text-sm font-bold transition hover:bg-[#1D4ED8]"
                >
                  اكتب رأيك
                  <span aria-hidden="true">✎</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="max-w-[1500px] mx-auto px-4 flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex-shrink-0 w-[290px] md:w-[370px] h-[230px] bg-white rounded-3xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-24 mb-5" />
              <div className="h-4 bg-slate-100 rounded mb-3" />
              <div className="h-4 bg-slate-100 rounded mb-3" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
            <h3 className="text-xl font-bold text-[#0B1F3A]">لسه مفيش آراء معتمدة</h3>
            <p className="text-slate-500 mt-2">أول رأي يتم الموافقة عليه من لوحة التحكم هيظهر هنا.</p>
            {showWriteButton && (
              <Link to="/reviews" className="inline-flex mt-5 rounded-xl bg-[#0B1F3A] text-white px-5 py-3 text-sm font-bold">
                اكتب أول رأي
              </Link>
            )}
          </div>
        </div>
      ) : animate ? (
        <div className="reviews-marquee max-w-[1600px] mx-auto overflow-hidden" dir="ltr">
          <div className="reviews-track flex w-max py-3" style={{ '--marquee-duration': `${duration}s` }}>
            {[...reviews, ...reviews].map((review, index) => (
              <div key={`${review.id}-${index}`} className="pr-4" aria-hidden={index >= reviews.length || undefined}>
                <ReviewCard review={review} index={index % reviews.length} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-[1500px] mx-auto px-4 flex flex-wrap gap-4">
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>
      )}
    </section>
  )
}
