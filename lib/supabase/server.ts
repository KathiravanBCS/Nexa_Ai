import { createClient } from "@supabase/supabase-js"

export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    // Return a client that points nowhere to avoid crashes in preview
    return createClient("https://example.supabase.co", "public-anon-key")
  }
  return createClient(url, anon, { auth: { persistSession: false } })
}

export function supabaseEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
