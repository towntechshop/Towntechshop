// معاينة رابط المنتج لما يتشارك على واتساب / فيسبوك / تيليجرام
// (برامج المعاينة مش بتشغّل JavaScript، فبنرجّع لها صفحة صغيرة فيها اسم المنتج وصورته وسعره)
const SITE_URL = 'https://www.towntechshop.com'

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function handler(request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id') || ''
  const pageUrl = `${SITE_URL}/products/${encodeURIComponent(id)}`

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  let product = null
  let brandName = 'Town Tech'

  if (supabaseUrl && supabaseKey && /^[0-9a-f-]{36}$/i.test(id)) {
    try {
      const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      const [productResponse, settingsResponse] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/products?select=title,description,image_url,price,sale_price,regular_price&id=eq.${id}&is_visible=eq.true&limit=1`,
          { headers }
        ),
        fetch(`${supabaseUrl}/rest/v1/site_settings?select=brand_name&limit=1`, { headers }),
      ])

      if (productResponse.ok) product = (await productResponse.json())?.[0] || null
      if (settingsResponse.ok) brandName = (await settingsResponse.json())?.[0]?.brand_name || brandName
    } catch {
      product = null
    }
  }

  const price = Number(product?.sale_price || product?.price || product?.regular_price || 0)
  const title = product ? `${product.title} | ${brandName}` : brandName
  const description = product
    ? `${price ? `السعر: ${price.toLocaleString('en-US')} جنيه. ` : ''}${String(product.description || '').slice(0, 150)}`
    : 'أنظمة المراقبة والإلكترونيات'
  const image = product?.image_url || `${SITE_URL}/brand-icon.jpeg`

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="${escapeHtml(brandName)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta property="og:locale" content="ar_EG" />
${price ? `<meta property="product:price:amount" content="${price}" />\n<meta property="product:price:currency" content="EGP" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<link rel="canonical" href="${escapeHtml(pageUrl)}" />
</head>
<body>
<h1>${escapeHtml(product?.title || brandName)}</h1>
<p>${escapeHtml(description)}</p>
<a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a>
</body>
</html>`

  return new Response(html, {
    status: product ? 200 : 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  })
}

export const config = {
  runtime: 'edge',
}
