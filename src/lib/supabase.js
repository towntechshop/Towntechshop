import { createClient } from '@supabase/supabase-js'

export function resolveSupabaseConfig(env = import.meta.env) {
  const safeEnv = env || {}
  const url = safeEnv.VITE_SUPABASE_URL?.trim()
  const key = (
    safeEnv.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    safeEnv.VITE_SUPABASE_ANON_KEY?.trim() ||
    safeEnv.SUPABASE_ANON_KEY?.trim() ||
    safeEnv.SUPABASE_PUBLISHABLE_KEY?.trim()
  )

  return { url, key }
}

const { url: supabaseUrl, key: supabaseKey } = resolveSupabaseConfig()

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase env vars. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export function getSupabaseStorageHint(bucketName) {
  return `إذا كان رفع الصورة يفشل، فتحقق من إنشاء bucket باسم "${bucketName}" في Supabase Storage وجعله Public.`
}
