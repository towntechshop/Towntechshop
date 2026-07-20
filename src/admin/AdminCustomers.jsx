import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const CUSTOMERS_PER_PAGE = 10

export default function AdminCustomers() {
  const [orders, setOrders] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCustomerKey, setExpandedCustomerKey] = useState(null)
  const [copiedCustomerKey, setCopiedCustomerKey] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const getOrders = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, order_number, customer_name, customer_phone, customer_email, customer_address, customer_city, customer_notes, total_amount, subtotal, shipping_fee, discount_amount, status, payment_status, created_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMessage(error.message)
      setOrders([])
    } else {
      setOrders(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    getOrders()
  }, [])

  const normalizePhone = (phone) => {
    if (!phone) return 'unknown'

    return phone.replace(/\D/g, '')
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

  const getStatusClass = (status) => {
    if (status === 'delivered') return 'bg-green-50 text-green-700'
    if (status === 'cancelled') return 'bg-red-50 text-red-700'
    if (status === 'processing') return 'bg-blue-50 text-blue-700'
    if (status === 'shipped') return 'bg-indigo-50 text-indigo-700'
    if (status === 'confirmed') return 'bg-amber-50 text-amber-700'
    return 'bg-slate-100 text-slate-700'
  }

  const getPaymentClass = (status) => {
    if (status === 'paid') return 'bg-green-50 text-green-700'
    if (status === 'failed') return 'bg-red-50 text-red-700'
    if (status === 'refunded') return 'bg-orange-50 text-orange-700'
    return 'bg-slate-100 text-slate-700'
  }

  const customers = useMemo(() => {
    const grouped = {}

    orders.forEach((order) => {
      const key = normalizePhone(order.customer_phone)

      if (!grouped[key]) {
        grouped[key] = {
          key,
          name: order.customer_name || 'بدون اسم',
          phone: order.customer_phone || '-',
          email: order.customer_email || '',
          city: order.customer_city || '',
          orders: [],
          addresses: [],
          totalOrders: 0,
          totalSpent: 0,
          deliveredPaidRevenue: 0,
          lastOrderDate: order.created_at,
        }
      }

      grouped[key].orders.push(order)
      grouped[key].totalOrders += 1
      grouped[key].totalSpent += Number(order.total_amount || 0)

      if (order.status === 'delivered' && order.payment_status === 'paid') {
        grouped[key].deliveredPaidRevenue += Number(order.total_amount || 0)
      }

      if (!grouped[key].email && order.customer_email) {
        grouped[key].email = order.customer_email
      }

      if (!grouped[key].city && order.customer_city) {
        grouped[key].city = order.customer_city
      }

      if (
        order.customer_address &&
        !grouped[key].addresses.includes(order.customer_address)
      ) {
        grouped[key].addresses.push(order.customer_address)
      }

      if (
        order.created_at &&
        new Date(order.created_at) > new Date(grouped[key].lastOrderDate)
      ) {
        grouped[key].lastOrderDate = order.created_at
      }
    })

    return Object.values(grouped).sort(
      (a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate)
    )
  }, [orders])

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers

    const keyword = searchTerm.trim().toLowerCase()

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(keyword) ||
        customer.phone.toLowerCase().includes(keyword) ||
        customer.email.toLowerCase().includes(keyword) ||
        customer.city.toLowerCase().includes(keyword)
      )
    })
  }, [customers, searchTerm])

  const totalPages =
    Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE) || 1

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * CUSTOMERS_PER_PAGE,
    currentPage * CUSTOMERS_PER_PAGE
  )

  const totalCustomers = customers.length
  const totalOrders = orders.length

  const totalRevenue = customers.reduce(
    (total, customer) => total + customer.totalSpent,
    0
  )

  const deliveredPaidRevenue = customers.reduce(
    (total, customer) => total + customer.deliveredPaidRevenue,
    0
  )

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    setSearchTerm(searchInput)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const getCustomerCopyText = (customer) => {
    const addressesText =
      customer.addresses.length > 0
        ? customer.addresses
            .map((address, index) => `${index + 1}. ${address}`)
            .join('\n')
        : '-'

    const ordersText =
      customer.orders
        .map(
          (order, index) =>
            `${index + 1}. ${order.order_number || order.id}
التاريخ: ${formatDate(order.created_at)}
الإجمالي: ${formatMoney(order.total_amount)} جنيه
حالة الطلب: ${translateOrderStatus(order.status)}
حالة الدفع: ${translatePaymentStatus(order.payment_status)}`
        )
        .join('\n\n') || '-'

    return `بيانات العميل:
الاسم: ${customer.name}
الهاتف: ${customer.phone}
البريد الإلكتروني: ${customer.email || '-'}
المدينة / المنطقة: ${customer.city || '-'}

الملخص:
عدد الطلبات: ${customer.totalOrders}
إجمالي قيمة الطلبات: ${formatMoney(customer.totalSpent)} جنيه
إيراد الطلبات المسلمة والمدفوعة: ${formatMoney(customer.deliveredPaidRevenue)} جنيه
آخر طلب: ${formatDate(customer.lastOrderDate)}

العناوين:
${addressesText}

الطلبات:
${ordersText}`
  }

  const copyCustomer = async (customer) => {
    try {
      await navigator.clipboard.writeText(getCustomerCopyText(customer))
      setCopiedCustomerKey(customer.key)

      setTimeout(() => {
        setCopiedCustomerKey(null)
      }, 1500)
    } catch {
      alert('تعذر نسخ بيانات العميل')
    }
  }

  const getWhatsAppMessage = (customer) => {
    return encodeURIComponent(
      `مرحبًا ${customer.name}
معك خدمة عملاء Town Tech بخصوص طلباتك السابقة.

عدد الطلبات: ${customer.totalOrders}
آخر طلب: ${formatDate(customer.lastOrderDate)}`
    )
  }

  const toggleExpandCustomer = (customerKey) => {
    setExpandedCustomerKey(
      expandedCustomerKey === customerKey ? null : customerKey
    )
  }

  if (loading) {
    return (
      <div dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-4xl font-black text-slate-950">
            العملاء
          </h1>

          <p className="text-slate-500 mt-2 font-bold">
            جاري تحميل بيانات العملاء...
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse"
            />
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-20 bg-slate-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-slate-500 mt-2 font-bold">
            يتم إنشاء قائمة العملاء تلقائيا من بيانات الطلبات
          </p>
        </div>

        <button
          type="button"
          onClick={getOrders}
          className="w-full md:w-auto bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition"
        >
          تحديث البيانات
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            إجمالي العملاء
          </p>

          <h3 className="text-2xl md:text-3xl font-black text-slate-950 mt-2">
            {totalCustomers}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            إجمالي الطلبات
          </p>

          <h3 className="text-2xl md:text-3xl font-black text-slate-950 mt-2">
            {totalOrders}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            قيمة كل الطلبات
          </p>

          <h3 className="text-xl md:text-2xl font-black text-blue-600 mt-3">
            {formatMoney(totalRevenue)} جنيه
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            المسلّم والمدفوع
          </p>

          <h3 className="text-xl md:text-2xl font-black text-green-600 mt-3">
            {formatMoney(deliveredPaidRevenue)} جنيه
          </h3>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث باسم العميل أو الهاتف أو البريد أو المدينة..."
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 text-right"
            />
          </form>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSearch}
              className="bg-slate-950 text-white px-5 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
            >
              بحث
            </button>

            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl font-black hover:bg-red-100 transition"
              >
                مسح البحث
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-3 font-bold">
          يتم عرض {paginatedCustomers.length} من أصل {filteredCustomers.length} عميل
        </p>
      </section>

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-6 font-bold">
          {errorMessage}
        </div>
      )}

      {paginatedCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-4xl mb-4">
            👥
          </div>

          <h3 className="text-2xl font-black text-slate-950">
            لا يوجد عملاء
          </h3>

          <p className="text-slate-500 mt-2 font-bold">
            العملاء سيظهرون هنا تلقائيا بعد إنشاء الطلبات.
          </p>
        </div>
      ) : (
        <>
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-200">
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                قائمة العملاء
              </h2>

              <p className="text-slate-500 mt-1 font-bold text-sm">
                بيانات العملاء مجمعة حسب رقم الهاتف
              </p>
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right min-w-[1150px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 font-black text-slate-700">العميل</th>
                    <th className="p-4 font-black text-slate-700">الهاتف</th>
                    <th className="p-4 font-black text-slate-700">البريد</th>
                    <th className="p-4 font-black text-slate-700">الطلبات</th>
                    <th className="p-4 font-black text-slate-700">إجمالي القيمة</th>
                    <th className="p-4 font-black text-slate-700">المسلّم والمدفوع</th>
                    <th className="p-4 font-black text-slate-700">آخر طلب</th>
                    <th className="p-4 font-black text-slate-700">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCustomers.map((customer) => {
                    const whatsappPhone = normalizePhoneForWhatsApp(customer.phone)

                    const whatsappUrl = whatsappPhone
                      ? `https://wa.me/${whatsappPhone}?text=${getWhatsAppMessage(customer)}`
                      : '#'

                    return (
                      <Fragment key={customer.key}>
                        <tr className="border-t border-slate-200 hover:bg-slate-50 transition">
                          <td className="p-4">
                            <div className="font-black text-slate-950">
                              {customer.name}
                            </div>

                            {customer.city && (
                              <div className="text-xs text-slate-500 mt-1 font-bold">
                                {customer.city}
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="font-black text-slate-900" dir="ltr">
                              {customer.phone}
                            </div>

                            <div className="flex gap-2 mt-2">
                              <a
                                href={`tel:${customer.phone}`}
                                className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-black hover:bg-slate-200"
                              >
                                اتصال
                              </a>

                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-black hover:bg-green-100"
                              >
                                واتساب
                              </a>
                            </div>
                          </td>

                          <td className="p-4 text-slate-600 font-bold">
                            {customer.email || '-'}
                          </td>

                          <td className="p-4">
                            <div className="text-2xl font-black text-slate-950">
                              {customer.totalOrders}
                            </div>
                          </td>

                          <td className="p-4 font-black text-blue-600">
                            {formatMoney(customer.totalSpent)} جنيه
                          </td>

                          <td className="p-4 font-black text-green-600">
                            {formatMoney(customer.deliveredPaidRevenue)} جنيه
                          </td>

                          <td className="p-4 text-slate-600 font-bold">
                            {formatDate(customer.lastOrderDate)}
                          </td>

                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => toggleExpandCustomer(customer.key)}
                                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-black hover:bg-blue-100 transition"
                              >
                                {expandedCustomerKey === customer.key
                                  ? 'إخفاء'
                                  : 'تفاصيل'}
                              </button>

                              <button
                                type="button"
                                onClick={() => copyCustomer(customer)}
                                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-black hover:bg-slate-200 transition"
                              >
                                {copiedCustomerKey === customer.key
                                  ? 'تم النسخ'
                                  : 'نسخ'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedCustomerKey === customer.key && (
                          <tr className="bg-slate-50">
                            <td colSpan="8" className="p-5">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div>
                                  <h3 className="font-black text-slate-950 mb-3">
                                    عناوين العميل
                                  </h3>

                                  {customer.addresses.length === 0 ? (
                                    <p className="text-sm text-slate-500 font-bold">
                                      لا توجد عناوين مسجلة.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {customer.addresses.map((address, index) => (
                                        <div
                                          key={index}
                                          className="bg-white border border-slate-200 rounded-2xl p-3 text-sm text-slate-700 font-bold leading-7"
                                        >
                                          {address}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h3 className="font-black text-slate-950 mb-3">
                                    طلبات العميل
                                  </h3>

                                  <div className="space-y-3">
                                    {customer.orders.map((order) => (
                                      <div
                                        key={order.id}
                                        className="bg-white border border-slate-200 rounded-2xl p-4"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <div className="font-black text-slate-950">
                                              {order.order_number || order.id}
                                            </div>

                                            <div className="text-xs text-slate-500 mt-1 font-bold">
                                              {formatDate(order.created_at)}
                                            </div>
                                          </div>

                                          <div className="text-left">
                                            <div className="font-black text-slate-950">
                                              {formatMoney(order.total_amount)} جنيه
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-2 justify-end">
                                              <span
                                                className={`text-xs px-2 py-1 rounded-full font-black ${getStatusClass(order.status)}`}
                                              >
                                                {translateOrderStatus(order.status)}
                                              </span>

                                              <span
                                                className={`text-xs px-2 py-1 rounded-full font-black ${getPaymentClass(order.payment_status)}`}
                                              >
                                                {translatePaymentStatus(order.payment_status)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden p-4 space-y-4">
              {paginatedCustomers.map((customer) => {
                const whatsappPhone = normalizePhoneForWhatsApp(customer.phone)

                const whatsappUrl = whatsappPhone
                  ? `https://wa.me/${whatsappPhone}?text=${getWhatsAppMessage(customer)}`
                  : '#'

                return (
                  <div
                    key={customer.key}
                    className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950 text-lg">
                          {customer.name}
                        </h3>

                        {customer.city && (
                          <p className="text-slate-500 text-sm font-bold mt-1">
                            {customer.city}
                          </p>
                        )}
                      </div>

                      <div className="bg-slate-100 text-slate-950 px-3 py-1.5 rounded-full text-xs font-black">
                        {customer.totalOrders} طلب
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-xs font-bold">الهاتف</p>
                        <p className="text-slate-950 font-black mt-1" dir="ltr">
                          {customer.phone}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-xs font-bold">آخر طلب</p>
                        <p className="text-slate-950 font-black mt-1 text-xs leading-5">
                          {formatDate(customer.lastOrderDate)}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-xs font-bold">إجمالي القيمة</p>
                        <p className="text-blue-600 font-black mt-1">
                          {formatMoney(customer.totalSpent)} جنيه
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-xs font-bold">المسلّم والمدفوع</p>
                        <p className="text-green-600 font-black mt-1">
                          {formatMoney(customer.deliveredPaidRevenue)} جنيه
                        </p>
                      </div>
                    </div>

                    {customer.email && (
                      <div className="mt-3 bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-xs font-bold">البريد الإلكتروني</p>
                        <p className="text-slate-950 font-black mt-1 break-all">
                          {customer.email}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <a
                        href={`tel:${customer.phone}`}
                        className="bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-black text-center hover:bg-slate-200 transition"
                      >
                        اتصال
                      </a>

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-50 text-green-700 px-4 py-3 rounded-xl font-black text-center hover:bg-green-100 transition"
                      >
                        واتساب
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <button
                        type="button"
                        onClick={() => toggleExpandCustomer(customer.key)}
                        className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl font-black hover:bg-blue-100 transition"
                      >
                        {expandedCustomerKey === customer.key ? 'إخفاء التفاصيل' : 'التفاصيل'}
                      </button>

                      <button
                        type="button"
                        onClick={() => copyCustomer(customer)}
                        className="bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-black hover:bg-slate-200 transition"
                      >
                        {copiedCustomerKey === customer.key ? 'تم النسخ' : 'نسخ'}
                      </button>
                    </div>

                    {expandedCustomerKey === customer.key && (
                      <div className="mt-4 border-t border-slate-200 pt-4 space-y-4">
                        <div>
                          <h4 className="font-black text-slate-950 mb-2">
                            العناوين
                          </h4>

                          {customer.addresses.length === 0 ? (
                            <p className="text-sm text-slate-500 font-bold">
                              لا توجد عناوين مسجلة.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {customer.addresses.map((address, index) => (
                                <div
                                  key={index}
                                  className="bg-slate-50 rounded-2xl p-3 text-sm text-slate-700 font-bold leading-7"
                                >
                                  {address}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-black text-slate-950 mb-2">
                            الطلبات
                          </h4>

                          <div className="space-y-3">
                            {customer.orders.map((order) => (
                              <div
                                key={order.id}
                                className="border border-slate-200 rounded-2xl p-3"
                              >
                                <div className="font-black text-slate-950 break-all">
                                  {order.order_number || order.id}
                                </div>

                                <p className="text-xs text-slate-500 mt-1 font-bold">
                                  {formatDate(order.created_at)}
                                </p>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <span className="font-black text-slate-950">
                                    {formatMoney(order.total_amount)} جنيه
                                  </span>

                                  <div className="flex flex-wrap gap-2 justify-end">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full font-black ${getStatusClass(order.status)}`}
                                    >
                                      {translateOrderStatus(order.status)}
                                    </span>

                                    <span
                                      className={`text-xs px-2 py-1 rounded-full font-black ${getPaymentClass(order.payment_status)}`}
                                    >
                                      {translatePaymentStatus(order.payment_status)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 mt-4">
              <p className="text-sm text-slate-500 font-bold text-center sm:text-right">
                صفحة {currentPage} من {totalPages}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-950 font-black hover:bg-slate-200 disabled:opacity-50 transition"
                >
                  السابق
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-5 py-3 rounded-2xl bg-slate-950 text-white font-black hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}