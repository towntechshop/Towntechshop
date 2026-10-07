// تتبع الزيارات والمبيعات (Google Analytics 4 + Meta Pixel)
// الأرقام بتتحط من لوحة التحكم ← مميزات الموقع ← أدوات القياس

let loaded = { ga: null, pixel: null }

export function initAnalytics({ gaId, pixelId }) {
  if (typeof window === 'undefined') return

  const cleanGa = String(gaId || '').trim()
  const cleanPixel = String(pixelId || '').trim()

  if (cleanGa && /^G-[A-Z0-9]+$/i.test(cleanGa) && loaded.ga !== cleanGa) {
    loaded.ga = cleanGa
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cleanGa)}`
    document.head.appendChild(script)
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', cleanGa, { send_page_view: false })
  }

  if (cleanPixel && /^\d{6,20}$/.test(cleanPixel) && loaded.pixel !== cleanPixel) {
    loaded.pixel = cleanPixel
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = !0
      n.version = '2.0'
      n.queue = []
      t = b.createElement(e)
      t.async = !0
      t.src = v
      s = b.getElementsByTagName(e)[0]
      s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    /* eslint-enable */
    window.fbq('init', cleanPixel)
  }
}

export function trackPageView(path) {
  try {
    window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href })
    window.fbq?.('track', 'PageView')
  } catch {
    // ignore
  }
}

export function trackAddToCart(product, quantity = 1) {
  try {
    const price = Number(product?.sale_price || product?.price || product?.regular_price || 0)
    window.gtag?.('event', 'add_to_cart', {
      currency: 'EGP',
      value: price * quantity,
      items: [{ item_id: product?.id, item_name: product?.title, price, quantity }],
    })
    window.fbq?.('track', 'AddToCart', {
      content_ids: [product?.id],
      content_name: product?.title,
      content_type: 'product',
      value: price * quantity,
      currency: 'EGP',
    })
  } catch {
    // ignore
  }
}

export function trackBeginCheckout(value, itemsCount) {
  try {
    window.gtag?.('event', 'begin_checkout', { currency: 'EGP', value })
    window.fbq?.('track', 'InitiateCheckout', { value, currency: 'EGP', num_items: itemsCount })
  } catch {
    // ignore
  }
}

export function trackPurchase({ orderId, orderNumber, value }) {
  try {
    const key = `tracked-purchase-${orderId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    // ignore
  }

  try {
    window.gtag?.('event', 'purchase', {
      transaction_id: orderNumber || orderId,
      currency: 'EGP',
      value: Number(value || 0),
    })
    window.fbq?.('track', 'Purchase', { value: Number(value || 0), currency: 'EGP' })
  } catch {
    // ignore
  }
}
