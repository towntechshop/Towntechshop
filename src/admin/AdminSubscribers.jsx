import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { downloadCsv, formatDateTime, todayStamp } from '../lib/exportCsv'

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, source, created_at')
      .order('created_at', { ascending: false })

    if (error) setErrorMessage(error.message)
    setSubscribers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const remove = async (subscriber) => {
    if (!window.confirm(`إزالة ${subscriber.email} من المشتركين؟`)) return
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', subscriber.id)
    if (error) setErrorMessage(error.message)
    else setSubscribers((prev) => prev.filter((item) => item.id !== subscriber.id))
  }

  const exportList = () => {
    downloadCsv(
      `subscribers-${todayStamp()}`,
      [
        { label: 'الإيميل', key: 'email' },
        { label: 'تاريخ الاشتراك', value: (row) => formatDateTime(row.created_at) },
      ],
      subscribers
    )
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-950">مشتركين النشرة البريدية</h1>
          <p className="text-slate-500 mt-2 font-bold">
            الإيميلات اللي اشتركت من فوتر الموقع ({subscribers.length})
          </p>
        </div>
        <button
          type="button"
          onClick={exportList}
          disabled={!subscribers.length}
          className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black hover:bg-emerald-700 disabled:opacity-50"
        >
          تصدير Excel
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold">{errorMessage}</div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-48 animate-pulse bg-slate-50" />
        ) : subscribers.length === 0 ? (
          <p className="p-8 text-center text-slate-500 font-bold">لسه محدش اشترك.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {subscribers.map((subscriber) => (
              <li key={subscriber.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-black text-slate-900 truncate" dir="ltr">{subscriber.email}</p>
                  <p className="text-xs text-slate-500 font-bold">{formatDateTime(subscriber.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(subscriber)}
                  className="text-sm font-black text-red-600 hover:underline flex-shrink-0"
                >
                  إزالة
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
