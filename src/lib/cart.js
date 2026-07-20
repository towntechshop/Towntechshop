const MAIN_CART_KEY = 'website_cart'
const OLD_CART_KEY = 'towntech_cart'
export const CHECKOUT_ORDER_NOTES_KEY = 'checkout_order_notes'
export const PENDING_PAYMENT_KEY = 'pending_payment_order'
export const RECENT_ORDER_KEY = 'recent_placed_order'

function parseCart(rawCart) {
  try {
    const parsed = JSON.parse(rawCart)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getCartItems() {
  const mainCart = parseCart(localStorage.getItem(MAIN_CART_KEY))

  if (mainCart.length > 0) {
    return mainCart
  }

  const oldCart = parseCart(localStorage.getItem(OLD_CART_KEY))

  if (oldCart.length > 0) {
    localStorage.setItem(MAIN_CART_KEY, JSON.stringify(oldCart))
    return oldCart
  }

  return []
}

export function saveCartItems(items) {
  localStorage.setItem(MAIN_CART_KEY, JSON.stringify(items))
  localStorage.setItem(OLD_CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart-updated'))
}

export function getProductPrice(product) {
  return Number(product?.sale_price || product?.price || product?.regular_price || 0)
}

export function getCartCount() {
  return getCartItems().reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  )
}

export function getCartTotal() {
  return getCartItems().reduce((total, item) => {
    const price = getProductPrice(item)
    const quantity = Number(item.quantity || 1)
    return total + price * quantity
  }, 0)
}

export function getCartSubtotal() {
  return getCartTotal()
}

export function addToCart(product, quantity = 1) {
  const items = getCartItems()
  const price = getProductPrice(product)
  const existingItem = items.find((item) => item.id === product.id)

  if (existingItem) {
    const updatedItems = items.map((item) =>
      item.id === product.id
        ? {
            ...item,
            quantity: Number(item.quantity || 1) + Number(quantity || 1),
          }
        : item
    )

    saveCartItems(updatedItems)
    return updatedItems
  }

  const newItem = {
    id: product.id,
    title: product.title,
    brand: product.brand || '',
    sku: product.sku || '',
    image_url: product.image_url || '',
    price,
    sale_price: product.sale_price || null,
    regular_price: product.regular_price || product.price || price,
    quantity: Number(quantity || 1),
  }

  const updatedItems = [...items, newItem]
  saveCartItems(updatedItems)
  return updatedItems
}

export function updateCartItemQuantity(productId, quantity) {
  const items = getCartItems()
  const finalQuantity = Number(quantity || 1)

  if (finalQuantity <= 0) {
    return removeCartItem(productId)
  }

  const updatedItems = items.map((item) =>
    item.id === productId
      ? {
          ...item,
          quantity: finalQuantity,
        }
      : item
  )

  saveCartItems(updatedItems)
  return updatedItems
}

export function updateCartQuantity(productId, quantity) {
  return updateCartItemQuantity(productId, quantity)
}

export function removeCartItem(productId) {
  const items = getCartItems()
  const updatedItems = items.filter((item) => item.id !== productId)
  saveCartItems(updatedItems)
  return updatedItems
}

export function removeFromCart(productId) {
  return removeCartItem(productId)
}

export function clearCart() {
  saveCartItems([])
}

export function getCheckoutOrderNotes() {
  try {
    return localStorage.getItem(CHECKOUT_ORDER_NOTES_KEY)?.trim() || ''
  } catch {
    return ''
  }
}

export function setCheckoutOrderNotes(notes) {
  const value = String(notes || '').trim()

  if (value) {
    localStorage.setItem(CHECKOUT_ORDER_NOTES_KEY, value)
  } else {
    localStorage.removeItem(CHECKOUT_ORDER_NOTES_KEY)
  }
}

export function clearCheckoutOrderNotes() {
  localStorage.removeItem(CHECKOUT_ORDER_NOTES_KEY)
}

export function savePendingPaymentOrder(payload) {
  try {
    sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage errors
  }
}

export function readPendingPaymentOrder() {
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    return parsed
  } catch {
    return null
  }
}

export function clearPendingPaymentOrder() {
  try {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY)
  } catch {
    // ignore storage errors
  }
}

export function saveRecentPlacedOrder(payload) {
  try {
    sessionStorage.setItem(RECENT_ORDER_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage errors
  }
}

export function readRecentPlacedOrder() {
  try {
    const raw = sessionStorage.getItem(RECENT_ORDER_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    return parsed
  } catch {
    return null
  }
}

export function clearRecentPlacedOrder() {
  try {
    sessionStorage.removeItem(RECENT_ORDER_KEY)
  } catch {
    // ignore storage errors
  }
}