export const ORDER_STATUS_STEPS = [
  { key: 'new', label: 'تم استلام الطلب' },
  { key: 'confirmed', label: 'تم التأكيد' },
  { key: 'processing', label: 'قيد التجهيز' },
  { key: 'shipped', label: 'تم الشحن' },
  { key: 'delivered', label: 'تم التسليم' },
]

export const ORDER_STATUS_LABELS = {
  new: 'جديد',
  confirmed: 'تم التأكيد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

export const PAYMENT_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  paid: 'مدفوع',
  failed: 'فشل الدفع',
  refunded: 'تم الاسترداد',
}

export const PAYMENT_METHOD_LABELS = {
  cash_on_delivery: 'الدفع عند الاستلام',
  paymob: 'دفع إلكتروني',
  vodafone_cash: 'فودافون كاش',
  instapay: 'إنستا باي',
}

export function translateOrderStatus(status) {
  return ORDER_STATUS_LABELS[status] || status || '-'
}

export function translatePaymentStatus(status) {
  return PAYMENT_STATUS_LABELS[status] || status || '-'
}

export function translatePaymentMethod(method) {
  return PAYMENT_METHOD_LABELS[method] || method || '-'
}

export function getOrderStatusStepIndex(status) {
  if (status === 'cancelled') return -1
  const index = ORDER_STATUS_STEPS.findIndex((step) => step.key === status)
  return index >= 0 ? index : 0
}

export function formatOrderDate(value) {
  if (!value) return '-'

  try {
    return new Date(value).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function formatOrderPrice(value) {
  return Number(value || 0).toLocaleString('en-US')
}

export function parsePlacedOrderResult(data) {
  if (!data) return { id: null, orderNumber: null }

  if (typeof data === 'object') {
    return {
      id: data.id || null,
      orderNumber: data.order_number || data.orderNumber || null,
    }
  }

  return { id: data, orderNumber: null }
}
