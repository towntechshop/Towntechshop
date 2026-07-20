import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminReports() {
  const [orders, setOrders] = useState([])
  const [dateFilter, setDateFilter] = useState('this_month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const getDateRange = () => {
    const now = new Date()

    if (dateFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      return { start, end }
    }

    if (dateFilter === 'last_7_days') {
      const start = new Date()
      start.setDate(now.getDate() - 6)
      start.setHours(0, 0, 0, 0)

      const end = new Date()
      end.setHours(23, 59, 59, 999)

      return { start, end }
    }

    if (dateFilter === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date()
      end.setHours(23, 59, 59, 999)

      return { start, end }
    }

    if (dateFilter === 'custom') {
      const start = customDateFrom
        ? new Date(`${customDateFrom}T00:00:00`)
        : null

      const end = customDateTo
        ? new Date(`${customDateTo}T23:59:59`)
        : null

      return { start, end }
    }

    return { start: null, end: null }
  }

  const getReports = async () => {
    setLoading(true)
    setErrorMessage('')

    const { start, end } = getDateRange()

    let query = supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        subtotal,
        shipping_fee,
        discount_amount,
        total_amount,
        status,
        payment_status,
        coupon_code,
        created_at,
        order_items (*)
      `
      )
      .order('created_at', { ascending: false })

    if (start) {
      query = query.gte('created_at', start.toISOString())
    }

    if (end) {
      query = query.lte('created_at', end.toISOString())
    }

    const { data, error } = await query

    if (error) {
      setErrorMessage(error.message)
      setOrders([])
    } else {
      setOrders(data || [])
      setLastUpdated(new Date())
    }

    setLoading(false)
  }

  useEffect(() => {
    getReports()
  }, [dateFilter])

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('en-US')
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

  const formatShortDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleDateString('ar-EG', {
      day: '2-digit',
      month: 'short',
    })
  }

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

  const getDateFilterLabel = () => {
    const labels = {
      today: 'اليوم',
      last_7_days: 'آخر 7 أيام',
      this_month: 'هذا الشهر',
      all: 'كل الوقت',
      custom: 'فترة مخصصة',
    }

    return labels[dateFilter] || '-'
  }

  const reports = useMemo(() => {
    const deliveredPaidOrders = orders.filter(
      (order) =>
        order.status === 'delivered' && order.payment_status === 'paid'
    )

    const cancelledOrders = orders.filter((order) => order.status === 'cancelled')
    const newOrders = orders.filter((order) => order.status === 'new')
    const processingOrders = orders.filter((order) => order.status === 'processing')
    const shippedOrders = orders.filter((order) => order.status === 'shipped')
    const deliveredOrders = orders.filter((order) => order.status === 'delivered')
    const pendingPaymentOrders = orders.filter(
      (order) => order.payment_status === 'pending'
    )

    const totalRevenue = deliveredPaidOrders.reduce(
      (total, order) => total + Number(order.total_amount || 0),
      0
    )

    const totalSubtotal = deliveredPaidOrders.reduce(
      (total, order) => total + Number(order.subtotal || 0),
      0
    )

    const totalShipping = deliveredPaidOrders.reduce(
      (total, order) => total + Number(order.shipping_fee || 0),
      0
    )

    const totalDiscounts = deliveredPaidOrders.reduce(
      (total, order) => total + Number(order.discount_amount || 0),
      0
    )

    const cancelledValue = cancelledOrders.reduce(
      (total, order) => total + Number(order.total_amount || 0),
      0
    )

    const averageOrderValue =
      deliveredPaidOrders.length > 0
        ? totalRevenue / deliveredPaidOrders.length
        : 0

    const productsMap = {}
    const customersMap = {}
    const dailyMap = {}

    deliveredPaidOrders.forEach((order) => {
      const orderDateKey = new Date(order.created_at).toISOString().slice(0, 10)

      if (!dailyMap[orderDateKey]) {
        dailyMap[orderDateKey] = {
          date: orderDateKey,
          orders: 0,
          revenue: 0,
        }
      }

      dailyMap[orderDateKey].orders += 1
      dailyMap[orderDateKey].revenue += Number(order.total_amount || 0)

      const customerKey = order.customer_phone?.replace(/\D/g, '') || order.id

      if (!customersMap[customerKey]) {
        customersMap[customerKey] = {
          key: customerKey,
          name: order.customer_name || 'بدون اسم',
          phone: order.customer_phone || '-',
          email: order.customer_email || '',
          orders: 0,
          revenue: 0,
          lastOrderDate: order.created_at,
        }
      }

      customersMap[customerKey].orders += 1
      customersMap[customerKey].revenue += Number(order.total_amount || 0)

      if (
        order.created_at &&
        new Date(order.created_at) > new Date(customersMap[customerKey].lastOrderDate)
      ) {
        customersMap[customerKey].lastOrderDate = order.created_at
      }

      order.order_items?.forEach((item) => {
        const productKey = item.product_id || item.product_title

        if (!productsMap[productKey]) {
          productsMap[productKey] = {
            key: productKey,
            title: item.product_title || 'منتج غير معروف',
            sku: item.product_sku || '',
            imageUrl: item.product_image_url || '',
            quantity: 0,
            revenue: 0,
          }
        }

        productsMap[productKey].quantity += Number(item.quantity || 0)
        productsMap[productKey].revenue += Number(item.line_total || 0)
      })
    })

    const topProducts = Object.values(productsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const topCustomers = Object.values(customersMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const dailySales = Object.values(dailyMap)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 14)

    const totalItemsSold = topProducts.reduce(
      (total, product) => total + Number(product.quantity || 0),
      0
    )

    const maxDailyRevenue =
      dailySales.length > 0
        ? Math.max(...dailySales.map((day) => day.revenue))
        : 0

    return {
      totalOrders: orders.length,
      deliveredPaidOrders: deliveredPaidOrders.length,
      totalRevenue,
      totalSubtotal,
      totalShipping,
      totalDiscounts,
      cancelledOrders: cancelledOrders.length,
      cancelledValue,
      newOrders: newOrders.length,
      processingOrders: processingOrders.length,
      shippedOrders: shippedOrders.length,
      deliveredOrders: deliveredOrders.length,
      pendingPaymentOrders: pendingPaymentOrders.length,
      averageOrderValue,
      totalItemsSold,
      topProducts,
      topCustomers,
      dailySales,
      maxDailyRevenue,
    }
  }, [orders])

  const escapeCsvValue = (value) => {
    const cleanValue = String(value ?? '').replaceAll('"', '""')
    return `"${cleanValue}"`
  }

  const exportCsv = () => {
    const headers = [
      'رقم الطلب',
      'اسم العميل',
      'الهاتف',
      'البريد الإلكتروني',
      'إجمالي المنتجات',
      'الشحن',
      'الخصم',
      'الإجمالي',
      'حالة الطلب',
      'حالة الدفع',
      'الكوبون',
      'التاريخ',
    ]

    const rows = orders.map((order) => [
      order.order_number || order.id,
      order.customer_name,
      order.customer_phone,
      order.customer_email || '',
      order.subtotal || 0,
      order.shipping_fee || 0,
      order.discount_amount || 0,
      order.total_amount || 0,
      translateOrderStatus(order.status),
      translatePaymentStatus(order.payment_status),
      order.coupon_code || '',
      formatDate(order.created_at),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\n')

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    setDateFilter('custom')

    setTimeout(() => {
      getReports()
    }, 0)
  }

  const DateFilterButton = ({ value, label }) => {
    const active = dateFilter === value

    return (
      <button
        type="button"
        onClick={() => setDateFilter(value)}
        className={
          active
            ? 'bg-slate-950 text-white px-4 py-3 rounded-2xl font-black'
            : 'bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl font-black hover:bg-slate-200 transition'
        }
      >
        {label}
      </button>
    )
  }

  const StatCard = ({ title, value, color = 'text-slate-950', dark = false, hint }) => {
    if (dark) {
      return (
        <div
          className="rounded-3xl shadow-sm p-5 md:p-6 text-white"
          style={{
            background:
              'linear-gradient(135deg, #07111F 0%, #0B1F3A 55%, #123D68 100%)',
          }}
        >
          <p className="text-white/70 text-sm font-bold">
            {title}
          </p>

          <h3 className="text-3xl md:text-4xl font-black mt-4">
            {value}
          </h3>

          {hint && (
            <p className="text-white/60 text-xs font-bold mt-2">
              {hint}
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
        <p className="text-slate-500 text-sm font-bold">
          {title}
        </p>

        <h3 className={`text-2xl md:text-4xl font-black mt-4 ${color}`}>
          {value}
        </h3>

        {hint && (
          <p className="text-slate-400 text-xs font-bold mt-2">
            {hint}
          </p>
        )}
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="text-slate-500 mt-2 font-bold">
            متابعة المبيعات والطلبات والمنتجات والعملاء والشحن والخصومات
          </p>

          <p className="text-sm text-slate-400 mt-2 font-bold">
            الفلتر الحالي: {getDateFilterLabel()}
          </p>

          {lastUpdated && (
            <p className="text-xs text-slate-400 mt-1 font-bold">
              آخر تحديث: {formatDate(lastUpdated)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full xl:w-auto">
          <button
            type="button"
            onClick={getReports}
            className="bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition"
          >
            تحديث البيانات
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={orders.length === 0}
            className="bg-slate-950 text-white px-5 py-3 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-50 transition"
          >
            تصدير CSV
          </button>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="grid grid-cols-2 sm:flex flex-wrap gap-3">
            <DateFilterButton value="today" label="اليوم" />
            <DateFilterButton value="last_7_days" label="آخر 7 أيام" />
            <DateFilterButton value="this_month" label="هذا الشهر" />
            <DateFilterButton value="all" label="كل الوقت" />
          </div>

          <form
            onSubmit={handleCustomSubmit}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:items-center"
          >
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
            />

            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950"
            />

            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black hover:bg-blue-700 transition"
            >
              تطبيق الفترة
            </button>
          </form>
        </div>
      </section>

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-6 font-bold">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="h-80 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
            <div className="h-80 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 mb-6">
            <StatCard
              dark
              title="إيراد الطلبات المسلمة والمدفوعة"
              value={`${formatMoney(reports.totalRevenue)} جنيه`}
            />

            <StatCard
              title="طلبات مسلمة ومدفوعة"
              value={reports.deliveredPaidOrders}
              color="text-green-600"
            />

            <StatCard
              title="متوسط قيمة الطلب"
              value={`${formatMoney(reports.averageOrderValue)} جنيه`}
              color="text-blue-600"
            />

            <StatCard
              title="إجمالي القطع المباعة"
              value={reports.totalItemsSold}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 mb-6">
            <StatCard
              title="إجمالي المنتجات المباعة"
              value={`${formatMoney(reports.totalSubtotal)} جنيه`}
            />

            <StatCard
              title="إجمالي الشحن المحصل"
              value={`${formatMoney(reports.totalShipping)} جنيه`}
              color="text-purple-600"
            />

            <StatCard
              title="إجمالي الخصومات"
              value={`${formatMoney(reports.totalDiscounts)} جنيه`}
              color="text-orange-600"
            />

            <StatCard
              title="قيمة الطلبات الملغية"
              value={`${formatMoney(reports.cancelledValue)} جنيه`}
              color="text-red-600"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6">
            <Link
              to="/admin/orders"
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition"
            >
              <p className="text-slate-500 text-sm font-bold">كل الطلبات</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-950 mt-3">
                {reports.totalOrders}
              </h3>
            </Link>

            <Link
              to="/admin/orders"
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition"
            >
              <p className="text-slate-500 text-sm font-bold">جديدة</p>
              <h3 className="text-2xl md:text-3xl font-black text-blue-600 mt-3">
                {reports.newOrders}
              </h3>
            </Link>

            <Link
              to="/admin/orders"
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition"
            >
              <p className="text-slate-500 text-sm font-bold">قيد التجهيز</p>
              <h3 className="text-2xl md:text-3xl font-black text-orange-600 mt-3">
                {reports.processingOrders}
              </h3>
            </Link>

            <Link
              to="/admin/orders"
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition"
            >
              <p className="text-slate-500 text-sm font-bold">تم الشحن</p>
              <h3 className="text-2xl md:text-3xl font-black text-purple-600 mt-3">
                {reports.shippedOrders}
              </h3>
            </Link>

            <Link
              to="/admin/orders"
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition"
            >
              <p className="text-slate-500 text-sm font-bold">ملغية</p>
              <h3 className="text-2xl md:text-3xl font-black text-red-600 mt-3">
                {reports.cancelledOrders}
              </h3>
            </Link>

            <Link
              to="/admin/orders"
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition"
            >
              <p className="text-slate-500 text-sm font-bold">دفع معلق</p>
              <h3 className="text-2xl md:text-3xl font-black text-yellow-600 mt-3">
                {reports.pendingPaymentOrders}
              </h3>
            </Link>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <div className="mb-5">
                <h2 className="text-xl md:text-2xl font-black text-slate-950">
                  أكثر المنتجات مبيعا
                </h2>

                <p className="text-slate-500 mt-1 font-bold text-sm">
                  محسوبة من الطلبات المسلمة والمدفوعة فقط
                </p>
              </div>

              {reports.topProducts.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-5 text-center">
                  <p className="text-slate-500 font-bold">
                    لا توجد مبيعات مسلمة ومدفوعة حتى الآن.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.topProducts.map((product, index) => (
                    <div
                      key={product.key}
                      className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-black flex-shrink-0">
                          {index + 1}
                        </div>

                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-14 h-14 object-contain rounded-2xl border border-slate-200 p-1 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-slate-100 rounded-2xl border border-slate-200 flex-shrink-0" />
                        )}

                        <div className="min-w-0">
                          <h3 className="font-black text-slate-950 line-clamp-2">
                            {product.title}
                          </h3>

                          {product.sku && (
                            <p className="text-xs text-slate-400 font-bold mt-1">
                              SKU: {product.sku}
                            </p>
                          )}

                          <p className="text-sm text-slate-500 font-bold mt-1">
                            الكمية المباعة: {product.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="font-black text-green-600 text-left whitespace-nowrap">
                        {formatMoney(product.revenue)} جنيه
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
              <div className="mb-5">
                <h2 className="text-xl md:text-2xl font-black text-slate-950">
                  أفضل العملاء
                </h2>

                <p className="text-slate-500 mt-1 font-bold text-sm">
                  العملاء الأعلى في قيمة الطلبات المسلمة والمدفوعة
                </p>
              </div>

              {reports.topCustomers.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-5 text-center">
                  <p className="text-slate-500 font-bold">
                    لا توجد بيانات عملاء مدفوعة حتى الآن.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.topCustomers.map((customer, index) => (
                    <div
                      key={customer.key}
                      className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-black flex-shrink-0">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-black text-slate-950">
                            {customer.name}
                          </h3>

                          <p className="text-sm text-slate-500 font-bold mt-1" dir="ltr">
                            {customer.phone}
                          </p>

                          <p className="text-xs text-slate-400 font-bold mt-1">
                            عدد الطلبات: {customer.orders} • آخر طلب: {formatShortDate(customer.lastOrderDate)}
                          </p>
                        </div>
                      </div>

                      <div className="font-black text-green-600 text-left whitespace-nowrap">
                        {formatMoney(customer.revenue)} جنيه
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 mb-6">
            <div className="mb-5">
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                المبيعات اليومية
              </h2>

              <p className="text-slate-500 mt-1 font-bold text-sm">
                آخر 14 يوم داخل الفترة المحددة
              </p>
            </div>

            {reports.dailySales.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-5 text-center">
                <p className="text-slate-500 font-bold">
                  لا توجد بيانات مبيعات يومية حتى الآن.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {reports.dailySales.map((day) => {
                  const width =
                    reports.maxDailyRevenue > 0
                      ? Math.max((day.revenue / reports.maxDailyRevenue) * 100, 5)
                      : 0

                  return (
                    <div key={day.date}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="font-black text-slate-950">
                          {formatShortDate(day.date)}
                        </div>

                        <div className="text-sm text-slate-500 font-bold">
                          {day.orders} طلب •{' '}
                          <strong className="text-slate-950">
                            {formatMoney(day.revenue)} جنيه
                          </strong>
                        </div>
                      </div>

                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-950 rounded-full"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}