export function isPaymobConfigured(settings) {
  if (!settings) return false

  return Boolean(
    settings.paymob_enabled &&
      String(settings.paymob_integration_id || '').trim() &&
      String(settings.paymob_public_key || '').trim()
  )
}

export function getPaymobSetupMessage(settings) {
  if (!settings?.paymob_enabled) {
    return 'Paymob غير مفعّل في إعدادات الموقع.'
  }

  if (!String(settings.paymob_integration_id || '').trim()) {
    return 'Integration ID غير موجود في إعدادات الموقع.'
  }

  if (!String(settings.paymob_public_key || '').trim()) {
    return 'Public Key غير موجود في إعدادات الموقع.'
  }

  return ''
}

export async function readFunctionErrorMessage(error, data) {
  if (data?.error) {
    return String(data.error)
  }

  if (!error) {
    return 'حدث خطأ أثناء إنشاء جلسة الدفع.'
  }

  const context = error.context

  if (context && typeof context.json === 'function') {
    try {
      const payload = await context.json()

      if (payload?.error) {
        return String(payload.error)
      }
    } catch {
      // ignore malformed error payloads
    }
  }

  const message = String(error.message || '')

  if (message.includes('non-2xx')) {
    return 'تعذر الاتصال بخادم الدفع. تأكد من نشر Edge Function وإضافة مفاتيح Paymob.'
  }

  return message || 'حدث خطأ أثناء إنشاء جلسة الدفع.'
}
