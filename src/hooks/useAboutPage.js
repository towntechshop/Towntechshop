import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mergeAboutPage } from '../lib/aboutPageDefaults'

export default function useAboutPage() {
  const [aboutPage, setAboutPage] = useState(null)
  const [brandName, setBrandName] = useState('Town Tech')
  const [loading, setLoading] = useState(true)

  const loadAboutPage = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('site_settings')
      .select('brand_name, about_page')
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      const name = data.brand_name || 'Town Tech'
      setBrandName(name)
      setAboutPage(mergeAboutPage(data.about_page, name))
    } else {
      setAboutPage(mergeAboutPage(null))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadAboutPage()
  }, [])

  return { aboutPage, brandName, loading, refetchAboutPage: loadAboutPage }
}
