import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import {
  clearCart,
  clearCheckoutOrderNotes,
  clearPendingPaymentOrder,
  readRecentPlacedOrder,
} from '../lib/cart'
import { saveCustomerOrder } from '../lib/customerOrders'

export default function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const orderNumberFromUrl = searchParams.get('number')

  const recentOrder = useMemo(() => readRecentPlacedOrder(), [])

  const orderNumber =
    orderNumberFromUrl ||
    (recentOrder?.orderId === orderId ? recentOrder?.orderNumber : null)

  const phone =
    recentOrder?.orderId === orderId ? recentOrder?.phone : null

  useEffect(() => {
    if (orderId) {
      clearCart()
      clearCheckoutOrderNotes()
      clearPendingPaymentOrder()
    }
  }, [orderId])

  useEffect(() => {
    if (orderId && orderNumber && phone) {
      saveCustomerOrder({
        orderId,
        orderNumber,
        phone,
      })
    }
  }, [orderId, orderNumber, phone])

  return (
    <div
      className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center"
      dir="rtl"
    >
      <div className="w-full max-w-[580px] bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 mx-auto flex items-center justify-center mb-6">
          <span className="text-5xl text-green-600 leading-none">✓</span>
        </div>

        <h1 className="text-2xl md:text-4xl font-black text-slate-900">
          تم إرسال الطلب بنجاح
        </h1>

        <p className="text-slate-500 mt-4 text-base md:text-lg leading-8 font-bold">
          تم استلام طلبك، وسيتم التواصل معك قريباً لتأكيد التفاصيل.
        </p>

        {orderNumber && (
          <div className="mt-6 bg-slate-100 rounded-2xl px-4 py-3 text-slate-700 font-bold text-sm md:text-base">
            <span className="text-slate-500">رقم الطلب: </span>
            <span className="font-black text-slate-900">{orderNumber}</span>
          </div>
        )}

        <p className="text-slate-500 mt-4 text-sm font-bold leading-7">
          يمكنك متابعة طلبك في أي وقت من صفحة طلباتي.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/my-orders"
            className="w-full sm:w-auto bg-[#0B1F3A] text-white px-6 py-3 rounded-xl font-black text-base hover:opacity-90 transition"
          >
            عرض طلبي
          </Link>

          <Link
            to="/products"
            className="w-full sm:w-auto bg-slate-950 text-white px-6 py-3 rounded-xl font-black text-base hover:opacity-90 transition"
          >
            متابعة التسوق
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto bg-slate-100 text-slate-950 px-6 py-3 rounded-xl font-black text-base hover:bg-slate-200 transition"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
