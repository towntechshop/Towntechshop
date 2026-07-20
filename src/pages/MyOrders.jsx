import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OrderDetailsCard from '../components/orders/OrderDetailsCard'
import {
  fetchCustomerOrderDetails,
  getCustomerOrders,
} from '../lib/customerOrders'

function OrderSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 animate-pulse">
      <div className="h-6 w-40 bg-slate-200 rounded-full mb-4" />
      <div className="h-4 w-56 bg-slate-100 rounded-full mb-8" />
      <div className="space-y-3">
        <div className="h-20 bg-slate-100 rounded-2xl" />
        <div className="h-20 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  )
}

export default function MyOrders() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [loadError, setLoadError] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    const savedOrders = getCustomerOrders()

    if (savedOrders.length === 0) {
      setOrders([])
      setLoading(false)
      return
    }

    try {
      const results = await Promise.all(
        savedOrders.map(async (savedOrder) => {
          try {
            const details = await fetchCustomerOrderDetails(savedOrder)
            return { savedOrder, details, error: null }
          } catch (error) {
            return {
              savedOrder,
              details: null,
              error: error.message || 'تعذر تحميل الطلب',
            }
          }
        })
      )

      setOrders(results)
    } catch {
      setLoadError('تعذر تحميل الطلبات حالياً.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const hasOrders = orders.length > 0

  return (
    <div className="bg-slate-100 min-h-screen" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 text-right">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0B1F3A]">طلباتي</h1>
            <p className="text-slate-500 font-bold mt-2">
              هنا تظهر طلباتك التي قمت بها من هذا المتصفح.
            </p>
          </div>

          {hasOrders && (
            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="self-start md:self-auto bg-white border border-slate-200 text-[#0B1F3A] px-5 py-2.5 rounded-xl font-black text-sm hover:bg-slate-50 transition disabled:opacity-60"
            >
              {loading ? 'جاري التحديث...' : 'تحديث الحالة'}
            </button>
          )}
        </div>

        {loadError && (
          <div className="mb-6 rounded-xl bg-red-50 text-red-600 px-4 py-3 font-bold text-right">
            {loadError}
          </div>
        )}

        {loading && (
          <div className="space-y-6">
            <OrderSkeleton />
          </div>
        )}

        {!loading && !hasOrders && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-5 text-3xl">
              📦
            </div>
            <h2 className="text-2xl font-black text-[#0B1F3A]">لا توجد طلبات بعد</h2>
            <p className="text-slate-500 font-bold mt-3 leading-8 max-w-md mx-auto">
              لما تطلب من الموقع، هتلاقي طلبك هنا تلقائياً مع تفاصيله وحالة التوصيل.
            </p>
            <Link
              to="/products"
              className="inline-block mt-6 bg-[#0B1F3A] text-white px-8 py-3 rounded-xl font-black hover:opacity-90 transition"
            >
              ابدأ التسوق
            </Link>
          </div>
        )}

        {!loading && hasOrders && (
          <div className="space-y-6">
            {orders.map(({ savedOrder, details, error }) => (
              <div key={savedOrder.orderId}>
                {details ? (
                  <OrderDetailsCard order={details} />
                ) : (
                  <div className="bg-white rounded-3xl border border-amber-200 p-6 text-right">
                    <p className="font-black text-slate-900">
                      طلب رقم {savedOrder.orderNumber}
                    </p>
                    <p className="text-amber-700 font-bold mt-2">
                      {error || 'تعذر تحميل تفاصيل هذا الطلب.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
