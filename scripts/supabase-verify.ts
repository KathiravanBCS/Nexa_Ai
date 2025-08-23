import { createClient } from "@supabase/supabase-js"

async function main() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()
  if (!url || !anon) {
    console.log("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    return
  }

  console.log("Testing connection to:", url)
  const supabase = createClient(url, anon)

  // 1) Select tables existence
  const { data: threads, error: selErr } = await supabase.from("threads").select("id, title, created_at").limit(1)
  if (selErr) {
    console.log("Select threads error:", selErr.message)
  } else {
    console.log("Threads OK. Sample:", threads)
  }

  // 2) Insert and cleanup a temp thread
  const title = "Connectivity Check " + new Date().toISOString()
  const { data: ins, error: insErr } = await supabase
    .from("threads")
    .insert({ title, user_id: null })
    .select("id")
    .single()
  if (insErr) {
    console.log("Insert threads error:", insErr.message)
  } else {
    console.log("Inserted thread id:", ins.id)
    await supabase.from("threads").delete().eq("id", ins.id)
  }
}

main().catch((e) => console.error("supabase-verify failed:", e))
