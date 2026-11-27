import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === 'https://placeholder.supabase.co' ||
  supabaseAnonKey === 'placeholder-key'

if (isPlaceholder) {
  console.warn(
    '[GenZone Admin] Supabase env vars are not configured.\n' +
      'Create backend/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

// Always create a client — requests will fail gracefully if keys are wrong
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
)

/** True when real Supabase credentials are not yet configured */
export const isSupabaseConfigured = !isPlaceholder
