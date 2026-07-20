import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      setErrorMessage('بيانات الدخول غير صحيحة، تأكد من البريد الإلكتروني وكلمة المرور.')
      return
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

    if (adminError) {
      await supabase.auth.signOut()
      setErrorMessage(
        'تم التحقق من البريد وكلمة المرور، لكن هذا الحساب غير مضاف كمسؤول. نفّذ سكربت supabase/grant_admin_access.sql في Supabase → SQL Editor، أو اطلب من مسؤول الموقع إضافة بريدك في جدول admin_users.'
      )
      return
    }

    if (!isAdmin) {
      await supabase.auth.signOut()
      setErrorMessage(
        'هذا الحساب غير مصرح له بالدخول للوحة التحكم. أضف بريدك في جدول admin_users عبر Supabase → SQL Editor (ملف grant_admin_access.sql).'
      )
      return
    }

    if (data.user) {
      navigate('/admin')
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center"
      dir="rtl"
    >
      <div className="w-full max-w-[1050px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          className="hidden lg:flex flex-col justify-between p-10 text-white"
          style={{
            background:
              'linear-gradient(135deg, #07111F 0%, #0B1F3A 55%, #123D68 100%)',
          }}
        >
          <div>
            <h1 className="text-5xl font-black leading-tight">
              Town Tech
            </h1>

            <p className="text-white/60 mt-4 font-bold leading-8">
              لوحة إدارة الموقع للتحكم في المنتجات والطلبات والأقسام والكوبونات وإعدادات الموقع.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-3xl p-5">
              <p className="text-white/60 text-sm font-bold">
                إدارة المنتجات
              </p>

              <p className="text-2xl font-black mt-2">
                سهلة وسريعة
              </p>
            </div>

            <div className="bg-white/10 rounded-3xl p-5">
              <p className="text-white/60 text-sm font-bold">
                متابعة الطلبات
              </p>

              <p className="text-2xl font-black mt-2">
                في مكان واحد
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleLogin}
          className="p-6 sm:p-8 md:p-10 lg:p-12"
        >
          <div className="mb-8 text-center lg:text-right">
            <div className="w-16 h-16 rounded-3xl bg-slate-950 text-white mx-auto lg:mx-0 flex items-center justify-center text-2xl font-black mb-5">
              TT
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-slate-950">
              تسجيل الدخول
            </h1>

            <p className="text-slate-500 mt-3 font-bold leading-7">
              ادخل بيانات حساب الأدمن لإدارة الموقع
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold leading-7">
              {errorMessage}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-black text-slate-700">
                البريد الإلكتروني
              </label>

              <input
                type="email"
                className="w-full border border-slate-300 rounded-2xl px-4 py-4 outline-none focus:border-slate-950 text-left"
                placeholder="admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-black text-slate-700">
                كلمة المرور
              </label>

              <input
                type="password"
                className="w-full border border-slate-300 rounded-2xl px-4 py-4 outline-none focus:border-slate-950 text-left"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full bg-slate-950 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 disabled:opacity-60 transition"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'دخول لوحة التحكم'}
          </button>

          <a
            href="/"
            className="mt-4 block text-center bg-slate-100 text-slate-950 py-4 rounded-2xl font-black hover:bg-slate-200 transition"
          >
            الرجوع للموقع
          </a>

          <p className="text-center text-slate-400 text-xs font-bold mt-6 leading-6">
            هذه الصفحة مخصصة لإدارة الموقع فقط
          </p>
        </form>
      </div>
    </div>
  )
}