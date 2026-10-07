// استقبال إشعار الدفع من Paymob (Transaction processed callback)
// يجب نشرها بدون تحقق JWT (verify_jwt = false) لأن Paymob لا يرسل توكن Supabase.
// الحماية هنا عن طريق توقيع HMAC الإلزامي + التحقق من المبلغ.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type TransactionObject = {
  id?: number | string
  success?: boolean
  pending?: boolean
  amount_cents?: number | string
  created_at?: string
  currency?: string
  error_occured?: boolean
  has_parent_transaction?: boolean
  integration_id?: number | string
  is_3d_secure?: boolean
  is_auth?: boolean
  is_capture?: boolean
  is_refunded?: boolean
  is_standalone_payment?: boolean
  is_voided?: boolean
  owner?: number | string
  order?: { id?: number | string; merchant_order_id?: string }
  source_data?: {
    pan?: string
    sub_type?: string
    type?: string
  }
  payment_key_claims?: { extra?: Record<string, unknown> }
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

function toStringValue(value: unknown) {
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (value === null || value === undefined) return ''
  return String(value)
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

async function verifyHmac(
  transaction: TransactionObject,
  receivedHmac: string,
  secret: string
) {
  if (!receivedHmac || !secret) return false

  const concatenated = [
    transaction.amount_cents,
    transaction.created_at,
    transaction.currency,
    transaction.error_occured,
    transaction.has_parent_transaction,
    transaction.id,
    transaction.integration_id,
    transaction.is_3d_secure,
    transaction.is_auth,
    transaction.is_capture,
    transaction.is_refunded,
    transaction.is_standalone_payment,
    transaction.is_voided,
    transaction.order?.id,
    transaction.owner,
    transaction.pending,
    transaction.source_data?.pan,
    transaction.source_data?.sub_type,
    transaction.source_data?.type,
    transaction.success,
  ]
    .map(toStringValue)
    .join('')

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(concatenated)
  )

  const calculated = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return timingSafeEqual(calculated, receivedHmac.toLowerCase())
}

async function loadHmacSecret(supabase: ReturnType<typeof createClient>) {
  const envSecret = Deno.env.get('PAYMOB_HMAC_SECRET')
  if (envSecret) return envSecret

  const { data } = await supabase
    .from('payment_secrets')
    .select('paymob_hmac_secret')
    .eq('id', 1)
    .maybeSingle()

  return data?.paymob_hmac_secret || ''
}

function extractOrderId(body: Record<string, any>, transaction: TransactionObject) {
  const candidates = [
    transaction.order?.merchant_order_id,
    body?.obj?.merchant_order_id,
    body?.merchant_order_id,
    transaction.payment_key_claims?.extra?.order_id,
    body?.obj?.special_reference,
    body?.special_reference,
  ]

  for (const candidate of candidates) {
    const match = String(candidate || '').match(UUID_RE)
    if (match) return match[0]
  }

  return null
}

Deno.serve(async (req) => {
  // Paymob أحياناً يختبر الرابط بـ GET
  if (req.method !== 'POST') {
    return new Response('OK', { status: 200 })
  }

  try {
    const url = new URL(req.url)
    const receivedHmac = url.searchParams.get('hmac') || ''
    const body = await req.json().catch(() => null)

    if (!body) {
      return new Response('Invalid body', { status: 400 })
    }

    if (body.type && body.type !== 'TRANSACTION') {
      // إشعارات أخرى (مثل TOKEN) لا تحتاج معالجة
      return new Response('Ignored', { status: 200 })
    }

    const transaction = (body?.obj || body) as TransactionObject

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response('Server configuration is incomplete', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const hmacSecret = await loadHmacSecret(supabase)

    if (!hmacSecret) {
      console.error('Paymob HMAC secret is not configured — rejecting callback')
      return new Response('HMAC not configured', { status: 500 })
    }

    if (!(await verifyHmac(transaction, receivedHmac, hmacSecret))) {
      console.error('Invalid Paymob HMAC')
      return new Response('Invalid HMAC', { status: 401 })
    }

    const orderId = extractOrderId(body, transaction)

    if (!orderId) {
      console.error('Paymob callback without order id', transaction.id)
      return new Response('Missing merchant order id', { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status, payment_method, status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      console.error('Order not found for Paymob callback', orderId)
      return new Response('Order not found', { status: 404 })
    }

    if (order.payment_method !== 'paymob') {
      return new Response('Not a Paymob order', { status: 200 })
    }

    // طلب مدفوع بالفعل: لا نغيّر حالته بسبب محاولة لاحقة فاشلة
    if (order.payment_status === 'paid' && !transaction.is_refunded) {
      return new Response('Already paid', { status: 200 })
    }

    const expectedCents = Math.round(Number(order.total_amount || 0) * 100)
    const paidCents = Number(transaction.amount_cents || 0)

    let paymentStatus: string
    if (transaction.is_refunded) {
      paymentStatus = 'refunded'
    } else if (transaction.success && !transaction.is_voided) {
      if (paidCents !== expectedCents || transaction.currency !== 'EGP') {
        console.error('Paymob amount mismatch', { orderId, paidCents, expectedCents })
        paymentStatus = 'failed'
      } else {
        paymentStatus = 'paid'
      }
    } else if (transaction.pending) {
      paymentStatus = 'pending'
    } else {
      paymentStatus = 'failed'
    }

    const updatePayload: Record<string, string> = {
      payment_status: paymentStatus,
      payment_reference: String(transaction.id || ''),
    }

    if (paymentStatus === 'paid' && (!order.status || order.status === 'new')) {
      updatePayload.status = 'confirmed'
    }

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)

    if (error) {
      console.error('Failed to update order:', error)
      return new Response('Failed to update order', { status: 500 })
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('paymob-webhook error:', error)
    return new Response('Webhook error', { status: 500 })
  }
})
