const CACHE_KEY = 'town-tech-site-settings-v1'

const CACHE_FIELDS = [
  'brand_name',
  'brand_subtitle',
  'logo_url',
  'navbar_menu_items',
  'footer_description',
  'about_page',
  'hero_title',
  'hero_subtitle',
  'hero_button_text',
  'hero_image_url',
  'brand_area_width_desktop',
  'logo_desktop_width',
  'logo_desktop_height',
  'logo_mobile_width',
  'logo_mobile_height',
  'brand_text_size_desktop',
  'brand_text_size_mobile',
  'brand_subtitle_size_desktop',
  'brand_subtitle_size_mobile',
  'phone',
  'whatsapp',
  'email',
  'address',
]

export function pickCacheableSettings(data) {
  if (!data || typeof data !== 'object') return null

  const cached = {}

  CACHE_FIELDS.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      cached[field] = data[field]
    }
  })

  return cached
}

export function readSiteSettingsCache() {
  try {
    if (typeof localStorage === 'undefined') return null

    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    return parsed
  } catch {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(CACHE_KEY)
      }
    } catch {
      // ignore
    }

    return null
  }
}

export function writeSiteSettingsCache(data) {
  try {
    if (typeof localStorage === 'undefined') return

    const cached = pickCacheableSettings(data)
    if (!cached) return

    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch {
    // ignore quota / private mode errors
  }
}

export function hasCachedNavbarMenu(cached) {
  return (
    Array.isArray(cached?.navbar_menu_items) &&
    cached.navbar_menu_items.some((item) => item?.label?.trim())
  )
}

export function clearSiteSettingsCache() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CACHE_KEY)
    }
  } catch {
    // ignore
  }
}
