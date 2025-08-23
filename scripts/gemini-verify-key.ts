async function main() {
  const key = (process.env.GEMINI_API_KEY || "").trim()
  if (!key) {
    console.log("GEMINI_API_KEY missing")
    return
  }
  const url = "https://generativelanguage.googleapis.com/v1beta/models"
  console.log("Checking key against:", url)
  const res = await fetch(url, { headers: { "X-goog-api-key": key } })
  let body: any = null
  try {
    body = await res.json()
  } catch {
    body = { note: "No JSON body" }
  }
  console.log("HTTP:", res.status, res.statusText)
  if (res.ok) {
    console.log("OK. models count:", Array.isArray(body?.models) ? body.models.length : 0)
  } else {
    console.log("Error body:", body)
  }
}

main().catch((e) => console.error("verify-key failed:", e))
