import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend .env')
}

// Anon client for public reads (posts, comments) — RLS applies with anon role
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Per-request client that forwards the caller's JWT so Supabase RLS sees the real user
export const createUserClient = (token: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
