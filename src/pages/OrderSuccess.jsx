import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import {
  clearCart,
  clearCheckoutOrderNotes,
  clearPendingPaymentOrder,
  readRecentPlacedOrder,
} from '../lib/cart'
import { getCustomerOrders, saveCustomerOrder } from '../lib/customerOrders'
import { trackPurchase } from '../lib/analytics'

export default function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const orderNumberFromUrl = searchParams.get('number')
  const method = searchParams.get('method')
  // Paymob يضيف success / pending لرابط الرجوع بعد الدفع
  const paymobSuccess = searchParams.get('success')
  const paymobPending = searchParams.get('pending')
  const isPaymob = method === 'paymob' || paymobSuccess !== null

  const paymentState = !isPaymob
    ? 'order'
    : paymobSuccess === 'true'
      ? 'paid'
      : paymobPending === 'true'
        ? 'pending'
        : paymobSuccess === 'false'
          ? 'failed'
          : 'pending'

  const recentOrder = useMemo(() => readRecentPlacedOrder(), [])

  const purchaseValue = useMemo(
    () => getCustomerOrders().find((order) => order.orderId === orderId)?.totalAmount || 0,
    [orderId]
  )

  const orderNumber =
    orderNumberFromUrl ||
    (recentOrder?.orderId === orderId ? recentOrder?.orderNumber : null)

  const phone =
    recentOrder?.orderId === orderId ? recentOrder?.phone : null

  useEffect(() => {
    if (orderId && (paymentState === 'order' || paymentState === 'paid')) {
      trackPurchase({ orderId, orderNumber: orderNumberFromUrl, value: purchaseValue })
    }
  }, [orderId, paymentState, orderNumberFromUrl, purchaseValue])

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

  const view = {
    order: {
      icon: '✓',
      iconClass: 'bg-green-50 text-green-600',
      title: 'تم إرسال الطلب بنجاح',
      text: 'تم استلام طلبك، وسيتم التواصل معك قريباً لتأكيد التفاصيل.',
    },
    paid: {
      icon: '✓',
      iconClass: 'bg-green-50 text-green-600',
      title: 'تم الدفع بنجاح',
      text: 'شكراً لك! تم استلام الدفع وتأكيد طلبك، وسنتواصل معك لترتيب التوصيل.',
    },
    pending: {
      icon: '…',
      iconClass: 'bg-amber-50 text-amber-600',
      title: 'جاري تأكيد الدفع',
      text: 'تم استلام طلبك، وعملية الدفع قيد المراجعة. ستتحدث حالة الطلب تلقائياً خلال دقائق.',
    },
    failed: {
      icon: '!',
      iconClass: 'bg-red-50 text-red-600',
      title: 'لم تكتمل عملية الدفع',
      text: 'لم يتم خصم أي مبلغ. طلبك محفوظ، ويمكنك إعادة محاولة الدفع الآن أو التواصل معنا.',
    },
  }[paymentState]

  const retryPaymentHref = orderId
    ? `/payment?order=${encodeURIComponent(orderId)}&method=paymob`
    : '/checkout'

  return (
    <div
      className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center"
      dir="rtl"
    >
      <div className="w-full max-w-[580px] bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${view.iconClass}`}>
          <span className="text-5xl leading-none font-black">{view.icon}</span>
        </div>

        <h1 className="text-2xl md:text-4xl font-black text-slate-900">
          {view.title}
        </h1>

        <p className="text-slate-500 mt-4 text-base md:text-lg leading-8 font-bold">
          {view.text}
        </p>

        {orderNumber && (
          <div className="mt-6 bg-slate-100 rounded-2xl px-4 py-3 text-slate-700 font-bold text-sm md:text-base">
            <span className="text-slate-500">رقم الطلب: </span>
            <span className="font-black text-slate-900">{orderNumber}</span>
          </div>
        )}

        {paymentState !== 'failed' && (
          <p className="text-slate-500 mt-4 text-sm font-bold leading-7">
            يمكنك متابعة طلبك في أي وقت من صفحة طلباتي.
          </p>
        )}

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          {paymentState === 'failed' ? (
            <>
              <Link
                to={retryPaymentHref}
                className="w-full sm:w-auto bg-[#0B1F3A] text-white px-6 py-3 rounded-xl font-black text-base hover:opacity-90 transition"
              >
                إعادة محاولة الدفع
              </Link>

              <Link
                to="/contact"
                className="w-full sm:w-auto bg-slate-100 text-slate-950 px-6 py-3 rounded-xl font-black text-base hover:bg-slate-200 transition"
              >
                تواصل معنا
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
