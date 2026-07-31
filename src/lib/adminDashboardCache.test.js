import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clearDashboardCache,
  getDashboardCache,
  isDashboardCacheValid,
  setDashboardCache,
} from './adminDashboardCache.js'

test('stores and retrieves dashboard cache data', () => {
  clearDashboardCache()

  const payload = { stats: { totalProducts: 12 }, recentProducts: [] }
  setDashboardCache(payload)

  const cached = getDashboardCache()

  assert.ok(cached)
  assert.deepEqual(cached.data, payload)
})

test('marks cache as expired when it is older than the allowed lifetime', () => {
  const expiredCache = {
    timestamp: Date.now() - 1000 * 60 * 10,
    data: { stats: { totalProducts: 2 } },
  }

  assert.equal(isDashboardCacheValid(expiredCache, 1000 * 60 * 5), false)
})
