import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getPageDefault } from '../lib/siteContent'

export default function DynamicPage({ slug }) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  const getPage = async () => {
    setLoading(true)

    const fallback = getPageDefault(slug)

    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()

    if (error || !data) {
      setPage(fallback)
    } else {
      setPage({
        ...data,
        title: data.title || fallback?.title || slug,
        content: data.content?.trim() || fallback?.content || '',
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    getPage()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500 font-bold">جاري تحميل الصفحة...</p>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <h1 className="text-3xl font-black mb-4 text-slate-900">الصفحة غير موجودة</h1>

        <Link to="/" className="text-sky-600 hover:underline font-bold">
          العودة للرئيسية
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-slate-100 px-6 py-16">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow p-8 md:p-12">
        <h1 className="text-4xl font-black text-slate-900 mb-6">
          {page.title}
        </h1>

        <div className="text-slate-600 text-lg leading-8 whitespace-pre-line">
          {page.content}
        </div>
      </div>
    </div>
  )
}
