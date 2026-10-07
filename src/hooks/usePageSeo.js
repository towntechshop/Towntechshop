import { useEffect } from 'react'
import { SITE_URL, truncateDescription } from '../lib/seo'
import useSiteSettings from './useSiteSettings'

function upsertMeta(name, content, attribute = 'name') {
  if (!content) return

  let tag = document.querySelector(`meta[${attribute}="${name}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, name)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function upsertCanonical(href) {
  let tag = document.querySelector('link[rel="canonical"]')

  if (!tag) {
    tag = document.createElement('link')
    tag.rel = 'canonical'
    document.head.appendChild(tag)
  }

  tag.href = href
}

// صفحات بتحدد عنوانها ووصفها بنفسها (المنتج / القسم)
export const SELF_MANAGED_SEO_PREFIXES = ['/products/', '/category/']

export function isSelfManagedSeoPath(pathname) {
  return SELF_MANAGED_SEO_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export default function usePageSeo({ title, description, image, path, type = 'website', jsonLd }) {
  const { settings } = useSiteSettings()
  const brandName = settings?.brand_name || 'Town Tech'
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    if (!title) return

    const fullTitle = `${title} | ${brandName}`
    const url = `${SITE_URL}${path || window.location.pathname}`
    const cleanDescription = truncateDescription(description || '', 160)

    document.title = fullTitle

    upsertMeta('description', cleanDescription)
    upsertMeta('og:title', fullTitle, 'property')
    upsertMeta('og:description', cleanDescription, 'property')
    upsertMeta('og:type', type, 'property')
    upsertMeta('og:url', url, 'property')
    upsertMeta('og:image', image, 'property')
    upsertMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    upsertMeta('twitter:title', fullTitle)
    upsertMeta('twitter:description', cleanDescription)
    upsertMeta('twitter:image', image)
    upsertCanonical(url)

    let script = null

    if (jsonLdString) {
      script = document.getElementById('seo-page-schema')

      if (!script) {
        script = document.createElement('script')
        script.id = 'seo-page-schema'
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }

      script.textContent = jsonLdString
    }

    return () => {
      document.getElementById('seo-page-schema')?.remove()
    }
  }, [title, description, image, path, type, jsonLdString, brandName])
}
