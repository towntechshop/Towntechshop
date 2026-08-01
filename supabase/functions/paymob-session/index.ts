import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const PAYMOB_BASE_URL =
  Deno.env.get('PAYMOB_BASE_URL') || 'https://accept.paymob.com'

type OrderItem = {
  product_title?: string
  quantity?: number
  unit_price?: number
  line_total?: number
}

type OrderRecord = {
  id: string
  order_number?: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  customer_address?: string
  customer_city?: string
  total_amount?: number
  order_items?: OrderItem[]
}

type SiteSettings = {
  paymob_enabled?: boolean
  paymob_api_key?: string
  paymob_public_key?: string
  paymob_integration_id?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizePhone(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '')

  if (!digits) return '+200000000000'
  if (digits.startsWith('20')) return `+${digits}`
  if (digits.startsWith('0')) return `+20${digits.slice(1)}`

  return `+${digits}`
}

function splitName(fullName: string) {
  const parts = String(fullName || 'Customer').trim().split(/\s+/)

  return {
    first_name: parts[0] || 'Customer',
    last_name: parts.slice(1).join(' ') || 'Customer',
  }
}

async function loadPaymobConfig(
  supabase: ReturnType<typeof createClient>,
  requestPublicKey?: string
) {
  let secretKey = Deno.env.get('PAYMOB_SECRET_KEY') || ''
  let publicKey = Deno.env.get('PAYMOB_PUBLIC_KEY') || requestPublicKey || ''
  let integrationId = Deno.env.get('PAYMOB_INTEGRATION_ID') || ''

  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('paymob_enabled, paymob_api_key, paymob_integration_id')
    .eq('id', 1)
    .maybeSingle()

  if (settingsError) {
    console.error('site_settings query failed:', settingsError)
  }

  const siteSettings = (settings || {}) as SiteSettings

  secretKey = secretKey || siteSettings.paymob_api_key || ''
  integrationId =
    integrationId || String(siteSettings.paymob_integration_id || '')

  if (!publicKey) {
    const { data: publicKeyRow, error: publicKeyError } = await supabase
      .from('site_settings')
      .select('paymob_public_key')
      .eq('id', 1)
      .maybeSingle()

    if (publicKeyError) {
      console.error('paymob_public_key query failed:', publicKeyError)
    } else {
      publicKey = publicKeyRow?.paymob_public_key || ''
    }
  }

  const paymobConfiguredInEnv = Boolean(
    Deno.env.get('PAYMOB_SECRET_KEY') &&
      (Deno.env.get('PAYMOB_PUBLIC_KEY') || requestPublicKey) &&
      Deno.env.get('PAYMOB_INTEGRATION_ID')
  )

  if (!paymobConfiguredInEnv && !siteSettings.paymob_enabled) {
    throw new Error('Paymob is not enabled')
  }

  return { secretKey, publicKey, integrationId }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const orderId = payload?.order_id
    const requestPublicKey = payload?.public_key

    if (!orderId) {
      return jsonResponse({ error: 'order_id is required' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server configuration is incomplete' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      return jsonResponse({ error: 'Order not found' }, 404)
    }

    const orderRecord = order as OrderRecord
    const { secretKey, publicKey, integrationId } = await loadPaymobConfig(
      supabase,
      requestPublicKey
    )

    if (!secretKey) {
      return jsonResponse(
        { error: 'Paymob Secret Key غير موجود. أضفه في Supabase Secrets أو إعدادات الموقع.' },
        500
      )
    }

    if (!publicKey) {
      return jsonResponse(
        { error: 'Paymob Public Key غير موجود. أضفه في إعدادات الموقع.' },
        500
      )
    }

    if (!integrationId) {
      return jsonResponse(
        { error: 'Paymob Integration ID غير موجود.' },
        500
      )
    }

    const amountCents = Math.round(Number(orderRecord.total_amount || 0) * 100)

    if (amountCents <= 0) {
      return jsonResponse({ error: 'Invalid order amount' }, 400)
    }

    const { first_name, last_name } = splitName(orderRecord.customer_name || '')
    const phone = normalizePhone(orderRecord.customer_phone || '')

    let items = (orderRecord.order_items || []).map((item) => ({
      name: (item.product_title || 'Product').slice(0, 50),
      amount: Math.round(
        Number(
          item.line_total ||
            Number(item.unit_price || 0) * Number(item.quantity || 1)
        ) * 100
      ),
      description: (item.product_title || 'Order item').slice(0, 100),
      quantity: Number(item.quantity || 1),
    }))

    const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0)

    if (items.length === 0 || itemsTotal !== amountCents) {
      items = [
        {
          name: `Order ${orderRecord.order_number || orderRecord.id}`.slice(0, 50),
          amount: amountCents,
          description: 'Order total',
          quantity: 1,
        },
      ]
    }

    const siteUrl =
      Deno.env.get('SITE_URL')?.replace(/\/$/, '') ||
      req.headers.get('origin')?.replace(/\/$/, '') ||
      ''

    const redirectionUrl = siteUrl
      ? `${siteUrl}/order-success?order=${encodeURIComponent(orderRecord.id)}${
          orderRecord.order_number
            ? `&number=${encodeURIComponent(orderRecord.order_number)}`
            : ''
        }`
      : undefined

    const intentionPayload = {
      amount: amountCents,
      currency: 'EGP',
      payment_methods: [Number(integrationId)],
      items,
      billing_data: {
        first_name,
        last_name,
        phone_number: phone,
        email: orderRecord.customer_email || 'customer@example.com',
        street: orderRecord.customer_address || 'NA',
        building: 'NA',
        floor: 'NA',
        apartment: 'NA',
        city: orderRecord.customer_city || 'Cairo',
        country: 'EGY',
        state: orderRecord.customer_city || 'Cairo',
      },
      special_reference: String(orderRecord.id),
      notification_url: `${supabaseUrl}/functions/v1/paymob-webhook`,
      redirection_url: redirectionUrl,
      extras: {
        order_id: orderRecord.id,
        order_number: orderRecord.order_number,
      },
    }

    const paymobResponse = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(intentionPayload),
    })

    const paymobData = await paymobResponse.json()

    if (!paymobResponse.ok) {
      console.error('Paymob intention error:', paymobData)

      return jsonResponse(
        {
          error:
            paymobData.detail ||
            paymobData.message ||
            'Failed to create Paymob payment session',
          details: paymobData,
        },
        502
      )
    }

    const clientSecret = paymobData.client_secret

    if (!clientSecret) {
      return jsonResponse({ error: 'Paymob did not return client_secret' }, 502)
    }

    const paymentUrl = `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`

    return jsonResponse({
      payment_url: paymentUrl,
      intention_id: paymobData.id,
    })
  } catch (error) {
    console.error('paymob-session error:', error)

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    )
  }
})
