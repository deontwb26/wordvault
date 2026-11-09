// One shared Supabase client. Keys come from .env.local (see .env.example).
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && key)

// If keys are missing we still create a client with dummy values so the app
// loads; the sign-in screen then explains what's missing.
export const supabase = createClient(url || 'http://localhost', key || 'missing-key')
