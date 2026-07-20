import { Fragment, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AdminPagination from './components/AdminPagination'
import { adminActionBtn } from './components/adminListStyles'

const ORDERS_PER_PAGE = 15

const orderStatuses = [
  'new',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

const paymentStatuses = ['pending', 'paid', 'failed', 'refunded']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [copiedOrderId, setCopiedOrderId] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE) || 1

  const translateOrderStatus = (status) => {
    const statuses = {
      new: 'جديد',
      confirmed: 'تم التأكيد',
      processing: 'قيد التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
    }

    return statuses[status] || status || '-'
  }

  const translatePaymentStatus = (status) => {
    const statuses = {
      pending: 'قيد الانتظار',
      paid: 'مدفوع',
      failed: 'فشل الدفع',
      refunded: 'تم الاسترداد',
    }

    return statuses[status] || status || '-'
  }

  const translatePaymentMethod = (method) => {
    const methods = {
      cash_on_delivery: 'الدفع عند الاستلام',
      paymob: 'دفع إلكتروني عبر Paymob',
      vodafone_cash: 'فودافون كاش',
      instapay: 'إنستا باي',
    }

    return methods[method] || method || '-'
  }

  const translateDateFilter = (filter) => {
    const filters = {
      all: 'كل التواريخ',
      today: 'اليوم',
      last_7_days: 'آخر 7 أيام',
      this_month: 'هذا الشهر',
    }

    return filters[filter] || filter
  }

  const getDateFilterValue = () => {
    const now = new Date()

    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return today.toISOString()
    }

    if (dateFilter === 'last_7_days') {
      const lastWeek = new Date()
      lastWeek.setDate(now.getDate() - 7)
      return lastWeek.toISOString()
    }

    if (dateFilter === 'this_month') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return firstDayOfMonth.toISOString()
    }

    return null
  }

  const getOrders = async () => {
    setLoading(true)
    setErrorMessage('')

    let query = supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })

    if (searchTerm.trim() !== '') {
      const keyword = searchTerm.trim()

      query = query.or(
        `order_number.ilike.%${keyword}%,customer_name.ilike.%${keyword}%,customer_phone.ilike.%${keyword}%,customer_email.ilike.%${keyword}%`
      )
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (paymentFilter !== 'all') {
      query = query.eq('payment_status', paymentFilter)
    }

    const dateFrom = getDateFilterValue()

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    const from = (currentPage - 1) * ORDERS_PER_PAGE
    const to = from + ORDERS_PER_PAGE - 1

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      setErrorMessage(error.message)
      setOrders([])
      setTotalOrders(0)
    } else {
      setOrders(data || [])
      setTotalOrders(count || 0)
    }

    setLoading(false)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, paymentFilter, dateFilter])

  useEffect(() => {
    getOrders()
  }, [searchTerm, statusFilter, paymentFilter, dateFilter, currentPage])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    setSearchTerm(searchInput)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDateFilter('all')
    setCurrentPage(1)
  }

  const updateOrderStatus = async (orderId, status) => {
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      alert(error.message)
      return
    }

    getOrders()
  }

  const updatePaymentStatus = async (orderId, paymentStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      alert(error.message)
      return
    }

    getOrders()
  }

  const deleteOrder = async (orderId) => {
    const confirmDelete = window.confirm('هل تريد حذف هذا الطلب؟')

    if (!confirmDelete) return

    const { error } = await supabase.from('orders').delete().eq('id', orderId)

    if (error) {
      alert(error.message)
      return
    }

    getOrders()
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

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('en-US')
  }

  const normalizePhoneForWhatsApp = (phone) => {
    if (!phone) return ''

    let digits = phone.replace(/\D/g, '')

    if (digits.startsWith('00')) {
      digits = digits.slice(2)
    }

    if (digits.startsWith('0')) {
      digits = `20${digits.slice(1)}`
    }

    if (!digits.startsWith('20') && digits.length === 10) {
      digits = `20${digits}`
    }

    return digits
  }

  const getWhatsAppMessage = (order) => {
    return encodeURIComponent(
      `مرحبًا ${order.customer_name}
تم استلام طلبك رقم: ${order.order_number || order.id}

إجمالي الطلب: ${formatMoney(order.total_amount)} جنيه
طريقة الدفع: ${translatePaymentMethod(order.payment_method)}
حالة الطلب الحالية: ${translateOrderStatus(order.status)}

سنقوم بالتواصل معك لتأكيد تفاصيل الطلب.`
    )
  }

  const getOrderCopyText = (order) => {
    const itemsText =
      order.order_items
        ?.map(
          (item, index) =>
            `${index + 1}. ${item.product_title}
الكمية: ${item.quantity}
سعر القطعة: ${formatMoney(item.unit_price)} جنيه
الإجمالي: ${formatMoney(item.line_total)} جنيه`
        )
        .join('\n\n') || '-'

    return `الطلب: ${order.order_number || order.id}
التاريخ: ${formatDate(order.created_at)}

بيانات العميل:
الاسم: ${order.customer_name}
الهاتف: ${order.customer_phone}
البريد الإلكتروني: ${order.customer_email || '-'}
المدينة / المنطقة: ${order.customer_city || '-'}
العنوان: ${order.customer_address}
الملاحظات: ${order.customer_notes || '-'}

المنتجات:
${itemsText}

إجمالي المنتجات: ${formatMoney(order.subtotal)} جنيه
الشحن: ${formatMoney(order.shipping_fee)} جنيه
الخصم: ${formatMoney(order.discount_amount)} جنيه
الإجمالي: ${formatMoney(order.total_amount)} جنيه

حالة الطلب: ${translateOrderStatus(order.status)}
حالة الدفع: ${translatePaymentStatus(order.payment_status)}
طريقة الدفع: ${translatePaymentMethod(order.payment_method)}`
  }

  const copyOrder = async (order) => {
    try {
      await navigator.clipboard.writeText(getOrderCopyText(order))
      setCopiedOrderId(order.id)

      setTimeout(() => {
        setCopiedOrderId(null)
      }, 1500)
    } catch {
      alert('تعذر نسخ بيانات الطلب')
    }
  }

  const escapeHtml = (value) => {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  const printInvoice = (order) => {
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('من فضلك اسمح بفتح النوافذ المنبثقة لطباعة الفاتورة')
      return
    }

    const itemsRows =
      order.order_items
        ?.map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.product_title)}</td>
              <td>${escapeHtml(item.quantity)}</td>
              <td>${formatMoney(item.unit_price)} جنيه</td>
              <td>${formatMoney(item.line_total)} جنيه</td>
            </tr>
          `
        )
        .join('') || ''

    printWindow.document.write(`
      <!doctype html>
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة - ${escapeHtml(order.order_number || order.id)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #0f172a;
              direction: rtl;
              text-align: right;
            }

            .invoice {
              max-width: 800px;
              margin: 0 auto;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 24px;
              gap: 24px;
            }

            h1 {
              margin: 0;
              font-size: 30px;
            }

            h2 {
              margin-top: 28px;
              font-size: 18px;
            }

            p {
              margin: 6px 0;
              line-height: 1.6;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }

            th, td {
              border: 1px solid #e2e8f0;
              padding: 10px;
              text-align: right;
            }

            th {
              background: #f1f5f9;
            }

            .totals {
              margin-top: 24px;
              margin-right: auto;
              width: 320px;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #e2e8f0;
              padding: 8px 0;
              gap: 20px;
            }

            .grand-total {
              font-size: 20px;
              font-weight: bold;
            }

            .footer {
              margin-top: 36px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 13px;
            }

            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="invoice">
            <div class="header">
              <div>
                <h1>فاتورة الطلب</h1>
                <p><strong>رقم الطلب:</strong> ${escapeHtml(order.order_number || order.id)}</p>
                <p><strong>التاريخ:</strong> ${escapeHtml(formatDate(order.created_at))}</p>
              </div>

              <div>
                <p><strong>حالة الطلب:</strong> ${escapeHtml(translateOrderStatus(order.status))}</p>
                <p><strong>حالة الدفع:</strong> ${escapeHtml(translatePaymentStatus(order.payment_status))}</p>
                <p><strong>طريقة الدفع:</strong> ${escapeHtml(translatePaymentMethod(order.payment_method))}</p>
              </div>
            </div>

            <h2>بيانات العميل</h2>
            <p><strong>الاسم:</strong> ${escapeHtml(order.customer_name)}</p>
            <p><strong>الهاتف:</strong> ${escapeHtml(order.customer_phone)}</p>
            <p><strong>البريد الإلكتروني:</strong> ${escapeHtml(order.customer_email || '-')}</p>
            <p><strong>المدينة / المنطقة:</strong> ${escapeHtml(order.customer_city || '-')}</p>
            <p><strong>العنوان:</strong> ${escapeHtml(order.customer_address)}</p>
            <p><strong>ملاحظات:</strong> ${escapeHtml(order.customer_notes || '-')}</p>

            <h2>منتجات الطلب</h2>
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>سعر القطعة</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>إجمالي المنتجات</span>
                <strong>${formatMoney(order.subtotal)} جنيه</strong>
              </div>

              <div class="total-row">
                <span>الشحن</span>
                <strong>${formatMoney(order.shipping_fee)} جنيه</strong>
              </div>

              <div class="total-row">
                <span>الخصم</span>
                <strong>${formatMoney(order.discount_amount)} جنيه</strong>
              </div>

              <div class="total-row grand-total">
                <span>الإجمالي</span>
                <strong>${formatMoney(order.total_amount)} جنيه</strong>
              </div>
            </div>

            <div class="footer">
              <p>شكرا لطلبك من Town Tech.</p>
            </div>
          </div>

          <script>
            window.print()
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  const getOrderStatusClass = (status) => {
    if (status === 'new') return 'bg-blue-50 text-blue-700'
    if (status === 'confirmed') return 'bg-indigo-50 text-indigo-700'
    if (status === 'processing') return 'bg-orange-50 text-orange-700'
    if (status === 'shipped') return 'bg-purple-50 text-purple-700'
    if (status === 'delivered') return 'bg-green-50 text-green-700'
    if (status === 'cancelled') return 'bg-red-50 text-red-700'

    return 'bg-slate-100 text-slate-700'
  }

  const getPaymentStatusClass = (status) => {
    if (status === 'paid') return 'bg-green-50 text-green-700'
    if (status === 'pending') return 'bg-yellow-50 text-yellow-700'
    if (status === 'failed') return 'bg-red-50 text-red-700'
    if (status === 'refunded') return 'bg-slate-100 text-slate-700'

    return 'bg-slate-100 text-slate-700'
  }

  const filtersActive =
    searchTerm ||
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    dateFilter !== 'all'

  const OrderDetails = ({ order }) => {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div>
          <h3 className="font-black text-slate-950 mb-3">
            بيانات العميل
          </h3>

          <div className="space-y-2 text-sm bg-white border border-slate-200 rounded-2xl p-4">
            <p>
              <strong>الاسم:</strong> {order.customer_name}
            </p>

            <p>
              <strong>الهاتف:</strong> {order.customer_phone}
            </p>

            <p>
              <strong>البريد:</strong> {order.customer_email || '-'}
            </p>

            <p>
              <strong>المدينة:</strong> {order.customer_city || '-'}
            </p>

            <p className="leading-7">
              <strong>العنوان:</strong> {order.customer_address}
            </p>

            <p className="leading-7">
              <strong>الملاحظات:</strong> {order.customer_notes || '-'}
            </p>
          </div>

          <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-4">
            <h4 className="font-black text-slate-950 mb-3">
              إجماليات الطلب
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 font-bold">إجمالي المنتجات</span>
                <strong>{formatMoney(order.subtotal)} جنيه</strong>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 font-bold">الشحن</span>
                <strong>{formatMoney(order.shipping_fee)} جنيه</strong>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 font-bold">الخصم</span>
                <strong>{formatMoney(order.discount_amount)} جنيه</strong>
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-3 mt-3">
                <span className="text-slate-950 font-black">الإجمالي</span>
                <strong className="text-lg">{formatMoney(order.total_amount)} جنيه</strong>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-950 mb-3">
            منتجات الطلب
          </h3>

          <div className="space-y-3">
            {order.order_items?.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-3 flex gap-3"
              >
                {item.product_image_url ? (
                  <img
                    src={item.product_image_url}
                    alt={item.product_title}
                    className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-950 line-clamp-2">
                    {item.product_title}
                  </div>

                  {item.product_sku && (
                    <div className="text-xs text-slate-400 font-bold mt-1">
                      SKU: {item.product_sku}
                    </div>
                  )}

                  <div className="text-sm text-slate-500 font-bold mt-1">
                    الكمية: {item.quantity} × {formatMoney(item.unit_price)} جنيه
                  </div>

                  <div className="font-black text-slate-950 mt-1">
                    {formatMoney(item.line_total)} جنيه
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const OrderActions = ({ order }) => {
    const whatsappPhone = normalizePhoneForWhatsApp(order.customer_phone)

    const whatsappUrl = whatsappPhone
      ? `https://wa.me/${whatsappPhone}?text=${getWhatsAppMessage(order)}`
      : '#'

    return (
      <div className="flex flex-wrap gap-1 max-w-[220px]">
        <a
          href={`tel:${order.customer_phone}`}
          className={`${adminActionBtn} bg-slate-100 text-slate-700 hover:bg-slate-200`}
          title="اتصال"
        >
          📞
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className={`${adminActionBtn} bg-green-50 text-green-700 hover:bg-green-100`}
          title="واتساب"
        >
          واتس
        </a>

        <button
          type="button"
          onClick={() =>
            setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
          }
          className={`${adminActionBtn} bg-blue-50 text-blue-700 hover:bg-blue-100`}
        >
          {expandedOrderId === order.id ? '▲' : '▼'}
        </button>

        <button
          type="button"
          onClick={() => copyOrder(order)}
          className={`${adminActionBtn} bg-slate-100 text-slate-700 hover:bg-slate-200`}
        >
          {copiedOrderId === order.id ? '✓' : 'نسخ'}
        </button>

        <button
          type="button"
          onClick={() => printInvoice(order)}
          className={`${adminActionBtn} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
        >
          طباعة
        </button>

        <button
          type="button"
          onClick={() => deleteOrder(order.id)}
          className={`${adminActionBtn} bg-red-50 text-red-600 hover:bg-red-100`}
        >
          حذف
        </button>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-slate-500 mt-2 font-bold">
            إدارة طلبات العملاء وحالات الدفع
          </p>
        </div>

        <button
          type="button"
          onClick={getOrders}
          className="w-full md:w-auto bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition"
        >
          تحديث الطلبات
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-sm text-slate-500 font-bold">إجمالي الطلبات</p>

          <h3 className="text-3xl font-black text-slate-950 mt-2">
            {totalOrders}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-sm text-slate-500 font-bold">طلبات الصفحة</p>

          <h3 className="text-3xl font-black text-slate-950 mt-2">
            {orders.length}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-sm text-slate-500 font-bold">طرق الدفع</p>

          <h3 className="text-lg font-black text-slate-950 mt-3">
            متعددة
          </h3>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6">
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث برقم الطلب أو اسم العميل أو الهاتف أو البريد..."
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
            />
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex gap-3">
            <button
              type="button"
              onClick={handleSearch}
              className="bg-slate-950 text-white px-5 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
            >
              بحث
            </button>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
            >
              <option value="all">كل التواريخ</option>
              <option value="today">اليوم</option>
              <option value="last_7_days">آخر 7 أيام</option>
              <option value="this_month">هذا الشهر</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
            >
              <option value="all">كل حالات الطلب</option>

              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {translateOrderStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-right"
            >
              <option value="all">كل حالات الدفع</option>

              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {translatePaymentStatus(status)}
                </option>
              ))}
            </select>

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl font-black hover:bg-red-100 transition"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-3 font-bold">
          الفلتر الحالي: {translateDateFilter(dateFilter)}
          {statusFilter !== 'all' && ` • ${translateOrderStatus(statusFilter)}`}
          {paymentFilter !== 'all' && ` • ${translatePaymentStatus(paymentFilter)}`}
          {searchTerm && ` • بحث: ${searchTerm}`}
        </p>
      </section>

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-6 font-bold">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 bg-slate-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-4xl mb-4">
            🧾
          </div>

          <h3 className="text-2xl font-black text-slate-950">
            لا توجد طلبات
          </h3>

          <p className="text-slate-500 mt-2 font-bold">
            لا توجد طلبات مطابقة للفلاتر الحالية.
          </p>
        </div>
      ) : (
        <>
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-200">
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                قائمة الطلبات
              </h2>

              <p className="text-slate-500 mt-1 font-bold text-sm">
                عرض وتعديل حالة الطلب والدفع وبيانات العميل
              </p>
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right min-w-[1350px]">
                <thead className="bg-slate-50 text-slate-600 text-xs font-black">
                  <tr>
                    <th className="px-3 py-2.5 text-right">الطلب</th>
                    <th className="px-3 py-2.5 text-right">العميل</th>
                    <th className="px-3 py-2.5 text-right">الهاتف</th>
                    <th className="px-3 py-2.5 text-right">الإجمالي</th>
                    <th className="px-3 py-2.5 text-right">حالة الطلب</th>
                    <th className="px-3 py-2.5 text-right">الدفع</th>
                    <th className="px-3 py-2.5 text-right">التاريخ</th>
                    <th className="px-3 py-2.5 text-right">إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <Fragment key={order.id}>
                      <tr className="border-t border-slate-100 hover:bg-slate-50/80 transition">
                        <td className="px-3 py-2.5">
                          <div className="font-black text-slate-950 break-all">
                            {order.order_number || order.id}
                          </div>

                          <div className="text-xs text-slate-500 mt-1 font-bold">
                            {order.order_items?.length || 0} منتج
                          </div>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="font-black text-slate-950">
                            {order.customer_name}
                          </div>

                          {order.customer_email && (
                            <div className="text-xs text-slate-500 mt-1 font-bold break-all">
                              {order.customer_email}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="font-black text-slate-900" dir="ltr">
                            {order.customer_phone}
                          </div>
                        </td>

                        <td className="p-4 font-black text-slate-950">
                          {formatMoney(order.total_amount)} جنيه
                        </td>

                        <td className="px-3 py-2.5">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatus(order.id, e.target.value)
                            }
                            className={`border border-slate-300 rounded-xl px-3 py-2 font-black outline-none ${getOrderStatusClass(order.status)}`}
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {translateOrderStatus(status)}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-2.5">
                          <select
                            value={order.payment_status}
                            onChange={(e) =>
                              updatePaymentStatus(order.id, e.target.value)
                            }
                            className={`border border-slate-300 rounded-xl px-3 py-2 font-black outline-none ${getPaymentStatusClass(order.payment_status)}`}
                          >
                            {paymentStatuses.map((status) => (
                              <option key={status} value={status}>
                                {translatePaymentStatus(status)}
                              </option>
                            ))}
                          </select>

                          <div className="text-xs text-slate-500 mt-1 font-bold">
                            {translatePaymentMethod(order.payment_method)}
                          </div>
                        </td>

                        <td className="p-4 text-slate-600 font-bold">
                          {formatDate(order.created_at)}
                        </td>

                        <td className="px-3 py-2.5">
                          <OrderActions order={order} />
                        </td>
                      </tr>

                      {expandedOrderId === order.id && (
                        <tr className="bg-slate-50">
                          <td colSpan="8" className="p-5">
                            <OrderDetails order={order} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden p-3 space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-950 break-all">
                        {order.order_number || order.id}
                      </h3>

                      <p className="text-slate-500 text-sm font-bold mt-1">
                        {formatDate(order.created_at)}
                      </p>

                      <p className="text-slate-500 text-sm font-bold mt-1">
                        {order.order_items?.length || 0} منتج
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="font-black text-slate-950">
                        {formatMoney(order.total_amount)} جنيه
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-slate-500 text-xs font-bold">العميل</p>
                      <p className="text-slate-950 font-black mt-1">
                        {order.customer_name}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-slate-500 text-xs font-bold">الهاتف</p>
                      <p className="text-slate-950 font-black mt-1" dir="ltr">
                        {order.customer_phone}
                      </p>
                    </div>
                  </div>

                  {order.customer_email && (
                    <div className="mt-3 bg-slate-50 rounded-2xl p-3">
                      <p className="text-slate-500 text-xs font-bold">البريد</p>
                      <p className="text-slate-950 font-black mt-1 break-all">
                        {order.customer_email}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-700">
                        حالة الطلب
                      </label>

                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(order.id, e.target.value)
                        }
                        className={`w-full border border-slate-300 rounded-2xl px-4 py-3 font-black outline-none ${getOrderStatusClass(order.status)}`}
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {translateOrderStatus(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-700">
                        حالة الدفع
                      </label>

                      <select
                        value={order.payment_status}
                        onChange={(e) =>
                          updatePaymentStatus(order.id, e.target.value)
                        }
                        className={`w-full border border-slate-300 rounded-2xl px-4 py-3 font-black outline-none ${getPaymentStatusClass(order.payment_status)}`}
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {translatePaymentStatus(status)}
                          </option>
                        ))}
                      </select>

                      <p className="text-xs text-slate-500 mt-1 font-bold">
                        {translatePaymentMethod(order.payment_method)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <OrderActions order={order} />
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <OrderDetails order={order} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalOrders}
              pageSize={ORDERS_PER_PAGE}
              itemLabel="طلب"
            />
          </section>
        </>
      )}
    </div>
  )
}