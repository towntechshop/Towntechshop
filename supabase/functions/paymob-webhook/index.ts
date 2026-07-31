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
  order?: { id?: number | string }
  source_data?: {
    pan?: string
    sub_type?: string
    type?: string
  }
}

function toStringValue(value: unknown) {
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (value === null || value === undefined) return ''
  return String(value)
}

async function verifyHmac(
  transaction: TransactionObject,
  receivedHmac: string,
  secret: string
) {
  if (!receivedHmac || !secret) return false

  const concatenated = [
    toStringValue(transaction.amount_cents),
    toStringValue(transaction.created_at),
    toStringValue(transaction.currency),
    toStringValue(transaction.error_occured),
    toStringValue(transaction.has_parent_transaction),
    toStringValue(transaction.id),
    toStringValue(transaction.integration_id),
    toStringValue(transaction.is_3d_secure),
    toStringValue(transaction.is_auth),
    toStringValue(transaction.is_capture),
    toStringValue(transaction.is_refunded),
    toStringValue(transaction.is_standalone_payment),
    toStringValue(transaction.is_voided),
    toStringValue(transaction.order?.id),
    toStringValue(transaction.owner),
    toStringValue(transaction.pending),
    toStringValue(transaction.source_data?.pan),
    toStringValue(transaction.source_data?.sub_type),
    toStringValue(transaction.source_data?.type),
    toStringValue(transaction.success),
  ].join('')

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

  return calculated === receivedHmac.toLowerCase()
}

async function loadHmacSecret(supabase: ReturnType<typeof createClient>) {
  const envSecret = Deno.env.get('PAYMOB_HMAC_SECRET')

  if (envSecret) return envSecret

  const { data: settings } = await supabase
    .from('site_settings')
    .select('paymob_hmac_secret')
    .limit(1)
    .maybeSingle()

  return settings?.paymob_hmac_secret || ''
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const receivedHmac = url.searchParams.get('hmac') || ''
    const body = await req.json()
    const transaction = (body?.obj || body) as TransactionObject

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response('Server configuration is incomplete', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const hmacSecret = await loadHmacSecret(supabase)

    if (hmacSecret) {
      const isValid = await verifyHmac(transaction, receivedHmac, hmacSecret)

      if (!isValid) {
        console.error('Invalid Paymob HMAC')
        return new Response('Invalid HMAC', { status: 401 })
      }
    }

    const merchantOrderId =
      body?.merchant_order_id ||
      body?.obj?.merchant_order_id ||
      body?.obj?.order?.merchant_order_id ||
      body?.obj?.payment_key_claims?.extra?.order_id ||
      body?.obj?.data?.merchant_order_id ||
      body?.special_reference ||
      body?.obj?.special_reference

    if (!merchantOrderId) {
      return new Response('Missing merchant order id', { status: 400 })
    }

    const paymentStatus = transaction.success
      ? 'paid'
      : transaction.pending
        ? 'pending'
        : 'failed'

    const orderStatus = transaction.success ? 'confirmed' : undefined

    const updatePayload: Record<string, string> = {
      payment_status: paymentStatus,
    }

    if (orderStatus) {
      updatePayload.status = orderStatus
    }

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', merchantOrderId)
      .eq('payment_method', 'paymob')

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
