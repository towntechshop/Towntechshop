import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

async function checkIsAdmin() {
  const { data, error } = await supabase.rpc('is_admin')

  if (error) {
    console.error(error)
    return false
  }

  return Boolean(data)
}

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true

    const evaluateSession = async (nextSession) => {
      if (!active) return

      setSession(nextSession)

      if (!nextSession) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setLoading(true)
      const admin = await checkIsAdmin()

      if (!active) return

      setIsAdmin(admin)
      setLoading(false)
    }

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession()
      await evaluateSession(data.session)
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      evaluateSession(nextSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-slate-500 font-bold">جاري التحقق من الجلسة...</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-100 px-4"
        dir="rtl"
      >
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <h1 className="text-2xl font-black text-slate-950 mb-3">
            غير مصرح بالدخول
          </h1>
          <p className="text-slate-500 font-bold leading-8 mb-6">
            هذا الحساب ليس ضمن قائمة مديري لوحة التحكم. تواصل مع مسؤول الموقع
            لإضافة حسابك.
          </p>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/admin/login'
            }}
            className="w-full bg-slate-950 text-white py-3 rounded-2xl font-black hover:bg-slate-800 transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    )
  }

  return children
}
