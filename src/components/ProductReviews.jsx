import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Stars({ value, size = 'w-4 h-4' }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          className={`${size} ${star <= Math.round(value) ? 'text-amber-400' : 'text-slate-200'}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2.8 2.8 5.7 6.3.9-4.5 4.4 1 6.2L12 17l-5.6 3 1-6.2-4.5-4.4 6.3-.9z" />
        </svg>
      ))}
    </span>
  )
}

export function useProductReviews(productId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return undefined
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('reviews')
        .select('id, customer_name, rating, review_text, created_at')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!cancelled) {
        setReviews(data || [])
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [productId])

  const count = reviews.length
  const average = count
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count
    : 0

  return { reviews, loading, count, average }
}

// ملخص صغير تحت اسم المنتج
export function ProductRatingSummary({ average, count }) {
  if (!count) return null

  return (
    <a href="#product-reviews" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#0B1F3A]">
      <Stars value={average} />
      <span className="font-bold text-slate-800">{average.toFixed(1)}</span>
      <span>({count} تقييم)</span>
    </a>
  )
}

function ReviewForm({ productId, productTitle }) {
  const [rating, setRating] = useState(5)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!name.trim() || !text.trim()) {
      setError('اكتب اسمك ورأيك في المنتج.')
      return
    }

    setSending(true)

    const { error: insertError } = await supabase.from('reviews').insert({
      product_id: productId,
      customer_name: name.trim(),
      customer_phone: phone.trim() || null,
      rating,
      review_text: text.trim(),
      status: 'pending',
    })

    setSending(false)

    if (insertError) {
      setError('تعذر إرسال التقييم حالياً، حاول مرة أخرى.')
      return
    }

    setMessage('شكراً لك! تقييمك هيظهر بعد مراجعته.')
    setName('')
    setPhone('')
    setText('')
    setRating(5)
  }

  const inputClass =
    'w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white outline-none focus:border-[#0B1F3A] text-right'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h3 className="font-bold text-[#0B1F3A]">اكتب رأيك في {productTitle}</h3>

      <div className="flex items-center gap-1" role="radiogroup" aria-label="التقييم">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} نجوم`}
            onClick={() => setRating(star)}
            className="p-0.5"
          >
            <svg viewBox="0 0 24 24" className={`w-7 h-7 transition ${star <= rating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`} fill="currentColor" aria-hidden="true">
              <path d="m12 2.8 2.8 5.7 6.3.9-4.5 4.4 1 6.2L12 17l-5.6 3 1-6.2-4.5-4.4 6.3-.9z" />
            </svg>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="اسمك" className={inputClass} />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="رقم الموبايل (اختياري — مش هيظهر)"
          inputMode="tel"
          className={inputClass}
        />
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="إيه رأيك في جودة المنتج والتركيب والخدمة؟"
        className={`${inputClass} min-h-24`}
      />

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
      {message && <p className="text-sm font-bold text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={sending}
        className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-xl font-bold hover:brightness-125 disabled:opacity-60 transition"
      >
        {sending ? 'جاري الإرسال...' : 'إرسال التقييم'}
      </button>
    </form>
  )
}

// قسم التقييمات في صفحة المنتج
export default function ProductReviews({ productId, productTitle, reviews, average, count }) {
  return (
    <section id="product-reviews" className="px-4 pt-6 scroll-mt-28">
      <div className="max-w-[1220px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-5 items-start">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#0B1F3A]">تقييمات العملاء</h2>
            {count > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#0B1F3A]">{average.toFixed(1)}</span>
                <Stars value={average} size="w-5 h-5" />
                <span className="text-sm text-slate-500">({count})</span>
              </div>
            )}
          </div>

          {count === 0 ? (
            <p className="text-slate-500">مفيش تقييمات للمنتج ده لسه. كن أول واحد يقيّمه.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reviews.map((review) => (
                <li key={review.id} className="py-4 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-900">{review.customer_name}</p>
                    <Stars value={review.rating} />
                  </div>
                  <p className="mt-1.5 text-slate-600 leading-7 whitespace-pre-line">{review.review_text}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ReviewForm productId={productId} productTitle={productTitle} />
      </div>
    </section>
  )
}
