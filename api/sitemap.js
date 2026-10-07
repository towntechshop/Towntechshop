// sitemap.xml ديناميكي: الصفحات الثابتة + كل الأقسام الظاهرة + كل المنتجات الظاهرة
const SITE_URL = 'https://www.towntechshop.com'

const STATIC_PATHS = [
  '/',
  '/products',
  '/about',
  '/our-work',
  '/reviews',
  '/contact',
  '/privacy-policy',
  '/return-policy',
  '/shipping-policy',
  '/terms',
]

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function urlEntry(path, lastmod) {
  const loc = escapeXml(`${SITE_URL}${path}`)
  const lastmodTag = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''
  return `<url><loc>${loc}</loc>${lastmodTag}</url>`
}

async function fetchRows(supabaseUrl, supabaseKey, query) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  })

  if (!response.ok) return []
  return response.json()
}

export default async function handler() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  const entries = STATIC_PATHS.map((path) => urlEntry(path))

  if (supabaseUrl && supabaseKey) {
    try {
      const [products, categories] = await Promise.all([
        fetchRows(
          supabaseUrl,
          supabaseKey,
          'products?select=id,category_id,updated_at,created_at&is_visible=eq.true&order=created_at.desc&limit=5000'
        ),
        fetchRows(
          supabaseUrl,
          supabaseKey,
          'categories?select=id,slug,parent_id&is_active=eq.true'
        ),
      ])

      const usedCategoryIds = new Set(products.map((product) => product.category_id))
      const byId = Object.fromEntries(categories.map((category) => [category.id, category]))

      categories.forEach((category) => {
        if (!category.slug) return

        if (!category.parent_id) {
          const hasProducts =
            usedCategoryIds.has(category.id) ||
            categories.some(
              (child) => child.parent_id === category.id && usedCategoryIds.has(child.id)
            )
          if (hasProducts) {
            entries.push(urlEntry(`/category/${encodeURIComponent(category.slug)}`))
          }
          return
        }

        const parent = byId[category.parent_id]
        if (parent?.slug && usedCategoryIds.has(category.id)) {
          entries.push(
            urlEntry(
              `/category/${encodeURIComponent(parent.slug)}/${encodeURIComponent(category.slug)}`
            )
          )
        }
      })

      products.forEach((product) => {
        entries.push(urlEntry(`/products/${product.id}`, product.updated_at || product.created_at))
      })
    } catch {
      // نرجّع الصفحات الثابتة بس لو حصل خطأ
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export const config = {
  runtime: 'edge',
}
