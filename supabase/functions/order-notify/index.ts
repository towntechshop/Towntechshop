// تنبيهات الطلبات: بتتنادى من قاعدة البيانات مع كل طلب جديد أو دفع ناجح،
// وكمان من لوحة التحكم (إرسال تجربة / معرفة Chat ID).
// verify_jwt = false — الحماية بـ webhook secret أو بتوكن أدمن.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SITE_URL = (Deno.env.get('SITE_URL') || 'https://www.towntechshop.com').replace(/\/$/, '')

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: 'الدفع عند الاستلام',
  paymob: 'كارت (Paymob)',
  vodafone_cash: 'فودافون كاش',
  instapay: 'إنستا باي',
}

type Settings = {
  telegram_enabled: boolean
  telegram_bot_token: string | null
  telegram_chat_ids: string | null
  email_enabled: boolean
  resend_api_key: string | null
  email_from: string | null
  email_to: string | null
  notify_on_paid: boolean
  webhook_secret: string
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function money(value: unknown) {
  return Number(value || 0).toLocaleString('en-US')
}

function chatIds(settings: Settings) {
  return String(settings.telegram_chat_ids || '')
    .split(/[,\s]+/)
    .map((id) => id.trim())
    .filter(Boolean)
}

async function sendTelegram(settings: Settings, text: string) {
  if (!settings.telegram_enabled || !settings.telegram_bot_token) return { skipped: true }

  const results = []
  for (const chatId of chatIds(settings)) {
    const response = await fetch(
      `https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    )
    const data = await response.json().catch(() => ({}))
    results.push({ chatId, ok: Boolean(data?.ok), error: data?.description || null })
  }
  return { results }
}

async function sendEmail(settings: Settings, subject: string, html: string) {
  if (!settings.email_enabled || !settings.resend_api_key || !settings.email_to) return { skipped: true }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.resend_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: settings.email_from || 'Town Tech <onboarding@resend.dev>',
      to: String(settings.email_to).split(/[,\s]+/).filter(Boolean),
      subject,
      html,
    }),
  })
  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, error: response.ok ? null : data?.message || data?.name || 'email failed' }
}

function buildMessages(order: Record<string, any>, event: string) {
  const items = (order.order_items || []) as Record<string, any>[]
  const title = event === 'paid' ? '✅ تم دفع طلب أونلاين' : '🛒 طلب جديد'
  const adminLink = `${SITE_URL}/admin/orders`

  const itemLines = items
    .map((item) => `• ${escapeHtml(item.product_title)} × ${item.quantity} — ${money(item.line_total)} ج`)
    .join('\n')

  const telegram = [
    `<b>${title}</b>`,
    `رقم الطلب: <b>${escapeHtml(order.order_number)}</b>`,
    '',
    `👤 ${escapeHtml(order.customer_name)}`,
    `📞 ${escapeHtml(order.customer_phone)}`,
    `📍 ${escapeHtml([order.customer_governorate, order.customer_city, order.customer_address].filter(Boolean).join(' - '))}`,
    order.customer_notes ? `📝 ${escapeHtml(order.customer_notes)}` : '',
    '',
    itemLines,
    '',
    `الشحن: ${money(order.shipping_fee)} ج${Number(order.discount_amount) > 0 ? ` | الخصم: ${money(order.discount_amount)} ج` : ''}`,
    `<b>الإجمالي: ${money(order.total_amount)} جنيه</b>`,
    `الدفع: ${escapeHtml(PAYMENT_LABELS[order.payment_method] || order.payment_method)}`,
    '',
    `<a href="${adminLink}">فتح الطلبات في لوحة التحكم</a>`,
  ]
    .filter((line) => line !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:6px;border-bottom:1px solid #eee">${escapeHtml(item.product_title)}</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:6px;border-bottom:1px solid #eee">${money(item.line_total)} ج</td></tr>`
    )
    .join('')

  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;color:#0B1F3A">
    <h2>${title} — ${escapeHtml(order.order_number)}</h2>
    <p><b>${escapeHtml(order.customer_name)}</b> — ${escapeHtml(order.customer_phone)}<br/>
    ${escapeHtml([order.customer_governorate, order.customer_city, order.customer_address].filter(Boolean).join(' - '))}</p>
    ${order.customer_notes ? `<p>ملاحظات: ${escapeHtml(order.customer_notes)}</p>` : ''}
    <table style="border-collapse:collapse;width:100%">${rows}</table>
    <p>الشحن: ${money(order.shipping_fee)} ج<br/><b>الإجمالي: ${money(order.total_amount)} جنيه</b><br/>
    الدفع: ${escapeHtml(PAYMENT_LABELS[order.payment_method] || order.payment_method)}</p>
    <p><a href="${adminLink}">فتح الطلبات في لوحة التحكم</a></p>
  </div>`

  return { telegram, html, subject: `${title}: ${order.order_number} — ${money(order.total_amount)} جنيه` }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceRoleKey)

  try {
    const body = await req.json().catch(() => ({}))

    const { data: settings } = await admin
      .from('notification_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (!settings) return json({ error: 'Notification settings missing' }, 500)

    const webhookSecret = req.headers.get('x-webhook-secret') || ''

    // ===== نداء من قاعدة البيانات =====
    if (webhookSecret) {
      if (webhookSecret !== settings.webhook_secret) return json({ error: 'Unauthorized' }, 401)

      const event = body?.event === 'paid' ? 'paid' : 'new_order'
      if (event === 'paid' && !settings.notify_on_paid) return json({ skipped: 'paid notifications off' })

      const { data: order } = await admin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', body?.order_id)
        .maybeSingle()

      if (!order) return json({ error: 'Order not found' }, 404)

      const messages = buildMessages(order, event)
      const [telegram, email] = await Promise.all([
        sendTelegram(settings, messages.telegram),
        sendEmail(settings, messages.subject, messages.html),
      ])

      return json({ ok: true, telegram, email })
    }

    // ===== نداء من لوحة التحكم (أدمن بس) =====
    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: isAdmin } = await userClient.rpc('is_admin')
    if (!isAdmin) return json({ error: 'Unauthorized' }, 401)

    if (body?.action === 'detect_chat') {
      if (!settings.telegram_bot_token) return json({ error: 'اكتب توكن البوت واحفظ الأول' }, 400)

      const response = await fetch(
        `https://api.telegram.org/bot${settings.telegram_bot_token}/getUpdates`
      )
      const data = await response.json().catch(() => ({}))
      if (!data?.ok) return json({ error: data?.description || 'توكن البوت غير صحيح' }, 400)

      const chats = new Map<string, string>()
      for (const update of data.result || []) {
        const chat = update?.message?.chat || update?.channel_post?.chat || update?.my_chat_member?.chat
        if (chat?.id) {
          chats.set(String(chat.id), chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || '')
        }
      }

      return json({ chats: Array.from(chats, ([id, name]) => ({ id, name })) })
    }

    if (body?.action === 'test') {
      const sample = {
        order_number: 'TT-TEST',
        customer_name: 'عميل تجريبي',
        customer_phone: '01000000000',
        customer_governorate: 'القاهرة',
        customer_city: 'مدينة نصر',
        customer_address: 'عنوان تجريبي',
        shipping_fee: 75,
        discount_amount: 0,
        total_amount: 1275,
        payment_method: 'cash_on_delivery',
        order_items: [{ product_title: 'منتج تجريبي', quantity: 1, line_total: 1200 }],
      }
      const messages = buildMessages(sample, 'new_order')
      const forced = { ...settings, telegram_enabled: true, email_enabled: Boolean(settings.resend_api_key) }
      const [telegram, email] = await Promise.all([
        sendTelegram(forced, `🧪 رسالة تجربة\n\n${messages.telegram}`),
        sendEmail(forced, `🧪 تجربة: ${messages.subject}`, messages.html),
      ])
      return json({ ok: true, telegram, email })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    console.error('order-notify error:', error)
    return json({ error: 'Internal error' }, 500)
  }
})
