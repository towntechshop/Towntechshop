// إنشاء جلسة دفع Paymob (Intention API / Unified Checkout) لطلب موجود
// المفاتيح السرية تُقرأ من Supabase Secrets أولاً، ثم من جدول payment_secrets (أدمن فقط)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PAYMOB_BASE_URL = (
  Deno.env.get('PAYMOB_BASE_URL') || 'https://accept.paymob.com'
).replace(/\/$/, '')

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
  payment_method?: string
  payment_status?: string
  order_items?: OrderItem[]
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizePhone(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '')

  if (!digits) return '+201000000000'
  if (digits.startsWith('20')) return `+${digits}`
  if (digits.startsWith('0')) return `+20${digits.slice(1)}`

  return `+20${digits}`
}

function splitName(fullName: string) {
  const parts = String(fullName || 'Customer').trim().split(/\s+/)

  return {
    first_name: parts[0] || 'Customer',
    last_name: parts.slice(1).join(' ') || parts[0] || 'Customer',
  }
}

function parseIntegrationIds(value: string) {
  return String(value || '')
    .split(/[,\s]+/)
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0)
}

async function loadPaymobConfig(supabase: ReturnType<typeof createClient>) {
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('paymob_enabled, paymob_public_key, paymob_integration_id')
    .eq('id', 1)
    .maybeSingle()

  if (settingsError) {
    console.error('site_settings query failed:', settingsError)
  }

  const { data: secrets, error: secretsError } = await supabase
    .from('payment_secrets')
    .select('paymob_secret_key')
    .eq('id', 1)
    .maybeSingle()

  if (secretsError) {
    console.error('payment_secrets query failed:', secretsError)
  }

  return {
    enabled: Boolean(settings?.paymob_enabled),
    secretKey:
      Deno.env.get('PAYMOB_SECRET_KEY') || secrets?.paymob_secret_key || '',
    publicKey:
      Deno.env.get('PAYMOB_PUBLIC_KEY') || settings?.paymob_public_key || '',
    integrationIds: parseIntegrationIds(
      Deno.env.get('PAYMOB_INTEGRATION_ID') ||
        String(settings?.paymob_integration_id || '')
    ),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const orderId = String(payload?.order_id || '')

    if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
      return jsonResponse({ error: 'رقم الطلب غير صالح.' }, 400)
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
      return jsonResponse({ error: 'لم يتم العثور على الطلب.' }, 404)
    }

    const orderRecord = order as OrderRecord

    if (orderRecord.payment_method !== 'paymob') {
      return jsonResponse({ error: 'هذا الطلب ليس بالدفع الإلكتروني.' }, 400)
    }

    if (orderRecord.payment_status === 'paid') {
      return jsonResponse({ already_paid: true })
    }

    const { enabled, secretKey, publicKey, integrationIds } =
      await loadPaymobConfig(supabase)

    if (!enabled) {
      return jsonResponse({ error: 'الدفع الإلكتروني غير مفعّل حالياً.' }, 503)
    }

    if (!secretKey || !publicKey || integrationIds.length === 0) {
      console.error('Paymob config incomplete', {
        hasSecret: Boolean(secretKey),
        hasPublic: Boolean(publicKey),
        integrations: integrationIds.length,
      })
      return jsonResponse(
        { error: 'إعدادات بوابة الدفع غير مكتملة. يرجى التواصل مع المتجر.' },
        503
      )
    }

    const amountCents = Math.round(Number(orderRecord.total_amount || 0) * 100)

    if (amountCents <= 0) {
      return jsonResponse({ error: 'قيمة الطلب غير صالحة.' }, 400)
    }

    const { first_name, last_name } = splitName(orderRecord.customer_name || '')
    const phone = normalizePhone(orderRecord.customer_phone || '')

    let items = (orderRecord.order_items || []).map((item) => {
      const quantity = Math.max(Number(item.quantity || 1), 1)
      const unitCents = Math.round(Number(item.unit_price || 0) * 100)

      return {
        name: (item.product_title || 'Product').slice(0, 50),
        amount: unitCents,
        description: (item.product_title || 'Order item').slice(0, 100),
        quantity,
      }
    })

    const itemsTotal = items.reduce(
      (sum, item) => sum + item.amount * item.quantity,
      0
    )

    // الشحن والخصم يغيّروا الإجمالي، فنرسل بند واحد بإجمالي الطلب عشان المبالغ تطابق
    if (items.length === 0 || itemsTotal !== amountCents) {
      items = [
        {
          name: `Order ${orderRecord.order_number || ''}`.trim().slice(0, 50),
          amount: amountCents,
          description: 'Order total',
          quantity: 1,
        },
      ]
    }

    const siteUrl = (
      Deno.env.get('SITE_URL') ||
      req.headers.get('origin') ||
      ''
    ).replace(/\/$/, '')

    const redirectionUrl = siteUrl
      ? `${siteUrl}/order-success?order=${encodeURIComponent(orderRecord.id)}${
          orderRecord.order_number
            ? `&number=${encodeURIComponent(orderRecord.order_number)}`
            : ''
        }&method=paymob`
      : undefined

    // Paymob يرفض تكرار special_reference، فنضيف توقيت لكل محاولة دفع
    const specialReference = `${orderRecord.id}_${Date.now()}`

    const intentionPayload = {
      amount: amountCents,
      currency: 'EGP',
      payment_methods: integrationIds,
      items,
      billing_data: {
        first_name,
        last_name,
        phone_number: phone,
        email: orderRecord.customer_email || 'customer@towntech.shop',
        street: (orderRecord.customer_address || 'NA').slice(0, 200),
        building: 'NA',
        floor: 'NA',
        apartment: 'NA',
        city: orderRecord.customer_city || 'Cairo',
        country: 'EG',
        state: orderRecord.customer_city || 'Cairo',
      },
      special_reference: specialReference,
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

    const paymobData = await paymobResponse.json().catch(() => ({}))

    if (!paymobResponse.ok) {
      console.error('Paymob intention error:', paymobResponse.status, paymobData)

      return jsonResponse(
        {
          error: 'تعذر إنشاء جلسة الدفع من Paymob. حاول مرة أخرى أو اختر طريقة دفع أخرى.',
          paymob_status: paymobResponse.status,
          paymob_detail: paymobData?.detail || paymobData?.message || null,
        },
        502
      )
    }

    const clientSecret = paymobData.client_secret

    if (!clientSecret) {
      console.error('Paymob response missing client_secret', paymobData)
      return jsonResponse({ error: 'لم يتم الحصول على رابط الدفع من Paymob.' }, 502)
    }

    const paymentUrl = `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${encodeURIComponent(
      publicKey
    )}&clientSecret=${encodeURIComponent(clientSecret)}`

    return jsonResponse({
      payment_url: paymentUrl,
      intention_id: paymobData.id,
    })
  } catch (error) {
    console.error('paymob-session error:', error)

    return jsonResponse({ error: 'حدث خطأ أثناء إنشاء جلسة الدفع.' }, 500)
  }
})
