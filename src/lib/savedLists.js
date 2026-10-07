// المفضلة والمقارنة — محفوظة في متصفح العميل
const LISTS = {
  wishlist: { key: 'town-tech-wishlist', event: 'wishlist-updated', max: 100 },
  compare: { key: 'town-tech-compare', event: 'compare-updated', max: 4 },
}

function read(name) {
  try {
    const raw = localStorage.getItem(LISTS[name].key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(name, items) {
  try {
    localStorage.setItem(LISTS[name].key, JSON.stringify(items))
  } catch {
    // التخزين مقفول في المتصفح
  }
  window.dispatchEvent(new Event(LISTS[name].event))
}

function snapshot(product) {
  return {
    id: product.id,
    title: product.title,
    image_url: product.image_url || '',
    price: product.price ?? null,
    sale_price: product.sale_price ?? null,
    regular_price: product.regular_price ?? null,
    sku: product.sku || '',
    brand: product.brand || '',
    is_in_stock: product.is_in_stock !== false,
    added_at: Date.now(),
  }
}

export function getSavedList(name) {
  return read(name)
}

export function isInList(name, productId) {
  return read(name).some((item) => item.id === productId)
}

// بيرجّع { added, full }
export function toggleInList(name, product) {
  const items = read(name)

  if (items.some((item) => item.id === product.id)) {
    write(name, items.filter((item) => item.id !== product.id))
    return { added: false, full: false }
  }

  if (items.length >= LISTS[name].max) {
    return { added: false, full: true }
  }

  write(name, [...items, snapshot(product)])
  return { added: true, full: false }
}

export function removeFromList(name, productId) {
  write(name, read(name).filter((item) => item.id !== productId))
}

export function clearList(name) {
  write(name, [])
}

export function listEventName(name) {
  return LISTS[name].event
}

export const COMPARE_MAX = LISTS.compare.max
