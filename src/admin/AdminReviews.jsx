import { Fragment, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AdminPagination from './components/AdminPagination'
import {
  adminActionBtn,
  adminRowHover,
  adminTableHead,
  adminTableWrap,
  adminTd,
  adminTh,
} from './components/adminListStyles'

const REVIEWS_PER_PAGE = 15

function ReviewActions({ review, savingId, onUpdate, onDelete }) {
  const disabled = savingId === review.id

  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {review.status !== 'approved' && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onUpdate(review.id, { status: 'approved' })}
          className={`${adminActionBtn} bg-green-600 text-white hover:bg-green-700`}
        >
          قبول
        </button>
      )}
      {review.status !== 'rejected' && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onUpdate(review.id, { status: 'rejected' })}
          className={`${adminActionBtn} bg-red-50 text-red-600 hover:bg-red-100`}
        >
          رفض
        </button>
      )}
      {review.status !== 'pending' && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onUpdate(review.id, { status: 'pending' })}
          className={`${adminActionBtn} bg-amber-50 text-amber-700 hover:bg-amber-100`}
        >
          مراجعة
        </button>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onUpdate(review.id, { is_featured: !review.is_featured })}
        className={`${adminActionBtn} bg-sky-50 text-sky-700 hover:bg-sky-100`}
      >
        {review.is_featured ? 'إلغاء تمييز' : 'مميز'}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDelete(review.id)}
        className={`${adminActionBtn} bg-slate-100 text-slate-600 hover:bg-slate-200`}
      >
        حذف
      </button>
    </div>
  )
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE) || 1

  const getStats = async () => {
    const [totalRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rejected'),
    ])

    setStats({
      total: totalRes.count || 0,
      pending: pendingRes.count || 0,
      approved: approvedRes.count || 0,
      rejected: rejectedRes.count || 0,
    })
  }

  const getReviews = async () => {
    setLoading(true)
    setErrorMessage('')

    let query = supabase.from('reviews').select('*', { count: 'exact' })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (searchTerm.trim()) {
      const keyword = searchTerm.trim()
      query = query.or(
        `customer_name.ilike.%${keyword}%,customer_phone.ilike.%${keyword}%,customer_email.ilike.%${keyword}%,review_text.ilike.%${keyword}%`
      )
    }

    const from = (currentPage - 1) * REVIEWS_PER_PAGE
    const to = from + REVIEWS_PER_PAGE - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      setErrorMessage(error.message)
      setReviews([])
      setTotalReviews(0)
    } else {
      setReviews(data || [])
      setTotalReviews(count || 0)
    }

    setLoading(false)
  }

  useEffect(() => {
    getStats()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchTerm])

  useEffect(() => {
    getReviews()
  }, [statusFilter, searchTerm, currentPage])

  const updateReview = async (reviewId, updates) => {
    setSavingId(reviewId)
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setMessage('تم تحديث التقييم بنجاح')
      await Promise.all([getReviews(), getStats()])
    }

    setSavingId(null)
  }

  const deleteReview = async (reviewId) => {
    if (!window.confirm('هل تريد حذف هذا التقييم؟')) return

    setSavingId(reviewId)
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase.from('reviews').delete().eq('id', reviewId)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setMessage('تم حذف التقييم بنجاح')
      if (expandedId === reviewId) setExpandedId(null)
      await Promise.all([getReviews(), getStats()])
    }

    setSavingId(null)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setCurrentPage(1)
    setSearchTerm(searchInput)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setStatusFilter('all')
    setCurrentPage(1)
  }

  const translateStatus = (status) => {
    const statuses = {
      pending: 'قيد المراجعة',
      approved: 'مقبول',
      rejected: 'مرفوض',
    }
    return statuses[status] || status || '-'
  }

  const getStatusClass = (status) => {
    if (status === 'approved') return 'bg-green-50 text-green-700'
    if (status === 'rejected') return 'bg-red-50 text-red-700'
    return 'bg-amber-50 text-amber-700'
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('ar-EG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderStars = (rating) => {
    const safeRating = Number(rating || 0)
    return (
      <span className="text-amber-500 font-black text-xs" dir="ltr">
        {'★'.repeat(safeRating)}
        <span className="text-slate-300">{'★'.repeat(5 - safeRating)}</span>
        <span className="text-slate-500 mr-1">{safeRating}/5</span>
      </span>
    )
  }

  const filtersActive = searchTerm || statusFilter !== 'all'

  return (
    <div dir="rtl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950">التقييمات</h1>
          <p className="text-slate-500 mt-1 font-bold text-sm">
            جدول مدمج — 15 تقييم في الصفحة
          </p>
        </div>
        <button
          type="button"
          onClick={() => Promise.all([getReviews(), getStats()])}
          className="w-full md:w-auto bg-white border border-slate-200 text-slate-950 px-4 py-2.5 rounded-xl font-black text-sm hover:bg-slate-50 transition"
        >
          تحديث
        </button>
      </div>

      {(message || errorMessage) && (
        <div className="mb-4 space-y-2">
          {message && (
            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-2.5 rounded-xl text-sm font-bold">
              {message}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'الكل', value: stats.total, tone: 'text-slate-950' },
          { label: 'قيد المراجعة', value: stats.pending, tone: 'text-amber-600' },
          { label: 'مقبولة', value: stats.approved, tone: 'text-green-600' },
          { label: 'مرفوضة', value: stats.rejected, tone: 'text-red-600' },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 min-w-[120px]"
          >
            <p className="text-[11px] text-slate-500 font-bold">{item.label}</p>
            <p className={`text-lg font-black ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 md:p-4 mb-4">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، البريد، أو نص التقييم..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-slate-950 text-right text-sm font-bold"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-slate-950 bg-white text-right text-sm font-bold"
          >
            <option value="all">كل التقييمات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">مقبولة</option>
            <option value="rejected">مرفوضة</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 md:flex-none bg-slate-950 text-white px-4 py-2.5 rounded-xl font-black text-sm hover:bg-slate-800 transition"
            >
              بحث
            </button>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-black text-sm hover:bg-red-100 transition"
              >
                مسح
              </button>
            )}
          </div>
        </form>
      </section>

      {loading ? (
        <div className={`${adminTableWrap} p-6 space-y-2`}>
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className={`${adminTableWrap} p-10 text-center`}>
          <h3 className="text-xl font-black text-slate-950">لا توجد تقييمات</h3>
          <p className="text-slate-500 mt-2 font-bold text-sm">
            {filtersActive ? 'لا توجد نتائج مطابقة.' : 'تقييمات العملاء ستظهر هنا.'}
          </p>
        </div>
      ) : (
        <div className={adminTableWrap}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right min-w-[900px]">
              <thead className={adminTableHead}>
                <tr>
                  <th className={adminTh}>العميل</th>
                  <th className={adminTh}>التقييم</th>
                  <th className={`${adminTh} w-[35%]`}>التعليق</th>
                  <th className={adminTh}>الحالة</th>
                  <th className={adminTh}>التاريخ</th>
                  <th className={adminTh}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <Fragment key={review.id}>
                    <tr className={adminRowHover}>
                      <td className={adminTd}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expandedId === review.id ? null : review.id)
                          }
                          className="text-right w-full"
                        >
                          <div className="font-black text-slate-950 text-sm">
                            {review.customer_name || '—'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-bold mt-0.5">
                            {review.customer_phone || review.customer_email || '—'}
                          </div>
                          {review.is_featured && (
                            <span className="inline-block mt-1 bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded text-[10px] font-black">
                              مميز
                            </span>
                          )}
                        </button>
                      </td>
                      <td className={adminTd}>{renderStars(review.rating)}</td>
                      <td className={adminTd}>
                        <p className="text-slate-700 font-bold text-sm line-clamp-2 leading-6">
                          {review.review_text}
                        </p>
                      </td>
                      <td className={adminTd}>
                        <span
                          className={`inline-block px-2 py-1 rounded-lg text-[11px] font-black ${getStatusClass(
                            review.status
                          )}`}
                        >
                          {translateStatus(review.status)}
                        </span>
                      </td>
                      <td
                        className={`${adminTd} text-xs text-slate-500 font-bold whitespace-nowrap`}
                      >
                        {formatDate(review.created_at)}
                      </td>
                      <td className={adminTd}>
                        <ReviewActions
                          review={review}
                          savingId={savingId}
                          onUpdate={updateReview}
                          onDelete={deleteReview}
                        />
                      </td>
                    </tr>
                    {expandedId === review.id && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={6} className="px-4 py-3">
                          <p className="text-sm text-slate-700 font-bold leading-7 whitespace-pre-line">
                            {review.review_text}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs font-bold text-slate-500">
                            {review.customer_phone && (
                              <span dir="ltr">📞 {review.customer_phone}</span>
                            )}
                            {review.customer_email && <span>{review.customer_email}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-black text-slate-950 text-sm truncate">
                      {review.customer_name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-black ${getStatusClass(
                      review.status
                    )}`}
                  >
                    {translateStatus(review.status)}
                  </span>
                </div>
                {renderStars(review.rating)}
                <p className="text-sm text-slate-700 font-bold mt-2 line-clamp-2">
                  {review.review_text}
                </p>
                <div className="mt-2">
                  <ReviewActions
                    review={review}
                    savingId={savingId}
                    onUpdate={updateReview}
                    onDelete={deleteReview}
                  />
                </div>
              </div>
            ))}
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalReviews}
            pageSize={REVIEWS_PER_PAGE}
            itemLabel="تقييم"
          />
        </div>
      )}
    </div>
  )
}
