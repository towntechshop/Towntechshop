import {
  formatOrderDate,
  formatOrderPrice,
  translatePaymentMethod,
  translatePaymentStatus,
  translateOrderStatus,
} from '../../lib/orderTracking'

export default function OrderDetailsCard({ order }) {
  const items = Array.isArray(order.items) ? order.items : []

  return (
    <article className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-5 md:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-right">
          <div>
            <p className="text-slate-500 font-bold text-sm">طلب رقم</p>
            <p className="text-xl md:text-2xl font-black text-[#0B1F3A] mt-1">
              {order.order_number}
            </p>
            <p className="text-slate-500 font-bold text-sm mt-2">
              {formatOrderDate(order.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-800 px-4 py-2 text-sm font-black">
              {translateOrderStatus(order.status)}
            </span>
            <span className="inline-flex items-center rounded-full bg-white border border-slate-200 text-slate-700 px-4 py-2 text-sm font-black">
              {translatePaymentStatus(order.payment_status)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 space-y-8">
        <div>
          <h3 className="font-black text-lg text-[#0B1F3A] mb-4 text-right">المنتجات</h3>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`${item.product_title}-${index}`}
                className="flex items-center gap-4 border border-slate-100 rounded-2xl p-4"
              >
                {item.product_image_url ? (
                  <img
                    src={item.product_image_url}
                    alt={item.product_title}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0 text-right">
                  <p className="font-black text-slate-900">{item.product_title}</p>
                  <p className="text-slate-500 font-bold text-sm mt-1">
                    الكمية: {item.quantity} × {formatOrderPrice(item.unit_price)} جنيه
                  </p>
                </div>

                <p className="font-black text-slate-900 whitespace-nowrap">
                  {formatOrderPrice(item.line_total)} جنيه
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-slate-50 p-5 text-right">
            <h3 className="font-black text-[#0B1F3A] mb-3">عنوان التسليم</h3>
            <p className="font-bold text-slate-700">{order.customer_name}</p>
            <p className="font-bold text-slate-600 mt-2 leading-7">{order.customer_address}</p>
            {order.customer_city && (
              <p className="font-bold text-slate-500 mt-1">{order.customer_city}</p>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 text-right">
            <h3 className="font-black text-[#0B1F3A] mb-3">ملخص الدفع</h3>
            <div className="space-y-2 text-sm font-bold text-slate-600">
              <div className="flex justify-between gap-4">
                <span>{formatOrderPrice(order.subtotal)} جنيه</span>
                <span>المجموع الفرعي</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>{formatOrderPrice(order.shipping_fee)} جنيه</span>
                <span>الشحن</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between gap-4 text-green-700">
                  <span>-{formatOrderPrice(order.discount_amount)} جنيه</span>
                  <span>الخصم</span>
                </div>
              )}
              <div className="flex justify-between gap-4 pt-2 border-t border-slate-200 text-base text-slate-900">
                <span className="font-black">{formatOrderPrice(order.total_amount)} جنيه</span>
                <span className="font-black">الإجمالي</span>
              </div>
            </div>
            <p className="text-slate-500 font-bold text-sm mt-4">
              طريقة الدفع: {translatePaymentMethod(order.payment_method)}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
