export function getProductPrice(product) {
  return Number(
    product?.sale_price || product?.price || product?.regular_price || 0
  )
}

export function getRegularPrice(product) {
  return Number(product?.regular_price || product?.price || 0)
}

export function hasSale(product) {
  const salePrice = Number(product?.sale_price || 0)
  const regularPrice = Number(product?.regular_price || product?.price || 0)

  return salePrice > 0 && regularPrice > salePrice
}

export function getSavedAmount(product) {
  if (!hasSale(product)) return 0

  return getRegularPrice(product) - getProductPrice(product)
}

export function isProductInStock(product) {
  if (product?.is_in_stock === false) return false
  return true
}

export function formatPrice(amount) {
  return Number(amount || 0).toLocaleString('en-US')
}
