import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LOW_STOCK_LIMIT = 3

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    totalProducts: 0,
    visibleProducts: 0,
    hiddenProducts: 0,
    featuredProducts: 0,
    pagesCount: 0,

    lowStockProducts: 0,
    outOfStockProducts: 0,

    totalOrders: 0,
    newOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,

    deliveredPaidOrders: 0,
    deliveredPaidRevenue: 0,
  })

  const [recentProducts, setRecentProducts] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [outOfStockProducts, setOutOfStockProducts] = useState([])

  const getDashboardData = async () => {
    setLoading(true)

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(
        'id, title, image_url, price, regular_price, sale_price, is_visible, is_featured, stock_quantity, is_in_stock, created_at'
      )
      .order('created_at', { ascending: false })

    const { count: pagesCount, error: pagesError } = await supabase
      .from('site_pages')
      .select('id', { count: 'exact', head: true })

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(
        'id, order_number, customer_name, customer_phone, total_amount, status, payment_status, created_at'
      )
      .order('created_at', { ascending: false })

    if (productsError) console.error(productsError)
    if (pagesError) console.error(pagesError)
    if (ordersError) console.error(ordersError)

    const safeProducts = products || []
    const safeOrders = orders || []

    const lowStockList = safeProducts.filter((product) => {
      const stockQty = Number(product.stock_quantity || 0)

      return (
        product.is_in_stock !== false &&
        stockQty > 0 &&
        stockQty <= LOW_STOCK_LIMIT
      )
    })

    const outOfStockList = safeProducts.filter(
      (product) => product.is_in_stock === false
    )

    const deliveredPaidOrders = safeOrders.filter(
      (order) =>
        order.status === 'delivered' && order.payment_status === 'paid'
    )

    const deliveredPaidRevenue = deliveredPaidOrders.reduce(
      (total, order) => total + Number(order.total_amount || 0),
      0
    )

    setStats({
      totalProducts: safeProducts.length,
      visibleProducts: safeProducts.filter((product) => product.is_visible)
        .length,
      hiddenProducts: safeProducts.filter((product) => !product.is_visible)
        .length,
      featuredProducts: safeProducts.filter((product) => product.is_featured)
        .length,
      pagesCount: pagesCount || 0,

      lowStockProducts: lowStockList.length,
      outOfStockProducts: outOfStockList.length,

      totalOrders: safeOrders.length,
      newOrders: safeOrders.filter((order) => order.status === 'new').length,
      processingOrders: safeOrders.filter(
        (order) => order.status === 'processing'
      ).length,
      deliveredOrders: safeOrders.filter(
        (order) => order.status === 'delivered'
      ).length,
      cancelledOrders: safeOrders.filter(
        (order) => order.status === 'cancelled'
      ).length,

      deliveredPaidOrders: deliveredPaidOrders.length,
      deliveredPaidRevenue,
    })

    setRecentProducts(safeProducts.slice(0, 5))
    setRecentOrders(safeOrders.slice(0, 5))
    setLowStockProducts(lowStockList.slice(0, 8))
    setOutOfStockProducts(outOfStockList.slice(0, 8))

    setLoading(false)
  }

  useEffect(() => {
    getDashboardData()
  }, [])

  const getProductPrice = (product) => {
    return product.sale_price || product.price || product.regular_price || 0
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

  const getOrderStatusClass = (status) => {
    if (status === 'delivered') return 'bg-green-50 text-green-700'
    if (status === 'cancelled') return 'bg-red-50 text-red-700'
    if (status === 'processing') return 'bg-blue-50 text-blue-700'
    if (status === 'shipped') return 'bg-indigo-50 text-indigo-700'
    if (status === 'confirmed') return 'bg-amber-50 text-amber-700'
    return 'bg-slate-100 text-slate-700'
  }

  const getPaymentStatusClass = (status) => {
    if (status === 'paid') return 'bg-green-50 text-green-700'
    if (status === 'failed') return 'bg-red-50 text-red-700'
    if (status === 'refunded') return 'bg-orange-50 text-orange-700'
    return 'bg-slate-100 text-slate-700'
  }

  const StatCard = ({ title, value, color = 'text-slate-950', to, hint }) => {
    const content = (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 hover:shadow-md transition h-full">
        <p className="text-xs md:text-sm text-slate-500 font-bold">
          {title}
        </p>

        <h3 className={`text-2xl md:text-4xl font-black mt-3 ${color}`}>
          {value}
        </h3>

        {hint && (
          <p className="text-xs text-slate-400 font-bold mt-2">
            {hint}
          </p>
        )}
      </div>
    )

    if (to) {
      return (
        <Link to={to} className="block h-full">
          {content}
        </Link>
      )
    }

    return content
  }

  const ProductRow = ({ product, type }) => {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
        <div className="flex items-center gap-3 min-w-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-14 h-14 md:w-16 md:h-16 object-contain rounded-2xl border border-slate-200 bg-white p-1"
            />
          ) : (
            <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
              صورة
            </div>
          )}

          <div className="min-w-0">
            <h3 className="font-black text-slate-950 text-sm md:text-base line-clamp-2">
              {product.title}
            </h3>

            {type === 'low' ? (
              <p className="text-sm text-orange-600 font-black mt-1">
                باقي {product.stock_quantity} فقط
              </p>
            ) : (
              <p className="text-sm text-red-600 font-black mt-1">
                غير متوفر
              </p>
            )}
          </div>
        </div>

        <Link
          to={`/admin/products/edit/${product.id}`}
          className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-black hover:bg-blue-100 transition whitespace-nowrap"
        >
          تعديل
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div dir="rtl">
        <div className="mb-6">
          <p className="text-slate-500 mt-2 font-bold">
            جاري تحميل بيانات الداشبورد...
          </p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-5 mb-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-28 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
          <div className="h-72 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-slate-500 mt-2 font-bold">
            نظرة سريعة على المنتجات والطلبات والمخزون وإيرادات الموقع
          </p>
        </div>

        <button
          type="button"
          onClick={getDashboardData}
          className="w-full md:w-auto bg-white border border-slate-200 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition"
        >
          تحديث البيانات
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-5 mb-6">
        <StatCard title="إجمالي المنتجات" value={stats.totalProducts} />
        <StatCard title="منتجات ظاهرة" value={stats.visibleProducts} />
        <StatCard title="منتجات مخفية" value={stats.hiddenProducts} />
        <StatCard
          title="مخزون قليل"
          value={stats.lowStockProducts}
          color="text-orange-600"
          to="/admin/products"
          hint={`من 1 إلى ${LOW_STOCK_LIMIT} قطع`}
        />
        <StatCard
          title="غير متوفر"
          value={stats.outOfStockProducts}
          color="text-red-600"
          to="/admin/products"
        />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-5 mb-6">
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders}
          to="/admin/orders"
        />
        <StatCard
          title="طلبات جديدة"
          value={stats.newOrders}
          color="text-blue-600"
          to="/admin/orders"
        />
        <StatCard
          title="قيد التجهيز"
          value={stats.processingOrders}
          color="text-orange-600"
          to="/admin/orders"
        />
        <StatCard
          title="تم التسليم"
          value={stats.deliveredOrders}
          color="text-green-600"
          to="/admin/orders"
        />
        <StatCard
          title="طلبات ملغية"
          value={stats.cancelledOrders}
          color="text-red-600"
          to="/admin/orders"
        />
      </div>

      <Link
        to="/admin/orders"
        className="block rounded-3xl shadow-sm p-5 md:p-7 mb-6 text-white hover:opacity-95 transition"
        style={{
          background:
            'linear-gradient(135deg, #07111F 0%, #0B1F3A 55%, #123D68 100%)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-white/70 text-sm md:text-lg font-bold">
              إيراد الطلبات المسلمة والمدفوعة
            </p>

            <h3 className="text-3xl md:text-5xl font-black mt-3">
              {formatMoney(stats.deliveredPaidRevenue)} جنيه
            </h3>
          </div>

          <div className="bg-white/10 rounded-3xl p-5 min-w-full lg:min-w-[240px]">
            <p className="text-white/70 font-bold">
              عدد الطلبات المسلمة والمدفوعة
            </p>

            <h4 className="text-3xl md:text-4xl font-black mt-2">
              {stats.deliveredPaidOrders}
            </h4>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                تنبيهات المخزون القليل
              </h2>

              <p className="text-slate-500 text-sm font-bold mt-1">
                منتجات أوشكت على النفاد
              </p>
            </div>

            <Link
              to="/admin/products"
              className="bg-slate-100 text-slate-950 px-4 py-2 rounded-xl font-black hover:bg-slate-200 transition whitespace-nowrap"
            >
              المنتجات
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-5 text-center">
              <p className="text-slate-500 font-bold">
                لا توجد منتجات بمخزون قليل حاليا.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <ProductRow key={product.id} product={product} type="low" />
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                منتجات غير متوفرة
              </h2>

              <p className="text-slate-500 text-sm font-bold mt-1">
                منتجات حالتها غير متوفرة في المخزون
              </p>
            </div>

            <Link
              to="/admin/products"
              className="bg-slate-100 text-slate-950 px-4 py-2 rounded-xl font-black hover:bg-slate-200 transition whitespace-nowrap"
            >
              المنتجات
            </Link>
          </div>

          {outOfStockProducts.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-5 text-center">
              <p className="text-slate-500 font-bold">
                لا توجد منتجات غير متوفرة حاليا.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {outOfStockProducts.map((product) => (
                <ProductRow key={product.id} product={product} type="out" />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5 mb-6">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-xl md:text-2xl font-black text-slate-950 mb-5">
            إجراءات سريعة
          </h2>

          <div className="space-y-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="block text-center bg-green-600 text-white py-4 rounded-2xl font-black hover:bg-green-700 transition"
            >
              عرض الموقع
            </a>

            <Link
              to="/admin/orders"
              className="block text-center bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition"
            >
              إدارة الطلبات
            </Link>

            <Link
              to="/admin/products/add"
              className="block text-center bg-slate-950 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition"
            >
              إضافة منتج
            </Link>

            <Link
              to="/admin/products"
              className="block text-center bg-slate-100 text-slate-950 py-4 rounded-2xl font-black hover:bg-slate-200 transition"
            >
              إدارة المنتجات
            </Link>

            <Link
              to="/admin/shipping-settings"
              className="block text-center bg-slate-100 text-slate-950 py-4 rounded-2xl font-black hover:bg-slate-200 transition"
            >
              إعدادات الشحن
            </Link>

            <Link
              to="/admin/site-settings"
              className="block text-center bg-slate-100 text-slate-950 py-4 rounded-2xl font-black hover:bg-slate-200 transition"
            >
              إعدادات الموقع
            </Link>

            <Link
              to="/admin/pages"
              className="block text-center bg-slate-100 text-slate-950 py-4 rounded-2xl font-black hover:bg-slate-200 transition"
            >
              الصفحات والسياسات
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950">
                أحدث الطلبات
              </h2>

              <p className="text-slate-500 text-sm font-bold mt-1">
                آخر الطلبات التي تم تسجيلها
              </p>
            </div>

            <Link
              to="/admin/orders"
              className="bg-slate-100 text-slate-950 px-4 py-2 rounded-xl font-black hover:bg-slate-200 transition whitespace-nowrap"
            >
              عرض الكل
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-5 text-center">
              <p className="text-slate-500 font-bold">
                لا توجد طلبات حتى الآن.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4 last:border-b-0 last:pb-0"
                >
                  <div>
                    <h3 className="font-black text-slate-950 break-all">
                      {order.order_number || order.id}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 font-bold">
                      {order.customer_name} • {order.customer_phone}
                    </p>

                    <p className="text-xs text-slate-400 mt-1 font-bold">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right md:text-left">
                    <p className="font-black text-slate-950">
                      {formatMoney(order.total_amount)} جنيه
                    </p>

                    <div className="flex flex-wrap md:justify-end gap-2 mt-2">
                      <span
                        className={`text-xs px-3 py-1.5 rounded-full font-black ${getOrderStatusClass(order.status)}`}
                      >
                        {translateOrderStatus(order.status)}
                      </span>

                      <span
                        className={`text-xs px-3 py-1.5 rounded-full font-black ${getPaymentStatusClass(order.payment_status)}`}
                      >
                        {translatePaymentStatus(order.payment_status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-950">
              أحدث المنتجات
            </h2>

            <p className="text-slate-500 text-sm font-bold mt-1">
              آخر المنتجات التي تم إضافتها
            </p>
          </div>

          <Link
            to="/admin/products"
            className="bg-slate-100 text-slate-950 px-4 py-2 rounded-xl font-black hover:bg-slate-200 transition whitespace-nowrap"
          >
            عرض الكل
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-5 text-center">
            <p className="text-slate-500 font-bold">
              لا توجد منتجات حتى الآن.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recentProducts.map((product) => (
              <div
                key={product.id}
                className="border border-slate-200 rounded-3xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-16 h-16 object-contain rounded-2xl border border-slate-200 bg-white p-1"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                      صورة
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-black text-slate-950 line-clamp-2">
                      {product.title}
                    </h3>

                    <p className="text-slate-500 text-sm font-bold mt-1">
                      {formatMoney(getProductPrice(product))} جنيه
                    </p>

                    <p className="text-xs text-slate-500 mt-1 font-bold">
                      المخزون: {product.stock_quantity ?? 0}
                    </p>
                  </div>
                </div>

                <div className="text-left flex-shrink-0">
                  <p
                    className={
                      product.is_visible
                        ? 'text-green-600 font-black text-sm'
                        : 'text-red-600 font-black text-sm'
                    }
                  >
                    {product.is_visible ? 'ظاهر' : 'مخفي'}
                  </p>

                  {product.is_featured && (
                    <p className="text-blue-600 font-black text-sm">
                      مميز
                    </p>
                  )}

                  <Link
                    to={`/admin/products/edit/${product.id}`}
                    className="inline-block mt-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-black hover:bg-blue-100 transition"
                  >
                    تعديل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}