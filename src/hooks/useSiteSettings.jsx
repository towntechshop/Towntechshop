import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_NAVBAR_MENU_ITEMS } from '../lib/defaultNavbarMenuItems'
import {
  hasCachedNavbarMenu,
  readSiteSettingsCache,
  writeSiteSettingsCache,
} from '../lib/siteSettingsCache'
import { applySiteBranding } from '../lib/siteBranding'
import {
  STORE_EMAIL,
  STORE_FOOTER_DESCRIPTION,
  STORE_PHONES,
  STORE_WHATSAPP,
  formatStoreAddress,
} from '../lib/siteContent'

export const defaultSettings = {
  brand_name: 'Town Tech',
  brand_subtitle: 'كاميرات ومستلزمات إلكترونية',
  phone: STORE_PHONES[0],
  whatsapp: STORE_WHATSAPP,
  email: STORE_EMAIL,
  address: formatStoreAddress(),
  hero_title: '',
  hero_subtitle: '',
  hero_button_text: '',
  footer_description: STORE_FOOTER_DESCRIPTION,
  logo_url: '',
  hero_image_url: '',
  paymob_enabled: false,
  paymob_api_key: '',
  paymob_merchant_id: '',
  paymob_integration_id: '',
  paymob_iframe_id: '',
  paymob_hmac_secret: '',
  enable_vodafone_cash: false,
  enable_instapay: false,

  brand_area_width_desktop: 430,
  logo_desktop_width: 75,
  logo_desktop_height: 75,
  logo_mobile_width: 42,
  logo_mobile_height: 42,
  brand_text_size_desktop: 28,
  brand_text_size_mobile: 18,
  brand_subtitle_size_desktop: 13,
  brand_subtitle_size_mobile: 10,

  navbar_menu_items: DEFAULT_NAVBAR_MENU_ITEMS,
}

function mergeSettings(data) {
  if (!data || typeof data !== 'object') return defaultSettings

  return {
    ...defaultSettings,
    ...data,
    navbar_menu_items: Array.isArray(data.navbar_menu_items)
      ? data.navbar_menu_items
      : defaultSettings.navbar_menu_items,
  }
}

function getInitialSettings() {
  try {
    const cached = readSiteSettingsCache()
    if (hasCachedNavbarMenu(cached)) {
      return mergeSettings(cached)
    }
  } catch {
    // ignore broken cache
  }

  return defaultSettings
}

function getInitialMenuReady() {
  try {
    return hasCachedNavbarMenu(readSiteSettingsCache())
  } catch {
    return false
  }
}

const fallbackContext = {
  settings: defaultSettings,
  loading: true,
  menuReady: false,
  refetchSettings: async () => {},
}

const SiteSettingsContext = createContext(fallbackContext)

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(getInitialSettings)
  const [loading, setLoading] = useState(true)
  const [menuReady, setMenuReady] = useState(getInitialMenuReady)

  useEffect(() => {
    applySiteBranding(settings)
  }, [settings.brand_name, settings.logo_url])

  useEffect(() => {
    let cancelled = false

    const loadSettings = async () => {
      if (!getInitialMenuReady()) {
        setLoading(true)
      }

      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (!cancelled && !error && data) {
          const merged = mergeSettings(data)
          setSettings(merged)
          writeSiteSettingsCache(merged)
        }
      } catch {
        // keep defaults / cache on network errors
      }

      if (!cancelled) {
        setMenuReady(true)
        setLoading(false)
      }
    }

    loadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      settings,
      loading,
      menuReady,
      refetchSettings: async () => {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (!error && data) {
          const merged = mergeSettings(data)
          setSettings(merged)
          writeSiteSettingsCache(merged)
          setMenuReady(true)
          setLoading(false)
        }
      },
    }),
    [settings, loading, menuReady]
  )

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export default function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
