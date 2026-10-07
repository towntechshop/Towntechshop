import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import useSiteSettings from '../hooks/useSiteSettings'
import { getSiteFeatures } from '../lib/siteFeatures'
import SiteFeaturesSection from './components/SiteFeaturesSection'

export default function AdminSiteFeatures() {
  const { refetchSettings } = useSiteSettings()
  const [features, setFeatures] = useState(() => getSiteFeatures({}))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadFeatures = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('site_features')
        .eq('id', 1)
        .maybeSingle()

      if (error) {
        setErrorMessage(error.message)
      } else {
        setFeatures(getSiteFeatures(data || {}))
      }

      setLoading(false)
    }

    loadFeatures()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('site_settings')
      .update({ site_features: features })
      .eq('id', 1)

    if (error) {
      setErrorMessage(error.message || 'حدث خطأ أثناء الحفظ')
    } else {
      setMessage('تم حفظ مميزات الموقع، والتغييرات ظاهرة للعملاء دلوقتي')
      await refetchSettings?.()
    }

    setSaving(false)
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-slate-950">مميزات الموقع</h1>
        <p className="text-slate-500 mt-2 font-bold">
          شغّل أو اقفل أجزاء الموقع وعدّل نصوصها من مكان واحد.
        </p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 font-bold">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse">
          <div className="h-6 bg-slate-100 rounded w-48 mb-4" />
          <div className="h-20 bg-slate-100 rounded mb-3" />
          <div className="h-20 bg-slate-100 rounded" />
        </div>
      ) : (
        <SiteFeaturesSection value={features} onChange={setFeatures} />
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5 sticky bottom-4 z-10">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full md:w-auto bg-slate-950 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 disabled:opacity-60 transition"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ مميزات الموقع'}
        </button>
      </div>
    </div>
  )
}
