import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useSiteSettings from '../hooks/useSiteSettings'
import {
  clearCart,
  clearCheckoutOrderNotes,
  getCartItems,
  getCartTotal,
  getCheckoutOrderNotes,
  savePendingPaymentOrder,
  saveRecentPlacedOrder,
} from '../lib/cart'
import { saveCustomerOrder } from '../lib/customerOrders'
import { parsePlacedOrderResult } from '../lib/orderTracking'

export default function Checkout() {
  const navigate = useNavigate()
  const { settings: siteSettings } = useSiteSettings()

  const [items, setItems] = useState([])

  const [shippingFee, setShippingFee] = useState(0)
  const [enableFreeShipping, setEnableFreeShipping] = useState(false)
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState(0)

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponMessage, setCouponMessage] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerCity, setCustomerCity] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const getShippingSettings = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('shipping_fee, enable_free_shipping, free_shipping_min_amount')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(error)
      return
    }

    if (data) {
      setShippingFee(Number(data.shipping_fee || 0))
      setEnableFreeShipping(data.enable_free_shipping || false)
      setFreeShippingMinAmount(Number(data.free_shipping_min_amount || 0))
    }
  }

  useEffect(() => {
    const cartItems = getCartItems()
    setItems(cartItems)

    if (cartItems.length === 0) {
      navigate('/cart')
    }

    getShippingSettings()

    const savedNotes = getCheckoutOrderNotes()
    if (savedNotes) {
      setCustomerNotes(savedNotes)
    }
  }, [navigate])

  const subtotal = getCartTotal()

  const freeShippingApplied =
    enableFreeShipping &&
    freeShippingMinAmount > 0 &&
    subtotal >= freeShippingMinAmount

  const finalShippingFee = freeShippingApplied ? 0 : shippingFee

  const couponDiscount = Number(appliedCoupon?.discount_amount || 0)

  const totalAfterDiscount = Math.max(subtotal - couponDiscount, 0)

  const totalAmount = totalAfterDiscount + finalShippingFee

  const remainingForFreeShipping =
    enableFreeShipping && freeShippingMinAmount > subtotal
      ? freeShippingMinAmount - subtotal
      : 0

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString('en-US')
  }

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash_on_delivery: 'الدفع عند الاستلام',
      paymob: 'فيزا/بطاقات إلكترونية',
      vodafone_cash: 'فودافون كاش',
      instapay: 'إنستا باي',
    }

    return labels[method] || 'الدفع عند الاستلام'
  }

  const isPaymobReady =
    siteSettings.paymob_enabled &&
    siteSettings.paymob_integration_id &&
    siteSettings.paymob_iframe_id

  const onSitePaymentMethods = ['paymob', 'vodafone_cash', 'instapay']

  const applyCoupon = async () => {
    setCouponMessage('')
    setAppliedCoupon(null)
    setApplyingCoupon(true)

    if (!couponCode.trim()) {
      setCouponMessage('من فضلك اكتب كود الخصم أولا.')
      setApplyingCoupon(false)
      return
    }

    const { data, error } = await supabase.rpc('validate_coupon', {
      p_coupon_code: couponCode.trim(),
      p_subtotal: subtotal,
    })

    if (error) {
      setCouponMessage(error.message)
      setApplyingCoupon(false)
      return
    }

    const result = Array.isArray(data) ? data[0] : data

    if (!result || !result.is_valid) {
      setCouponMessage(result?.message || 'كود الخصم غير صحيح.')
      setApplyingCoupon(false)
      return
    }

    setAppliedCoupon(result)
    setCouponCode(result.code)
    setCouponMessage(result.message || 'تم تطبيق كود الخصم بنجاح.')
    setApplyingCoupon(false)
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponMessage('')
  }

  const placeGuestOrder = async (payload) => {
    const { data, error } = await supabase.rpc('place_guest_order', payload)

    if (
      error &&
      error.message?.includes('Could not find the function public.place_guest_order') &&
      payload.p_payment_method !== undefined
    ) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.p_payment_method

      return await supabase.rpc('place_guest_order', fallbackPayload)
    }

    return { data, error }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      const cartItems = getCartItems()

      if (cartItems.length === 0) {
        throw new Error('عربة التسوق فارغة.')
      }

      if (!customerName.trim()) {
        throw new Error('من فضلك اكتب الاسم بالكامل.')
      }

      if (!customerPhone.trim()) {
        throw new Error('من فضلك اكتب رقم الهاتف.')
      }

      if (!customerAddress.trim()) {
        throw new Error('من فضلك اكتب العنوان بالتفصيل.')
      }

      const cleanItems = cartItems.map((item) => ({
        id: item.id,
        quantity: Number(item.quantity || 1),
      }))

      const { data, error } = await placeGuestOrder({
        p_customer_name: customerName.trim(),
        p_customer_phone: customerPhone.trim(),
        p_customer_email: customerEmail.trim(),
        p_customer_address: customerAddress.trim(),
        p_customer_city: customerCity.trim(),
        p_customer_notes: customerNotes.trim(),
        p_items: cleanItems,
        p_coupon_code: appliedCoupon?.code || null,
        p_payment_method: paymentMethod,
      })

      if (error) {
        throw error
      }

      const { id: orderId, orderNumber } = parsePlacedOrderResult(data)

      if (!orderId) {
        throw new Error('تعذر إنشاء الطلب.')
      }

      saveRecentPlacedOrder({
        orderId,
        orderNumber,
        phone: customerPhone.trim(),
      })

      saveCustomerOrder({
        orderId,
        orderNumber,
        phone: customerPhone.trim(),
        totalAmount,
      })

      if (onSitePaymentMethods.includes(paymentMethod)) {
        savePendingPaymentOrder({
          orderId,
          orderNumber,
          phone: customerPhone.trim(),
          total: totalAmount,
          method: paymentMethod,
        })
        navigate(`/payment?order=${orderId}&method=${paymentMethod}`)
      } else {
        clearCart()
        clearCheckoutOrderNotes()
        navigate(
          `/order-success?order=${orderId}${orderNumber ? `&number=${encodeURIComponent(orderNumber)}` : ''}`
        )
      }
    } catch (error) {
      setErrorMessage(error.message || 'حدث خطأ أثناء إرسال الطلب.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-right">
          <h1 className="text-3xl font-black text-slate-900">
            إتمام الطلب
          </h1>

          <p className="text-slate-500 mt-1 font-bold">
            اكتب بياناتك لتأكيد الطلب واختيار طريقة الدفع المناسبة
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-6 font-bold text-right">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-black text-slate-900 mb-4">
                بيانات العميل
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-bold text-slate-700">
                    الاسم بالكامل *
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-slate-900 text-right"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-2 text-sm font-bold text-slate-700">
                    رقم الهاتف *
                  </label>

                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-slate-900 text-right"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  البريد الإلكتروني
                </label>

                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="اختياري"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-slate-900 text-right"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  العنوان بالتفصيل *
                </label>

                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-slate-900 min-h-28 text-right"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  المدينة / المنطقة
                </label>

                <input
                  type="text"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  placeholder="مثال: القاهرة - مدينة نصر"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-slate-900 text-right"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  ملاحظات على الطلب
                </label>

                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="اكتب أي ملاحظات خاصة بالطلب"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-slate-900 min-h-24 text-right"
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-5">
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  اختيار طريقة الدفع
                </h3>

                <div className="space-y-3">
                  {[
                    { id: 'cash_on_delivery', label: 'الدفع عند الاستلام' },
                    {
                      id: 'paymob',
                      label: 'بطاقة فيزا/ماستر عبر Paymob',
                      disabled: !isPaymobReady,
                      hint: !isPaymobReady
                        ? 'يتطلب تفعيل Paymob وإضافة Integration ID وIframe ID.'
                        : undefined,
                    },
                    {
                      id: 'vodafone_cash',
                      label: 'فودافون كاش',
                      disabled: !siteSettings.enable_vodafone_cash,
                      hint: !siteSettings.enable_vodafone_cash
                        ? 'تفعيل فودافون كاش في الإعدادات أولاً.'
                        : undefined,
                    },
                    {
                      id: 'instapay',
                      label: 'إنستا باي',
                      disabled: !siteSettings.enable_instapay,
                      hint: !siteSettings.enable_instapay
                        ? 'تفعيل إنستا باي في الإعدادات أولاً.'
                        : undefined,
                    },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-4 ${
                        option.disabled
                          ? 'border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.id}
                        checked={paymentMethod === option.id}
                        disabled={option.disabled}
                        onChange={() => setPaymentMethod(option.id)}
                        className="w-5 h-5"
                      />

                      <div>
                        <p className="font-black">{option.label}</p>
                        {option.hint && (
                          <p className="text-xs text-slate-500 font-bold mt-1">
                            {option.hint}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 h-fit">
              <h2 className="text-xl font-black text-slate-900 mb-4">
                ملخص الطلب
              </h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 border-b pb-3"
                  >
                    <div className="text-right">
                      <p className="font-black text-slate-900">
                        {item.title}
                      </p>

                      <p className="text-sm text-slate-500 font-bold">
                        الكمية: {item.quantity}
                      </p>
                    </div>

                    <strong className="text-slate-900 whitespace-nowrap">
                      {formatPrice(Number(item.price || 0) * item.quantity)} جنيه
                    </strong>
                  </div>
                ))}
              </div>

              <div className="border border-slate-200 rounded-xl p-3 mb-4">
                <label className="block mb-2 text-sm font-black text-slate-700">
                  كود الخصم
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    placeholder="اكتب كود الخصم"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-900 disabled:bg-slate-100 text-right"
                  />

                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-black hover:bg-red-100"
                    >
                      إزالة
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applyingCoupon}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg font-black hover:bg-slate-700 disabled:opacity-60"
                    >
                      {applyingCoupon ? '...' : 'تطبيق'}
                    </button>
                  )}
                </div>

                {couponMessage && (
                  <p
                    className={
                      appliedCoupon
                        ? 'text-sm text-green-600 font-bold mt-2'
                        : 'text-sm text-red-600 font-bold mt-2'
                    }
                  >
                    {couponMessage}
                  </p>
                )}
              </div>

              {enableFreeShipping && !freeShippingApplied && (
                <div className="bg-blue-50 text-blue-700 rounded-xl p-3 mb-4 text-sm font-bold">
                  أضف {formatPrice(remainingForFreeShipping)} جنيه للحصول على شحن مجاني.
                </div>
              )}

              {freeShippingApplied && (
                <div className="bg-green-50 text-green-700 rounded-xl p-3 mb-4 text-sm font-bold">
                  تم تطبيق الشحن المجاني.
                </div>
              )}

              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <span className="text-slate-500 font-bold">إجمالي المنتجات</span>
                <strong>{formatPrice(subtotal)} جنيه</strong>
              </div>

              {couponDiscount > 0 && (
                <div className="flex items-center justify-between border-b pb-3 mb-3 text-green-600">
                  <span className="font-bold">الخصم</span>
                  <strong>-{formatPrice(couponDiscount)} جنيه</strong>
                </div>
              )}

              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <span className="text-slate-500 font-bold">الشحن</span>
                <strong>
                  {finalShippingFee === 0
                    ? 'مجاني'
                    : `${formatPrice(finalShippingFee)} جنيه`}
                </strong>
              </div>

              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <span className="text-slate-500 font-bold">طريقة الدفع</span>
                <strong>{getPaymentMethodLabel(paymentMethod)}</strong>
              </div>

              <div className="flex items-center justify-between text-lg mb-6">
                <span className="font-black">الإجمالي</span>
                <strong>{formatPrice(totalAmount)} جنيه</strong>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-black hover:bg-slate-700 disabled:opacity-60"
              >
                {loading ? 'جاري إرسال الطلب...' : 'تأكيد الطلب'}
              </button>

              <Link
                to="/cart"
                className="block text-center mt-3 text-blue-600 font-black hover:underline"
              >
                الرجوع لعربة التسوق
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}