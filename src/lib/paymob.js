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
    return 'تعذر الاتصال بخادم الدفع. تأكد من نشر Edge Function وإضافة مفاتيح Paymob (Secret Key + Public Key + Integration ID).'
  }

  return message || 'حدث خطأ أثناء إنشاء جلسة الدفع.'
}
