import test from 'node:test'
import assert from 'node:assert/strict'
import { getStorageUploadErrorMessage } from './storage.js'

test('explains storage permission issues clearly', () => {
  const message = getStorageUploadErrorMessage({
    message: 'new row violates row-level security policy',
  }, 'product-images')

  assert.match(message, /product-images/i)
  assert.match(message, /bucket|policy|write/i)
})

test('explains missing bucket issues clearly', () => {
  const message = getStorageUploadErrorMessage({
    message: 'Bucket not found',
  }, 'product-images')

  assert.match(message, /product-images/i)
  assert.match(message, /bucket/i)
})
