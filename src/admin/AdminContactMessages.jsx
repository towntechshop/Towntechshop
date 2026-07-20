import { Fragment, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { markContactMessagesSeen } from '../hooks/useAdminNotifications'
import AdminPagination from './components/AdminPagination'
import {
  adminActionBtn,
  adminRowHover,
  adminTableHead,
  adminTableWrap,
  adminTd,
  adminTh,
} from './components/adminListStyles'

const MESSAGES_PER_PAGE = 15

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalMessages, setTotalMessages] = useState(0)

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.ceil(totalMessages / MESSAGES_PER_PAGE) || 1

  const getMessages = async () => {
    setLoading(true)
    setErrorMessage('')

    let query = supabase.from('contact_messages').select('*', { count: 'exact' })

    if (searchTerm.trim()) {
      const keyword = searchTerm.trim()
      query = query.or(
        `name.ilike.%${keyword}%,email.ilike.%${keyword}%,subject.ilike.%${keyword}%,message.ilike.%${keyword}%`
      )
    }

    const from = (currentPage - 1) * MESSAGES_PER_PAGE
    const to = from + MESSAGES_PER_PAGE - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      setErrorMessage(error.message)
      setMessages([])
      setTotalMessages(0)
    } else {
      setMessages(data || [])
      setTotalMessages(count || 0)
    }

    setLoading(false)
  }

  useEffect(() => {
    getMessages()
  }, [searchTerm, currentPage])

  useEffect(() => {
    markContactMessagesSeen()
    window.dispatchEvent(new Event('admin-contact-messages-seen'))
  }, [])

  const deleteMessage = async (messageId) => {
    if (!window.confirm('هل تريد حذف هذه الرسالة؟')) return

    setDeletingId(messageId)
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setMessage('تم حذف الرسالة بنجاح')
      if (expandedId === messageId) setExpandedId(null)
      await getMessages()
    }

    setDeletingId(null)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setCurrentPage(1)
    setSearchTerm(searchInput)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchTerm('')
    setCurrentPage(1)
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

  return (
    <div dir="rtl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950">رسائل التواصل</h1>
          <p className="text-slate-500 mt-1 font-bold text-sm">
            جدول مدمج — {totalMessages} رسالة
          </p>
        </div>
        <button
          type="button"
          onClick={getMessages}
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

      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-2"
      >
        <input
          type="text"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="بحث بالاسم، البريد، الموضوع، أو نص الرسالة..."
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-slate-950 text-right text-sm font-bold"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-slate-950 text-white px-4 py-2.5 rounded-xl font-black text-sm hover:bg-slate-800 transition"
          >
            بحث
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-black text-sm hover:bg-slate-200 transition"
            >
              مسح
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className={`${adminTableWrap} p-6 space-y-2`}>
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className={`${adminTableWrap} p-10 text-center`}>
          <h3 className="text-xl font-black text-slate-950">لا توجد رسائل</h3>
          <p className="text-slate-500 font-bold mt-2 text-sm">
            {searchTerm ? 'لم يتم العثور على نتائج.' : 'لم تصل أي رسائل بعد.'}
          </p>
        </div>
      ) : (
        <div className={adminTableWrap}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right min-w-[800px]">
              <thead className={adminTableHead}>
                <tr>
                  <th className={adminTh}>المرسل</th>
                  <th className={adminTh}>البريد</th>
                  <th className={adminTh}>الموضوع</th>
                  <th className={`${adminTh} w-[30%]`}>الرسالة</th>
                  <th className={adminTh}>التاريخ</th>
                  <th className={adminTh}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((item) => (
                  <Fragment key={item.id}>
                    <tr className={adminRowHover}>
                      <td className={`${adminTd} font-black text-slate-950 text-sm`}>
                        {item.name}
                      </td>
                      <td className={`${adminTd} text-xs text-sky-700 font-bold break-all`}>
                        {item.email}
                      </td>
                      <td className={`${adminTd} text-sm text-slate-600 font-bold`}>
                        {item.subject || '—'}
                      </td>
                      <td className={adminTd}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expandedId === item.id ? null : item.id)
                          }
                          className="text-right w-full text-sm text-slate-700 font-bold line-clamp-2 leading-6 hover:text-slate-950"
                        >
                          {item.message}
                        </button>
                      </td>
                      <td
                        className={`${adminTd} text-xs text-slate-500 font-bold whitespace-nowrap`}
                      >
                        {formatDate(item.created_at)}
                      </td>
                      <td className={adminTd}>
                        <div className="flex flex-wrap gap-1 justify-end">
                          <a
                            href={`mailto:${item.email}?subject=${encodeURIComponent(
                              `رد على: ${item.subject || 'رسالة من الموقع'}`
                            )}`}
                            className={`${adminActionBtn} bg-slate-950 text-white hover:bg-slate-800`}
                          >
                            رد
                          </a>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => deleteMessage(item.id)}
                            className={`${adminActionBtn} bg-red-50 text-red-600 hover:bg-red-100`}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={6} className="px-4 py-3">
                          <p className="text-sm text-slate-700 font-bold leading-7 whitespace-pre-line">
                            {item.message}
                          </p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
            {messages.map((item) => (
              <div key={item.id} className="p-3">
                <div className="flex justify-between gap-2 mb-1">
                  <p className="font-black text-slate-950 text-sm">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold shrink-0">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <p className="text-xs text-sky-700 font-bold break-all">{item.email}</p>
                {item.subject && (
                  <p className="text-xs text-slate-500 font-bold mt-1">{item.subject}</p>
                )}
                <p className="text-sm text-slate-700 font-bold mt-2 line-clamp-2">
                  {item.message}
                </p>
                <div className="flex gap-1 mt-2">
                  <a
                    href={`mailto:${item.email}`}
                    className={`${adminActionBtn} bg-slate-950 text-white`}
                  >
                    رد
                  </a>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => deleteMessage(item.id)}
                    className={`${adminActionBtn} bg-red-50 text-red-600`}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalMessages}
            pageSize={MESSAGES_PER_PAGE}
            itemLabel="رسالة"
          />
        </div>
      )}
    </div>
  )
}
