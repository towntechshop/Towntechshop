function upsertLink(rel, href, type) {
  if (!href) return

  let link = document.querySelector(`link[rel="${rel}"]`)

  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.appendChild(link)
  }

  link.href = href

  if (type) {
    link.type = type
  } else {
    link.removeAttribute('type')
  }
}

function getIconType(url) {
  const cleanUrl = String(url || '').split('?')[0].toLowerCase()

  if (cleanUrl.endsWith('.svg')) return 'image/svg+xml'
  if (cleanUrl.endsWith('.png')) return 'image/png'
  if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) return 'image/jpeg'
  if (cleanUrl.endsWith('.webp')) return 'image/webp'

  return null
}

export function applySiteBranding(settings = {}) {
  const brandName = settings.brand_name?.trim()
  const logoUrl = settings.logo_url?.trim()
  const iconHref = logoUrl || '/brand-icon.jpeg'

  if (brandName) {
    document.title = brandName
  }

  const iconType = logoUrl ? getIconType(logoUrl) : 'image/jpeg'
  upsertLink('icon', iconHref, iconType)
  upsertLink('shortcut icon', iconHref, iconType)
  upsertLink('apple-touch-icon', iconHref, iconType)
}
