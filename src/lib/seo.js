import { STORE_ABOUT_TEXT, STORE_SEO_DESCRIPTION } from './siteContent'

export const SITE_URL = 'https://www.towntechshop.com'

function splitIntoSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?؟])\s+/)
    .filter(Boolean)
}

export function truncateDescription(text, maxLength = 320) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!clean) return ''
  if (clean.length <= maxLength) return clean

  return `${clean.slice(0, maxLength - 1).trim()}…`
}

export function getAboutDescription(settings = {}) {
  const introContent = settings?.about_page?.intro?.content
  const source = introContent || STORE_ABOUT_TEXT
  const sentences = splitIntoSentences(source)

  if (sentences.length >= 2) {
    return truncateDescription(`${sentences[0]} ${sentences[1]}`)
  }

  return truncateDescription(STORE_SEO_DESCRIPTION)
}

export function buildAggregateRating(reviews = []) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return null
  }

  const total = reviews.reduce(
    (sum, review) => sum + Number(review.rating || 0),
    0
  )
  const count = reviews.length
  const average = total / count

  return {
    '@type': 'AggregateRating',
    ratingValue: average.toFixed(1),
    reviewCount: String(count),
    bestRating: '5',
    worstRating: '1',
  }
}

export function buildOrganizationSchema({
  brandName,
  description,
  logoUrl,
  reviews = [],
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: brandName || 'Town Tech',
    url: SITE_URL,
    description,
    image: logoUrl || `${SITE_URL}/brand-icon.jpeg`,
    logo: logoUrl || `${SITE_URL}/brand-icon.jpeg`,
    inLanguage: 'ar-EG',
  }

  const aggregateRating = buildAggregateRating(reviews)

  if (aggregateRating) {
    schema.aggregateRating = aggregateRating
  }

  return schema
}

export function buildReviewSchemas(reviews = [], brandName = 'Town Tech') {
  return reviews.slice(0, 10).map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Store',
      name: brandName,
    },
    author: {
      '@type': 'Person',
      name: review.customer_name || 'عميل',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: String(review.rating || 5),
      bestRating: '5',
      worstRating: '1',
    },
    reviewBody: review.review_text,
    datePublished: review.created_at,
  }))
}
