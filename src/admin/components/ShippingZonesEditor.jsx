import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

// أسعار الشحن لكل محافظة
export default function ShippingZonesEditor() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bulkFee, setBulkFee] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [dirtyIds, setDirtyIds] = useState(() => new Set())

  const loadZones = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('id, governorate, fee, is_active, sort_order')
      .order('sort_order', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setZones(data || [])
      setDirtyIds(new Set())
    }
    setLoading(false)
  }

  useEffect(() => {
    loadZones()
  }, [])

  const updateZone = (id, patch) => {
    setZones((prev) => prev.map((zone) => (zone.id === id ? { ...zone, ...patch } : zone)))
    setDirtyIds((prev) => new Set(prev).add(id))
    setMessage('')
  }

  const applyBulkFee = () => {
    const fee = Number(bulkFee)
    if (!Number.isFinite(fee) || fee < 0) return
    setZones((prev) => prev.map((zone) => ({ ...zone, fee })))
    setDirtyIds(new Set(zones.map((zone) => zone.id)))
    setMessage('')
  }

  const saveZones = async () => {
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const changed = zones.filter((zone) => dirtyIds.has(zone.id))

    for (const zone of changed) {
      const { error } = await supabase
        .from('shipping_zones')
        .update({
          fee: Math.max(Number(zone.fee) || 0, 0),
          is_active: Boolean(zone.is_active),
          updated_at: new Date().toISOString(),
        })
        .eq('id', zone.id)

      if (error) {
        setErrorMessage(`${zone.governorate}: ${error.message}`)
        setSaving(false)
        return
      }
    }

    setMessage(changed.length ? `تم حفظ أسعار ${changed.length} محافظة` : 'مفيش تغييرات')
    setDirtyIds(new Set())
    setSaving(false)
  }

  const stats = useMemo(() => {
    const active = zones.filter((zone) => zone.is_active)
    const fees = active.map((zone) => Number(zone.fee) || 0)
    return {
      active: active.length,
      min: fees.length ? Math.min(...fees) : 0,
      max: fees.length ? Math.max(...fees) : 0,
    }
  }, [zones])

  return (
    <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-950">سعر الشحن لكل محافظة</h2>
          <p className="text-slate-500 mt-1 font-bold text-sm leading-6">
            العميل بيختار محافظته في صفحة إتمام الطلب وسعر الشحن بيتحسب لوحده. المحافظة اللي تقفلها مش هتظهر للعميل.
            الشحن المجاني (لو مفعّل فوق) بيتطبق على كل المحافظات.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-black">
          <span className="bg-slate-100 rounded-full px-3 py-1.5">{stats.active} محافظة شغالة</span>
          <span className="bg-slate-100 rounded-full px-3 py-1.5">
            من {stats.min} لـ {stats.max} جنيه
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 rounded-2xl bg-slate-50 border border-slate-200 p-3">
        <span className="text-sm font-black text-slate-700">نفس السعر لكل المحافظات:</span>
        <input
          type="number"
          min="0"
          value={bulkFee}
          onChange={(event) => setBulkFee(event.target.value)}
          placeholder="مثلاً 75"
          className="w-28 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-slate-950"
        />
        <button
          type="button"
          onClick={applyBulkFee}
          className="bg-slate-950 text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-slate-800"
        >
          تطبيق على الكل
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 mb-4 font-bold text-sm">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="h-60 bg-slate-50 rounded-2xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                zone.is_active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'
              } ${dirtyIds.has(zone.id) ? 'ring-2 ring-sky-200' : ''}`}
            >
              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zone.is_active}
                  onChange={(event) => updateZone(zone.id, { is_active: event.target.checked })}
                  className="w-4 h-4"
                />
                <span className="font-black text-slate-900 truncate">{zone.governorate}</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={zone.fee}
                  onChange={(event) => updateZone(zone.id, { fee: event.target.value })}
                  className="w-20 border border-slate-300 rounded-xl px-2 py-1.5 text-center font-black outline-none focus:border-slate-950"
                  aria-label={`سعر الشحن ${zone.governorate}`}
                />
                <span className="text-xs font-bold text-slate-500">جنيه</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={saveZones}
          disabled={saving || dirtyIds.size === 0}
          className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {saving ? 'جاري الحفظ...' : `حفظ أسعار المحافظات${dirtyIds.size ? ` (${dirtyIds.size})` : ''}`}
        </button>
        {message && <span className="text-green-700 font-black text-sm">{message}</span>}
      </div>
    </section>
  )
}
