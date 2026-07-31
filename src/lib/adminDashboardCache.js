const DASHBOARD_CACHE_KEY = 'admin_dashboard_cache_v1'
const DEFAULT_TTL_MS = 1000 * 60 * 5

const memoryStorage = new Map()

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  return {
    getItem(key) {
      return memoryStorage.has(key) ? memoryStorage.get(key) : null
    },
    setItem(key, value) {
      memoryStorage.set(key, String(value))
    },
    removeItem(key) {
      memoryStorage.delete(key)
    },
  }
}

export function getDashboardCache() {
  try {
    const storage = getStorage()
    const cached = storage.getItem(DASHBOARD_CACHE_KEY)

    if (!cached) return null

    return JSON.parse(cached)
  } catch {
    return null
  }
}

export function setDashboardCache(data, ttlMs = DEFAULT_TTL_MS) {
  try {
    const storage = getStorage()
    const payload = {
      timestamp: Date.now(),
      ttlMs,
      data,
    }

    storage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload))
    return payload
  } catch {
    return null
  }
}

export function isDashboardCacheValid(cache, ttlMs = DEFAULT_TTL_MS) {
  if (!cache?.timestamp || !Number.isFinite(cache.timestamp)) return false
  if (!cache?.data) return false

  const age = Date.now() - cache.timestamp
  return age <= ttlMs
}

export function clearDashboardCache() {
  try {
    getStorage().removeItem(DASHBOARD_CACHE_KEY)
  } catch {
    // ignore storage errors
  }
}
