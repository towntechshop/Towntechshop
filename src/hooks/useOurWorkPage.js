import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mergeOurWorkPage } from '../lib/ourWorkPageDefaults'

export default function useOurWorkPage() {
  const [ourWorkPage, setOurWorkPage] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadOurWorkPage = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('site_settings')
      .select('our_work_page')
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      setOurWorkPage(mergeOurWorkPage(data.our_work_page))
    } else {
      setOurWorkPage(mergeOurWorkPage(null))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadOurWorkPage()
  }, [])

  return { ourWorkPage, loading, refetchOurWorkPage: loadOurWorkPage }
}
