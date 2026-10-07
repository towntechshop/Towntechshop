import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useSiteSettings from '../hooks/useSiteSettings'
import { isPaymobConfigured } from '../lib/paymob'
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
import { BRAND_MARKS, PaymentIcon } from '../components/PaymentMethods'
import { trackBeginCheckout } from '../lib/analytics'

export default function Checkout() {
  const navigate = useNavigate()
  const { settings: siteSettings, features, loading: settingsLoading } = useSiteSettings()

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
  const [customerGovernorate, setCustomerGovernorate] = useState('')
  const [shippingZones, setShippingZones] = useState([])
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
    supabase
      .from('shipping_zones')
      .select('governorate, fee')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setShippingZones(data || []))
  }, [])

  useEffect(() => {
    const cartItems = getCartItems()
    setItems(cartItems)

    if (cartItems.length > 0) {
      trackBeginCheckout(
        cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0),
        cartItems.length
      )
    }

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

  const hasShippingZones = shippingZones.length > 0
  const selectedZone = shippingZones.find((zone) => zone.governorate === customerGovernorate)
  const zoneFee = selectedZone ? Number(selectedZone.fee || 0) : null

  const finalShippingFee = freeShippingApplied
    ? 0
    : hasShippingZones
      ? zoneFee ?? 0
      : shippingFee
  const shippingPending = hasShippingZones && !freeShippingApplied && !selectedZone

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

  const isPaymobReady = isPaymobConfigured(siteSettings)
  const paymobOptionDisabled = settingsLoading || !isPaymobReady

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

      if (hasShippingZones && !customerGovernorate) {
        throw new Error('من فضلك اختار المحافظة.')
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
        p_governorate: customerGovernorate || null,
      })

      if (error) {
        throw error
      }

      const { id: orderId, orderNumber: returnedNumber } = parsePlacedOrderResult(data)

      if (!orderId) {
        throw new Error('تعذر إنشاء الطلب.')
      }

      // الطلب بيرجع بالـ id بس، فبنجيب رقم الطلب عشان يتحفظ في (طلباتي)
      let orderNumber = returnedNumber
      if (!orderNumber) {
        const { data: numberData } = await supabase.rpc('get_guest_order_number', {
          p_order_id: orderId,
          p_phone: customerPhone.trim(),
        })
        orderNumber = typeof numberData === 'string' ? numberData : null
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  const paymentOptions = [
    {
      id: 'cash_on_delivery',
      label: 'الدفع عند الاستلام',
      description: 'ادفع كاش للمندوب لما الطلب يوصلك',
      icon: 'cash',
      available: true,
    },
    {
      id: 'paymob',
      label: 'بطاقة بنكية (فيزا / ماستركارد)',
      description: 'دفع آمن أونلاين من خلال Paymob',
      icon: 'card',
      available: !paymobOptionDisabled,
    },
    {
      id: 'vodafone_cash',
      label: 'فودافون كاش',
      description: 'حوّل المبلغ وابعت صورة التحويل على واتساب',
      icon: 'wallet',
      available: Boolean(siteSettings.enable_vodafone_cash),
    },
    {
      id: 'instapay',
      label: 'إنستا باي',
      description: 'حوّل المبلغ وابعت صورة التحويل على واتساب',
      icon: 'bank',
      available: Boolean(siteSettings.enable_instapay),
    },
  ].filter((option) => option.available)

  const inputClass =
    'w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition text-right placeholder:text-slate-400'

  const phoneDigits = customerPhone.replace(/\D/g, '')
  const phoneLooksInvalid =
    phoneDigits.length > 0 && !/^(01\d{9}|201\d{9})$/.test(phoneDigits)

  const itemsCount = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 pt-6 pb-28 lg:pb-12" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* خطوات الشراء */}
        <ol className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold mb-6" aria-label="خطوات الشراء">
          <li>
            <Link to="/cart" className="flex items-center gap-2 text-slate-500 hover:text-[#0B1F3A]">
              <span className="w-6 h-6 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-xs">✓</span>
              العربة
            </Link>
          </li>
          <li aria-hidden="true" className="w-6 sm:w-10 h-px bg-slate-300" />
          <li className="flex items-center gap-2 text-[#0B1F3A]" aria-current="step">
            <span className="w-6 h-6 rounded-full bg-[#D7262E] text-white flex items-center justify-center text-xs">2</span>
            البيانات والدفع
          </li>
          <li aria-hidden="true" className="w-6 sm:w-10 h-px bg-slate-300" />
          <li className="flex items-center gap-2 text-slate-400">
            <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs">3</span>
            تأكيد الطلب
          </li>
        </ol>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B1F3A]">إتمام الطلب</h1>
          <p className="text-slate-500 mt-1">
            اكتب بيانات التوصيل واختار طريقة الدفع. بنأكد معاك الطلب بالتليفون قبل الشحن.
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 font-bold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 lg:gap-6 items-start">
            <div className="space-y-5 min-w-0">
              {/* بيانات التوصيل */}
              <section className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-[#0B1F3A] mb-5">بيانات التوصيل</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-name" className="block mb-1.5 text-sm font-bold text-slate-700">
                      الاسم بالكامل <span className="text-[#D7262E]">*</span>
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      autoComplete="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" className="block mb-1.5 text-sm font-bold text-slate-700">
                      رقم الموبايل <span className="text-[#D7262E]">*</span>
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      placeholder="01xxxxxxxxx"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={`${inputClass} text-left ${phoneLooksInvalid ? 'border-amber-400' : ''}`}
                      required
                    />
                    {phoneLooksInvalid && (
                      <p className="text-xs text-amber-700 font-bold mt-1.5">
                        رقم الموبايل المصري 11 رقم ويبدأ بـ 01
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="checkout-address" className="block mb-1.5 text-sm font-bold text-slate-700">
                      العنوان بالتفصيل <span className="text-[#D7262E]">*</span>
                    </label>
                    <textarea
                      id="checkout-address"
                      autoComplete="street-address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="الشارع، رقم العمارة، الدور، علامة مميزة"
                      className={`${inputClass} min-h-24`}
                      required
                    />
                  </div>

                  {hasShippingZones && (
                    <div>
                      <label htmlFor="checkout-governorate" className="block mb-1.5 text-sm font-bold text-slate-700">
                        المحافظة <span className="text-[#D7262E]">*</span>
                      </label>
                      <select
                        id="checkout-governorate"
                        value={customerGovernorate}
                        onChange={(e) => setCustomerGovernorate(e.target.value)}
                        className={inputClass}
                        required
                      >
                        <option value="">اختار المحافظة</option>
                        {shippingZones.map((zone) => (
                          <option key={zone.governorate} value={zone.governorate}>
                            {zone.governorate}
                            {freeShippingApplied ? '' : ` — شحن ${formatPrice(zone.fee)} جنيه`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="checkout-city" className="block mb-1.5 text-sm font-bold text-slate-700">
                      {hasShippingZones ? 'المدينة / المنطقة' : 'المحافظة / المنطقة'}
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      autoComplete="address-level2"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder={hasShippingZones ? "مثال: مدينة نصر" : "مثال: القاهرة - مدينة نصر"}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-email" className="block mb-1.5 text-sm font-bold text-slate-700">
                      البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span>
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      autoComplete="email"
                      dir="ltr"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className={`${inputClass} text-left`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="checkout-notes" className="block mb-1.5 text-sm font-bold text-slate-700">
                      ملاحظات على الطلب <span className="text-slate-400 font-normal">(اختياري)</span>
                    </label>
                    <textarea
                      id="checkout-notes"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="مثلاً: محتاج تركيب، أو مواعيد مناسبة للتوصيل"
                      className={`${inputClass} min-h-20`}
                    />
                  </div>
                </div>
              </section>

              {/* طريقة الدفع */}
              <section className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-[#0B1F3A] mb-4">طريقة الدفع</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
                  {paymentOptions.map((option) => {
                    const selected = paymentMethod === option.id

                    return (
                      <label
                        key={option.id}
                        className={`relative flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 cursor-pointer transition ${
                          selected
                            ? 'border-[#0B1F3A] bg-[#0B1F3A]/[0.03]'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.id}
                          checked={selected}
                          onChange={() => setPaymentMethod(option.id)}
                          className="sr-only"
                        />
                        <span
                          className={`flex-shrink-0 min-w-10 h-10 px-0.5 rounded-lg flex items-center justify-center ${
                            selected ? 'bg-[#0B1F3A] text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {features.payment_logos?.[option.id] ? (
                            <img
                              src={features.payment_logos[option.id]}
                              alt=""
                              className="w-8 h-8 object-contain bg-white rounded"
                            />
                          ) : BRAND_MARKS[option.id] ? (
                            <span className="flex items-center gap-1 bg-white rounded-md px-1.5 py-1" dir="ltr">
                              {BRAND_MARKS[option.id].map((mark) => (
                                <img key={mark.src} src={mark.src} alt={mark.alt} className={`${mark.className} w-auto`} />
                              ))}
                            </span>
                          ) : (
                            <PaymentIcon name={option.icon} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-900 leading-6">{option.label}</span>
                          <span className="block text-xs text-slate-500 leading-5 mt-0.5">{option.description}</span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={`absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selected ? 'border-[#0B1F3A]' : 'border-slate-300'
                          }`}
                        >
                          {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#0B1F3A]" />}
                        </span>
                      </label>
                    )
                  })}
                </div>

                {settingsLoading && (
                  <p className="text-xs text-slate-500 mt-3">جاري تحميل طرق الدفع...</p>
                )}
              </section>
            </div>

            {/* ملخص الطلب */}
            <aside className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 lg:sticky lg:top-24 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold text-[#0B1F3A]">ملخص الطلب</h2>
                <Link to="/cart" className="text-sm font-bold text-sky-700 hover:underline">
                  تعديل ({itemsCount})
                </Link>
              </div>

              <ul className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="relative flex-shrink-0 w-14 h-14 rounded-lg border border-slate-200 bg-white overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-contain p-1" />
                      ) : null}
                      <span className="absolute -top-1.5 -left-1.5 min-w-5 h-5 px-1 rounded-full bg-[#0B1F3A] text-white text-[11px] font-bold flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </span>
                    <span className="flex-1 min-w-0 text-sm font-bold text-slate-800 leading-6 line-clamp-2">
                      {item.title}
                    </span>
                    <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {formatPrice(Number(item.price || 0) * item.quantity)} ج
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-slate-100 pt-4 mb-4">
                <label htmlFor="checkout-coupon" className="block mb-2 text-sm font-bold text-slate-700">
                  كود الخصم
                </label>
                <div className="flex gap-2">
                  <input
                    id="checkout-coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    placeholder="لو معاك كود اكتبه هنا"
                    className="flex-1 min-w-0 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-[#0B1F3A] disabled:bg-slate-100 text-right"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="flex-shrink-0 bg-red-50 text-red-700 px-4 rounded-xl font-bold hover:bg-red-100"
                    >
                      إزالة
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applyingCoupon}
                      className="flex-shrink-0 bg-slate-100 text-[#0B1F3A] px-4 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-60"
                    >
                      {applyingCoupon ? '...' : 'تطبيق'}
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <p className={`text-sm font-bold mt-2 ${appliedCoupon ? 'text-green-700' : 'text-red-600'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              {enableFreeShipping && !freeShippingApplied && remainingForFreeShipping > 0 && (
                <div className="bg-sky-50 text-sky-800 rounded-xl p-3 mb-4 text-sm font-bold">
                  باقي {formatPrice(remainingForFreeShipping)} جنيه وتاخد شحن مجاني
                </div>
              )}

              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">المنتجات</dt>
                  <dd className="font-bold text-slate-900">{formatPrice(subtotal)} جنيه</dd>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-700">
                    <dt>الخصم</dt>
                    <dd className="font-bold">-{formatPrice(couponDiscount)} جنيه</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">الشحن</dt>
                  <dd className={`font-bold ${!shippingPending && finalShippingFee === 0 ? 'text-green-700' : 'text-slate-900'}`}>
                    {shippingPending
                      ? 'اختار المحافظة'
                      : finalShippingFee === 0
                        ? 'مجاني'
                        : `${formatPrice(finalShippingFee)} جنيه`}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">طريقة الدفع</dt>
                  <dd className="font-bold text-slate-900">{getPaymentMethodLabel(paymentMethod)}</dd>
                </div>
              </dl>

              <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-4 mb-5">
                <span className="font-bold text-[#0B1F3A]">الإجمالي</span>
                <span className="text-2xl font-bold text-[#0B1F3A]">
                  {formatPrice(totalAmount)} <span className="text-sm text-slate-500">جنيه</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="hidden lg:block w-full bg-[#D7262E] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-[#bf1f27] disabled:opacity-60 transition"
              >
                {loading ? 'جاري إرسال الطلب...' : paymentMethod === 'paymob' ? 'متابعة للدفع' : 'تأكيد الطلب'}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                بياناتك محمية ومش بنشاركها مع حد
              </p>
            </aside>
          </div>

          {/* زرار التأكيد الثابت على الموبايل */}
          <div className="animate-slide-up lg:hidden fixed bottom-0 inset-x-0 z-[60] bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-between bg-[#D7262E] text-white px-5 py-3.5 rounded-xl font-bold hover:bg-[#bf1f27] disabled:opacity-60 transition"
            >
              <span>{loading ? 'جاري إرسال الطلب...' : paymentMethod === 'paymob' ? 'متابعة للدفع' : 'تأكيد الطلب'}</span>
              <span>{formatPrice(totalAmount)} جنيه</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

