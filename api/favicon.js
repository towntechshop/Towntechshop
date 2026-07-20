export default async function handler(request) {
  const fallbackUrl = new URL('/brand-icon.jpeg', request.url)

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const settingsResponse = await fetch(
        `${supabaseUrl}/rest/v1/site_settings?select=logo_url&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      )

      if (settingsResponse.ok) {
        const settings = await settingsResponse.json()
        const logoUrl = settings?.[0]?.logo_url

        if (typeof logoUrl === 'string' && logoUrl.trim()) {
          const imageResponse = await fetch(logoUrl.trim())

          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer()

            return new Response(imageBuffer, {
              status: 200,
              headers: {
                'Content-Type':
                  imageResponse.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
              },
            })
          }
        }
      }
    }
  } catch {
    // use static brand icon below
  }

  return Response.redirect(fallbackUrl, 302)
}

export const config = {
  runtime: 'edge',
}
