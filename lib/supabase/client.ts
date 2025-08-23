import { createClient } from "@supabase/supabase-js"

let supabase: ReturnType<typeof createClient> | null = null

export function getThreadsClient() {
  if (supabase) return supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    // Dummy client to avoid runtime errors in preview; queries will just fail silently
    supabase = createClient("https://example.supabase.co", "public-anon-key")
    return supabase
  }
  supabase = createClient(url, anon)
  return supabase
}
