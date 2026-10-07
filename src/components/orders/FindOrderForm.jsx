import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { saveCustomerOrder } from '../../lib/customerOrders'

// البحث عن طلب برقم الطلب + الموبايل (لطلبات اتعملت من جهاز تاني أو قبل كده)
export default function FindOrderForm({ onFound, compact = false }) {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!orderNumber.trim() || !phone.trim()) {
      setError('اكتب رقم الطلب ورقم الموبايل اللي طلبت بيه.')
      return
    }

    setSearching(true)

    const { data, error: lookupError } = await supabase.rpc('lookup_guest_order', {
      p_order_number: orderNumber.trim(),
      p_phone: phone.trim(),
    })

    setSearching(false)

    if (lookupError || !data?.id) {
      setError(lookupError?.message || 'لم يتم العثور على الطلب. تأكد من رقم الطلب ورقم الموبايل.')
      return
    }

    saveCustomerOrder({
      orderId: data.id,
      orderNumber: data.order_number,
      phone: phone.trim(),
      totalAmount: data.total_amount,
      placedAt: data.created_at,
    })

    setOrderNumber('')
    setPhone('')
    onFound?.()
  }

  const inputClass =
    'w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition'

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl border border-slate-200 ${compact ? 'p-4' : 'p-5 md:p-6'} text-right`}
    >
      <h2 className="font-bold text-[#0B1F3A] text-lg">تتبع طلب</h2>
      <p className="text-slate-500 text-sm mt-1 leading-6">
        اكتب رقم الطلب (زي TT-20261007-1023) ورقم الموبايل اللي طلبت بيه.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 mt-4">
        <input
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          placeholder="رقم الطلب"
          dir="ltr"
          className={`${inputClass} text-left uppercase`}
          aria-label="رقم الطلب"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="01xxxxxxxxx"
          type="tel"
          inputMode="tel"
          dir="ltr"
          className={`${inputClass} text-left`}
          aria-label="رقم الموبايل"
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-[#0B1F3A] text-white px-6 py-3 rounded-xl font-bold hover:brightness-125 disabled:opacity-60 transition whitespace-nowrap"
        >
          {searching ? 'جاري البحث...' : 'اعرض الطلب'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
    </form>
  )
}
