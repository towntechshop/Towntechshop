import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Field, SectionTitle } from './components/AdminFormFields'
import { requestOrderNotificationPermission } from '../hooks/useAdminNotifications'

const inputClass =
  'w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-slate-950 bg-white text-left'

function Toggle({ checked, onChange, title, description }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 bg-slate-50 cursor-pointer">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="w-5 h-5 mt-0.5"
      />
      <div>
        <p className="font-black text-slate-900">{title}</p>
        {description && <p className="text-slate-500 text-sm font-bold leading-6">{description}</p>}
      </div>
    </label>
  )
}

export default function AdminNotifications() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [detectedChats, setDetectedChats] = useState([])
  const [browserPermission, setBrowserPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  )

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('notification_settings')
        .select(
          'telegram_enabled, telegram_bot_token, telegram_chat_ids, email_enabled, resend_api_key, email_from, email_to, notify_on_paid'
        )
        .eq('id', 1)
        .maybeSingle()

      if (error) setErrorMessage(error.message)
      setSettings(
        data || {
          telegram_enabled: false,
          telegram_bot_token: '',
          telegram_chat_ids: '',
          email_enabled: false,
          resend_api_key: '',
          email_from: '',
          email_to: '',
          notify_on_paid: true,
        }
      )
      setLoading(false)
    }
    load()
  }, [])

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setMessage('')
  }

  const save = async () => {
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const payload = {
      id: 1,
      telegram_enabled: Boolean(settings.telegram_enabled),
      telegram_bot_token: String(settings.telegram_bot_token || '').trim() || null,
      telegram_chat_ids: String(settings.telegram_chat_ids || '').trim() || null,
      email_enabled: Boolean(settings.email_enabled),
      resend_api_key: String(settings.resend_api_key || '').trim() || null,
      email_from: String(settings.email_from || '').trim() || null,
      email_to: String(settings.email_to || '').trim() || null,
      notify_on_paid: Boolean(settings.notify_on_paid),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('notification_settings').upsert(payload)

    if (error) setErrorMessage(error.message)
    else setMessage('تم حفظ إعدادات التنبيهات')
    setSaving(false)
    return !error
  }

  const callFunction = async (action) => {
    setBusyAction(action)
    setMessage('')
    setErrorMessage('')

    const saved = await save()
    if (!saved) {
      setBusyAction('')
      return
    }

    const { data, error } = await supabase.functions.invoke('order-notify', { body: { action } })
    setBusyAction('')

    if (error || data?.error) {
      let text = data?.error || error?.message || 'حصل خطأ'
      try {
        const payload = await error?.context?.json?.()
        if (payload?.error) text = payload.error
      } catch {
        // ignore
      }
      setErrorMessage(text)
      return
    }

    if (action === 'detect_chat') {
      const chats = data?.chats || []
      setDetectedChats(chats)
      if (!chats.length) {
        setErrorMessage('مفيش رسايل وصلت للبوت لسه. افتح البوت في تليجرام واضغط Start أو ابعتله أي رسالة، وبعدين جرّب تاني.')
      }
      return
    }

    const telegramResults = data?.telegram?.results || []
    const failed = telegramResults.filter((result) => !result.ok)
    if (failed.length) {
      setErrorMessage(`تليجرام: ${failed.map((result) => `${result.chatId}: ${result.error}`).join(' | ')}`)
    } else if (telegramResults.length) {
      setMessage(`تم إرسال رسالة تجربة على تليجرام (${telegramResults.length})`)
    }
    if (data?.email && data.email.ok === false) {
      setErrorMessage((prev) => `${prev ? `${prev} — ` : ''}الإيميل: ${data.email.error}`)
    } else if (data?.email?.ok) {
      setMessage((prev) => `${prev ? `${prev} + ` : ''}تم إرسال إيميل تجربة`)
    }
  }

  const addChatId = (id) => {
    const existing = String(settings.telegram_chat_ids || '')
      .split(/[,\s]+/)
      .filter(Boolean)
    if (!existing.includes(id)) update('telegram_chat_ids', [...existing, id].join(', '))
  }

  if (loading || !settings) {
    return (
      <div dir="rtl" className="space-y-4">
        <h1 className="text-2xl md:text-4xl font-black text-slate-950">تنبيهات الطلبات</h1>
        <div className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-slate-950">تنبيهات الطلبات</h1>
        <p className="text-slate-500 mt-2 font-bold">
          أول ما عميل يعمل طلب، توصلك رسالة فيها بياناته والمنتجات والإجمالي.
        </p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 font-bold">{message}</div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold">{errorMessage}</div>
      )}

      {/* تليجرام */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
        <SectionTitle
          title="تليجرام (مجاني ومُوصى به)"
          description="الرسالة بتوصل على موبايلك فوراً، ولكذا شخص أو جروب."
        />

        <ol className="list-decimal pr-5 space-y-1.5 text-sm font-bold text-slate-600 leading-7 mb-5">
          <li>
            افتح تليجرام وابحث عن <span dir="ltr" className="font-black text-slate-900">@BotFather</span> واضغط Start.
          </li>
          <li>
            ابعتله <span dir="ltr" className="font-black text-slate-900">/newbot</span> واختار اسم للبوت (مثلاً Town Tech Orders).
          </li>
          <li>هيبعتلك <b>توكن</b> شكله زي 123456:ABC-... — انسخه وحطه تحت.</li>
          <li>افتح البوت الجديد بتاعك واضغط <b>Start</b> (أو ضيفه لجروب الشغل وابعت فيه أي رسالة).</li>
          <li>اضغط «اكتشف Chat ID» تحت، واختار الحساب أو الجروب، وبعدين «إرسال رسالة تجربة».</li>
        </ol>

        <div className="space-y-4">
          <Toggle
            checked={settings.telegram_enabled}
            onChange={(checked) => update('telegram_enabled', checked)}
            title="تشغيل تنبيهات تليجرام"
          />

          <Field label="توكن البوت (Bot Token)">
            <input
              type="password"
              value={settings.telegram_bot_token || ''}
              onChange={(event) => update('telegram_bot_token', event.target.value)}
              placeholder="123456789:AA..."
              className={inputClass}
              dir="ltr"
              autoComplete="off"
            />
          </Field>

          <Field label="Chat ID (لو أكتر من واحد افصل بفاصلة)">
            <input
              type="text"
              value={settings.telegram_chat_ids || ''}
              onChange={(event) => update('telegram_chat_ids', event.target.value)}
              placeholder="123456789, -1001234567890"
              className={inputClass}
              dir="ltr"
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => callFunction('detect_chat')}
              disabled={Boolean(busyAction)}
              className="bg-slate-100 text-slate-950 px-5 py-3 rounded-2xl font-black hover:bg-slate-200 disabled:opacity-60"
            >
              {busyAction === 'detect_chat' ? 'جاري البحث...' : 'اكتشف Chat ID'}
            </button>
            <button
              type="button"
              onClick={() => callFunction('test')}
              disabled={Boolean(busyAction)}
              className="bg-sky-600 text-white px-5 py-3 rounded-2xl font-black hover:bg-sky-700 disabled:opacity-60"
            >
              {busyAction === 'test' ? 'جاري الإرسال...' : 'إرسال رسالة تجربة'}
            </button>
          </div>

          {detectedChats.length > 0 && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="font-black text-slate-900 mb-2">الحسابات/الجروبات اللي كلّمت البوت:</p>
              <div className="flex flex-wrap gap-2">
                {detectedChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => addChatId(chat.id)}
                    className="bg-white border border-sky-200 rounded-xl px-3 py-2 text-sm font-black hover:border-sky-500"
                  >
                    + {chat.name || 'بدون اسم'} <span dir="ltr" className="text-slate-500">({chat.id})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* إيميل */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
        <SectionTitle
          title="إيميل (اختياري)"
          description="عن طريق خدمة Resend المجانية لحد 3000 إيميل في الشهر. اعمل حساب على resend.com وخد API Key."
        />
        <div className="space-y-4">
          <Toggle
            checked={settings.email_enabled}
            onChange={(checked) => update('email_enabled', checked)}
            title="تشغيل تنبيهات الإيميل"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Resend API Key">
              <input
                type="password"
                value={settings.resend_api_key || ''}
                onChange={(event) => update('resend_api_key', event.target.value)}
                placeholder="re_..."
                className={inputClass}
                dir="ltr"
                autoComplete="off"
              />
            </Field>
            <Field label="الإيميل اللي هيستقبل التنبيه">
              <input
                type="text"
                value={settings.email_to || ''}
                onChange={(event) => update('email_to', event.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                dir="ltr"
              />
            </Field>
          </div>
          <Field
            label="الإيميل المرسِل (اختياري)"
            hint="لو سيبته فاضي هيتبعت من onboarding@resend.dev، وده بيشتغل بس لإيميل حساب Resend نفسه. عشان تبعت لأي إيميل لازم توثّق الدومين بتاعك في Resend."
          >
            <input
              type="text"
              value={settings.email_from || ''}
              onChange={(event) => update('email_from', event.target.value)}
              placeholder="Town Tech <orders@towntechshop.com>"
              className={inputClass}
              dir="ltr"
            />
          </Field>
        </div>
      </section>

      {/* عام */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4">
        <SectionTitle title="إعدادات عامة" />
        <Toggle
          checked={settings.notify_on_paid}
          onChange={(checked) => update('notify_on_paid', checked)}
          title="تنبيه كمان لما طلب أونلاين يتدفع بنجاح"
        />
        <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
          <p className="font-black text-slate-900">تنبيه وصوت في المتصفح</p>
          <p className="text-slate-500 text-sm font-bold leading-6 mt-1">
            طول ما لوحة التحكم مفتوحة، أي طلب جديد بيعمل صوت تنبيه وإشعار على الجهاز.
          </p>
          {browserPermission === 'granted' ? (
            <p className="text-green-700 font-black text-sm mt-2">✓ إشعارات المتصفح شغالة على الجهاز ده</p>
          ) : browserPermission === 'unsupported' ? (
            <p className="text-slate-500 font-black text-sm mt-2">المتصفح ده مش بيدعم الإشعارات</p>
          ) : (
            <button
              type="button"
              onClick={() => {
                requestOrderNotificationPermission()
                setTimeout(() => setBrowserPermission(Notification.permission), 1500)
              }}
              className="mt-3 bg-slate-950 text-white px-4 py-2.5 rounded-xl font-black text-sm"
            >
              تفعيل إشعارات المتصفح على الجهاز ده
            </button>
          )}
        </div>
      </section>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 sticky bottom-4 z-10">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full md:w-auto bg-slate-950 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ إعدادات التنبيهات'}
        </button>
      </div>
    </div>
  )
}
