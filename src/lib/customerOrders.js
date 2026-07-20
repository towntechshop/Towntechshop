import { supabase } from './supabase'

const CUSTOMER_ORDERS_KEY = 'customer_orders'
const MAX_STORED_ORDERS = 30

function parseOrders(rawValue) {
  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getCustomerOrders() {
  try {
    const orders = parseOrders(localStorage.getItem(CUSTOMER_ORDERS_KEY))
    return orders.sort(
      (a, b) => new Date(b.placedAt || 0).getTime() - new Date(a.placedAt || 0).getTime()
    )
  } catch {
    return []
  }
}

export function saveCustomerOrder(payload) {
  const orderId = payload?.orderId
  const orderNumber = payload?.orderNumber?.trim()
  const phone = payload?.phone?.trim()

  if (!orderId || !orderNumber || !phone) {
    return getCustomerOrders()
  }

  const entry = {
    orderId,
    orderNumber,
    phone,
    totalAmount: Number(payload.totalAmount || 0),
    placedAt: payload.placedAt || new Date().toISOString(),
  }

  const existing = getCustomerOrders().filter(
    (order) => order.orderId !== orderId && order.orderNumber !== orderNumber
  )

  const updated = [entry, ...existing].slice(0, MAX_STORED_ORDERS)

  try {
    localStorage.setItem(CUSTOMER_ORDERS_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('customer-orders-updated'))
  } catch {
    // ignore storage errors
  }

  return updated
}

export async function fetchCustomerOrderDetails(order) {
  const { data, error } = await supabase.rpc('lookup_guest_order', {
    p_order_number: order.orderNumber,
    p_phone: order.phone,
  })

  if (error) {
    throw error
  }

  return data
}
