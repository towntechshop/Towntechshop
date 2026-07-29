import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveSupabaseConfig } from './supabase.js'

test('prefers the publishable key when the anon key is missing', () => {
  const result = resolveSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
  })

  assert.deepEqual(result, {
    url: 'https://example.supabase.co',
    key: 'publishable-test-key',
  })
})

test('falls back to the anon key when the publishable key is missing', () => {
  const result = resolveSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'anon-test-key',
  })

  assert.deepEqual(result, {
    url: 'https://example.supabase.co',
    key: 'anon-test-key',
  })
})
