import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  SITE_URL,
  buildOrganizationSchema,
  buildReviewSchemas,
} from '../lib/seo'
import { useSeoData } from '../hooks/useSeoData'

const PAGE_TITLES = {
  '/': null,
  '/products': 'المنتجات',
  '/about': 'من نحن',
  '/our-work': 'أعمالنا',
  '/contact': 'تواصل معنا',
  '/reviews': 'آراء العملاء',
  '/my-orders': 'طلباتي',
  '/cart': 'عربة التسوق',
  '/checkout': 'إتمام الطلب',
}

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

function upsertLink(rel, href) {
  if (!href) return

  let tag = document.querySelector(`link[rel="${rel}"]`)

  if (!tag) {
    tag = document.createElement('link')
    tag.rel = rel
    document.head.appendChild(tag)
  }

  tag.href = href
}

function upsertJsonLd(id, data) {
  let script = document.getElementById(id)

  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  script.textContent = JSON.stringify(data)
}

export default function SeoHead() {
  const location = useLocation()
  const { brandName, description, logoUrl, reviews } = useSeoData()

  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname]
    const fullTitle = pageTitle ? `${pageTitle} | ${brandName}` : brandName
    const pageUrl = `${SITE_URL}${location.pathname === '/' ? '' : location.pathname}`
    const imageUrl = logoUrl.startsWith('http')
      ? logoUrl
      : `${SITE_URL}${logoUrl}`

    document.title = fullTitle

    upsertMeta('description', description)
    upsertMeta('og:title', fullTitle, 'property')
    upsertMeta('og:description', description, 'property')
    upsertMeta('og:type', 'website', 'property')
    upsertMeta('og:url', pageUrl, 'property')
    upsertMeta('og:image', imageUrl, 'property')
    upsertMeta('og:locale', 'ar_EG', 'property')
    upsertMeta('twitter:card', 'summary')
    upsertMeta('twitter:title', fullTitle)
    upsertMeta('twitter:description', description)
    upsertMeta('twitter:image', imageUrl)

    upsertLink('canonical', pageUrl)

    upsertJsonLd(
      'seo-organization-schema',
      buildOrganizationSchema({
        brandName,
        description,
        logoUrl: imageUrl,
        reviews,
      })
    )

    if (reviews.length > 0) {
      upsertJsonLd('seo-reviews-schema', buildReviewSchemas(reviews, brandName))
    } else {
      document.getElementById('seo-reviews-schema')?.remove()
    }
  }, [brandName, description, logoUrl, reviews, location.pathname])

  return null
}
