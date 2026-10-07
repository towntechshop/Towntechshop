import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import useSiteSettings from '../hooks/useSiteSettings'
import { initAnalytics, trackPageView } from '../lib/analytics'

// بيشغّل Google Analytics و Meta Pixel لو أرقامهم متسجلة في لوحة التحكم
export default function AnalyticsTracker() {
  const { features } = useSiteSettings()
  const location = useLocation()
  const gaId = features.ga4_id
  const pixelId = features.meta_pixel_id

  useEffect(() => {
    initAnalytics({ gaId, pixelId })
  }, [gaId, pixelId])

  useEffect(() => {
    if (!gaId && !pixelId) return
    trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search, gaId, pixelId])

  return null
}
