import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useSiteSettings from '../hooks/useSiteSettings'
import {
  clearCart,
  clearCheckoutOrderNotes,
  clearPendingPaymentOrder,
  readPendingPaymentOrder,
} from '../lib/cart'
import { toWhatsAppHref } from '../lib/siteContent'

const MANUAL_PAYMENT_METHODS = ['vodafone_cash', 'instapay']

function formatPrice(value) {
  return Number(value || 0).toLocaleString('en-US')
}

function normalizePhoneForWhatsApp(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('20')) return digits
  if (digits.startsWith('0')) return `20${digits.slice(1)}`

  return digits
}

export default function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { settings: siteSettings } = useSiteSettings()

  const orderId = searchParams.get('order')
  const method = searchParams.get('method')

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')
  const [pendingOrder, setPendingOrder] = useState(null)

  const methodLabel = useMemo(() => {
    const labels = {
      paymob: 'فيزا/بطاقات إلكترونية',
      vodafone_cash: 'فودافون كاش',
      instapay: 'إنستا باي',
    }

    return labels[method] || 'طريقة دفع غير معروفة'
  }, [method])

  const isManualPayment = MANUAL_PAYMENT_METHODS.includes(method)

  useEffect(() => {
    const stored = readPendingPaymentOrder()

    if (stored?.orderId && stored.orderId === orderId) {
      setPendingOrder(stored)
    }
  }, [orderId])

  useEffect(() => {
    const createPaymentSession = async () => {
      if (!orderId || !method) {
        setErrorMessage('المعلومات المطلوبة للدفع غير كاملة.')
        setLoading(false)
        return
      }

      if (isManualPayment) {
        if (!siteSettings.enable_vodafone_cash && method === 'vodafone_cash') {
          setErrorMessage('الدفع عبر فودافون كاش غير مفعّل حالياً.')
          setLoading(false)
          return
        }

        if (!siteSettings.enable_instapay && method === 'instapay') {
          setErrorMessage('الدفع عبر إنستا باي غير مفعّل حالياً.')
          setLoading(false)
          return
        }

        setLoading(false)
        return
      }

      if (method !== 'paymob') {
        setErrorMessage('طريقة الدفع غير مدعومة.')
        setLoading(false)
        return
      }

      if (
        !siteSettings.paymob_enabled ||
        !siteSettings.paymob_integration_id ||
        !siteSettings.paymob_iframe_id
      ) {
        setErrorMessage('لم يتم إعداد Paymob بالكامل بعد. الرجاء إضافة إعدادات Paymob.')
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.functions.invoke('paymob-session', {
          body: JSON.stringify({
            order_id: orderId,
            payment_method: method,
          }),
        })

        if (error) {
          throw error
        }

        let parsed = null

        if (typeof data === 'string') {
          parsed = JSON.parse(data)
        } else if (data instanceof ArrayBuffer) {
          parsed = JSON.parse(new TextDecoder().decode(data))
        } else {
          parsed = data
        }

        if (!parsed?.payment_url) {
          throw new Error('لم يتم الحصول على رابط الدفع.')
        }

        setPaymentUrl(parsed.payment_url)
      } catch (error) {
        setErrorMessage(error.message || 'حدث خطأ أثناء إنشاء جلسة الدفع.')
      } finally {
        setLoading(false)
      }
    }

    createPaymentSession()
  }, [orderId, method, siteSettings, isManualPayment])

  const transferPhone = siteSettings.phone || siteSettings.whatsapp || ''
  const orderTotal = pendingOrder?.total
  const whatsappNumber = siteSettings.whatsapp || normalizePhoneForWhatsApp(transferPhone)

  const whatsappMessage = encodeURIComponent(
    `مرحباً، أريد تأكيد تحويل ${methodLabel} للطلب رقم ${
      pendingOrder?.orderNumber || orderId
    }${
      orderTotal ? `\nالمبلغ: ${formatPrice(orderTotal)} جنيه` : ''
    }`
  )

  const whatsappUrl = whatsappNumber
    ? `${toWhatsAppHref(whatsappNumber)}?text=${whatsappMessage}`
    : '#'

  const completeManualPayment = () => {
    clearCart()
    clearCheckoutOrderNotes()
    clearPendingPaymentOrder()
    const numberQuery = pendingOrder?.orderNumber
      ? `&number=${encodeURIComponent(pendingOrder.orderNumber)}`
      : ''
    navigate(`/order-success?order=${orderId}${numberQuery}`)
  }

  const handlePaymobStart = () => {
    clearCart()
    clearCheckoutOrderNotes()
  }

  if (!orderId || !method) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-12" dir="rtl">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-right">
          <h1 className="text-3xl font-black text-slate-950 mb-4">الدفع</h1>
          <p className="text-slate-500 font-bold">يجب أن تأتي من صفحة إتمام الطلب مع تفاصيل الطلب.</p>
          <Link
            to="/checkout"
            className="mt-6 inline-block bg-slate-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
          >
            العودة إلى صفحة الدفع
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-right">
        <h1 className="text-3xl font-black text-slate-950 mb-4">الدفع عبر {methodLabel}</h1>

        {loading ? (
          <div className="text-slate-500 font-bold">جاري تحميل تفاصيل الدفع...</div>
        ) : errorMessage ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold">
            {errorMessage}
          </div>
        ) : isManualPayment ? (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <p className="text-slate-700 font-bold leading-8">
                رقم الطلب:{' '}
                <span className="font-black text-slate-950">
                  {pendingOrder?.orderNumber || orderId}
                </span>
              </p>

              {orderTotal != null && (
                <p className="text-slate-700 font-bold leading-8">
                  المبلغ المطلوب:{' '}
                  <span className="font-black text-slate-950 text-xl">
                    {formatPrice(orderTotal)} جنيه
                  </span>
                </p>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h2 className="font-black text-slate-950 mb-3">خطوات التحويل</h2>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 font-bold leading-8">
                <li>
                  حوّل المبلغ عبر {methodLabel}
                  {transferPhone ? (
                    <>
                      {' '}
                      إلى الرقم:{' '}
                      <span className="font-black text-slate-950">{transferPhone}</span>
                    </>
                  ) : (
                    ' إلى رقم المحل المسجّل في إعدادات الموقع'
                  )}
                  .
                </li>
                <li>اكتب رقم الطلب في ملاحظات التحويل إن أمكن.</li>
                <li>أرسل صورة إيصال التحويل عبر واتساب لتأكيد الطلب.</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {whatsappNumber && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex justify-center bg-green-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-green-700 transition"
                >
                  إرسال إيصال التحويل عبر واتساب
                </a>
              )}

              <button
                type="button"
                onClick={completeManualPayment}
                className="inline-flex justify-center bg-slate-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
              >
                تم التحويل — متابعة
              </button>
            </div>

            <p className="text-sm text-slate-500 font-bold leading-7">
              سيتم مراجعة التحويل وتأكيد الطلب من فريقنا. يمكنك التواصل معنا عبر واتساب
              لأي استفسار.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-500 font-bold">
              اضغط على الزر التالي للمتابعة إلى الدفع داخل موقع Paymob.
            </p>

            <a
              href={paymentUrl}
              onClick={handlePaymobStart}
              className="inline-block bg-slate-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition"
              target="_blank"
              rel="noreferrer"
            >
              إكمال الدفع الآن
            </a>

            <p className="text-sm text-slate-500 font-bold">
              بعد إتمام الدفع سيتم توجيهك إلى صفحة نجاح الطلب.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
