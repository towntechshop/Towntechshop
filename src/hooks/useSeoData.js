import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { readSiteSettingsCache } from '../lib/siteSettingsCache'
import { STORE_ABOUT_TEXT } from '../lib/siteContent'
import { getAboutDescription } from '../lib/seo'

export function useSeoData() {
  const [seoData, setSeoData] = useState(() => {
    const cached = readSiteSettingsCache()

    return {
      brandName: cached?.brand_name || 'Town Tech',
      description: getAboutDescription(cached || {}),
      logoUrl: cached?.logo_url || `${window.location.origin}/brand-icon.jpeg`,
      reviews: [],
      loading: true,
    }
  })

  useEffect(() => {
    let cancelled = false

    const loadSeoData = async () => {
      try {
        const [settingsResult, reviewsResult] = await Promise.all([
          supabase
            .from('site_settings')
            .select('brand_name, logo_url, footer_description, about_page')
            .limit(1)
            .maybeSingle(),
          supabase
            .from('reviews')
            .select('customer_name, rating, review_text, created_at')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(20),
        ])

        if (cancelled) return

        const settings = settingsResult.data || readSiteSettingsCache() || {}
        const reviews = reviewsResult.data || []

        setSeoData({
          brandName: settings.brand_name || 'Town Tech',
          description:
            getAboutDescription(settings) ||
            truncateFallback(settings.footer_description || STORE_ABOUT_TEXT),
          logoUrl:
            settings.logo_url ||
            `${window.location.origin}/brand-icon.jpeg`,
          reviews,
          loading: false,
        })
      } catch {
        if (!cancelled) {
          setSeoData((prev) => ({ ...prev, loading: false }))
        }
      }
    }

    loadSeoData()

    return () => {
      cancelled = true
    }
  }, [])

  return seoData
}

function truncateFallback(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}
