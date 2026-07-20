import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminShippingSettings() {
  const [settingsId, setSettingsId] = useState(null)
  const [shippingFee, setShippingFee] = useState('')
  const [enableFreeShipping, setEnableFreeShipping] = useState(false)
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const getShippingSettings = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('site_settings')
      .select('id, shipping_fee, enable_free_shipping, free_shipping_min_amount')
      .limit(1)
      .maybeSingle()

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    if (data) {
      setSettingsId(data.id)
      setShippingFee(data.shipping_fee ?? 0)
      setEnableFreeShipping(data.enable_free_shipping || false)
      setFreeShippingMinAmount(data.free_shipping_min_amount ?? 0)
    }

    setLoading(false)
  }

  useEffect(() => {
    getShippingSettings()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const payload = {
      shipping_fee: shippingFee ? Number(shippingFee) : 0,
      enable_free_shipping: enableFreeShipping,
      free_shipping_min_amount: freeShippingMinAmount
        ? Number(freeShippingMinAmount)
        : 0,
    }

    let result

    if (settingsId) {
      result = await supabase
        .from('site_settings')
        .update(payload)
        .eq('id', settingsId)
    } else {
      result = await supabase
        .from('site_settings')
        .insert([payload])
        .select()
        .single()
    }

    if (result.error) {
      setErrorMessage(result.error.message)
      setSaving(false)
      return
    }

    setMessage('تم حفظ إعدادات الشحن بنجاح')
    setSaving(false)
    getShippingSettings()
  }

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('en-US')
  }

  if (loading) {
    return (
      <div dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-4xl font-black text-slate-950">
            إعدادات الشحن
          </h1>

          <p className="text-slate-500 mt-2 font-bold">
            جاري تحميل إعدادات الشحن...
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <div className="h-96 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
          <div className="h-72 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-950">
            إعدادات الشحن
          </h1>

          <p className="text-slate-500 mt-2 font-bold">
            التحكم في مصاريف الشحن وقاعدة الشحن المجاني داخل الموقع
          </p>
        </div>

        <button
          type="button"
          onClick={getShippingSettings}
          className="w-full md:w-auto bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition"
        >
          تحديث البيانات
        </button>
      </div>

      {(message || errorMessage) && (
        <div className="mb-5 space-y-3">
          {message && (
            <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl font-bold">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl font-bold">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6"
        >
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-black text-slate-950">
              قواعد الشحن
            </h2>

            <p className="text-slate-500 mt-1 font-bold text-sm">
              حدد قيمة الشحن وهل يوجد شحن مجاني بعد حد معين من قيمة الطلب
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-black text-slate-700">
                قيمة الشحن
              </label>

              <div className="relative">
                <input
                  type="number"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-4 pl-16 outline-none focus:border-slate-950 text-right"
                  placeholder="مثال: 50"
                  min="0"
                />

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">
                  جنيه
                </span>
              </div>

              <p className="text-sm text-slate-500 mt-2 font-bold leading-6">
                هذا المبلغ سيتم إضافته على إجمالي الطلب في عربة التسوق وصفحة الدفع.
              </p>
            </div>

            <label className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer">
              <input
                id="enableFreeShipping"
                type="checkbox"
                checked={enableFreeShipping}
                onChange={(e) => setEnableFreeShipping(e.target.checked)}
                className="w-5 h-5 mt-1"
              />

              <div>
                <p className="font-black text-slate-950">
                  تفعيل الشحن المجاني
                </p>

                <p className="text-slate-500 text-sm font-bold mt-1 leading-6">
                  عند التفعيل، العميل يحصل على شحن مجاني عندما يصل إجمالي المنتجات للحد المحدد.
                </p>
              </div>
            </label>

            <div>
              <label className="block mb-2 text-sm font-black text-slate-700">
                الحد الأدنى للشحن المجاني
              </label>

              <div className="relative">
                <input
                  type="number"
                  value={freeShippingMinAmount}
                  onChange={(e) => setFreeShippingMinAmount(e.target.value)}
                  disabled={!enableFreeShipping}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-4 pl-16 outline-none focus:border-slate-950 disabled:bg-slate-100 disabled:text-slate-400 text-right"
                  placeholder="مثال: 1000"
                  min="0"
                />

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">
                  جنيه
                </span>
              </div>

              <p className="text-sm text-slate-500 mt-2 font-bold leading-6">
                مثال: لو القيمة 1000، أي طلب إجمالي منتجاته 1000 جنيه أو أكثر يحصل على شحن مجاني.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto bg-slate-950 text-white px-7 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60 transition"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الشحن'}
            </button>
          </div>
        </form>

        <aside className="space-y-5 xl:sticky xl:top-6">
          <div
            className="rounded-3xl shadow-sm p-5 md:p-6 text-white"
            style={{
              background:
                'linear-gradient(135deg, #07111F 0%, #0B1F3A 55%, #123D68 100%)',
            }}
          >
            <h2 className="text-xl md:text-2xl font-black">
              القاعدة الحالية
            </h2>

            <div className="mt-5 space-y-4">
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-white/60 text-sm font-bold">
                  قيمة الشحن
                </p>

                <p className="text-3xl font-black mt-2">
                  {formatMoney(shippingFee)} جنيه
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-white/60 text-sm font-bold">
                  الشحن المجاني
                </p>

                <p className="text-xl font-black mt-2">
                  {enableFreeShipping ? 'مفعل' : 'غير مفعل'}
                </p>

                {enableFreeShipping && (
                  <p className="text-white/70 text-sm font-bold mt-2 leading-6">
                    عند طلب بقيمة {formatMoney(freeShippingMinAmount)} جنيه أو أكثر
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
            <h3 className="text-xl font-black text-slate-950 mb-3">
              ملاحظات مهمة
            </h3>

            <div className="space-y-3 text-sm text-slate-600 font-bold leading-7">
              <p>
                قيمة الشحن تظهر للعميل في عربة التسوق وصفحة إتمام الطلب.
              </p>

              <p>
                عند تفعيل الشحن المجاني، يتم إلغاء قيمة الشحن إذا وصل إجمالي المنتجات للحد المطلوب.
              </p>

              <p>
                لو مش عايز تضيف شحن، اكتب قيمة الشحن 0.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}