import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mergeContactPage } from '../lib/contactPageDefaults'

export default function useContactPage() {
  const [contactPage, setContactPage] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadContactPage = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('site_settings')
      .select('contact_page')
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      setContactPage(mergeContactPage(data.contact_page))
    } else {
      setContactPage(mergeContactPage(null))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadContactPage()
  }, [])

  return { contactPage, loading, refetchContactPage: loadContactPage }
}
