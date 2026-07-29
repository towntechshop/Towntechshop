import { createClient } from '@supabase/supabase-js'

export function resolveSupabaseConfig(env = import.meta.env) {
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = (
    env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    env.VITE_SUPABASE_ANON_KEY?.trim() ||
    env.SUPABASE_ANON_KEY?.trim() ||
    env.SUPABASE_PUBLISHABLE_KEY?.trim()
  )

  return { url, key }
}

const { url: supabaseUrl, key: supabaseKey } = resolveSupabaseConfig()

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase env vars. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')
