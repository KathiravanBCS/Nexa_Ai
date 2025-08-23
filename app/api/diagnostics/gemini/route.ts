export async function GET() {
  // Disable in production for safety
  if (process.env.NODE_ENV === "production") {
    return new Response("Not available in production", { status: 404 })
  }

  const key = (process.env.GEMINI_API_KEY || "").trim()
  if (!key) {
    return new Response(JSON.stringify({ ok: false, reason: "Missing GEMINI_API_KEY" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Hit the public models list to verify the key works at all.
  const url = "https://generativelanguage.googleapis.com/v1beta/models"
  const res = await fetch(url, {
    headers: { "X-goog-api-key": key },
  })

  let body: any = null
  try {
    body = await res.json()
  } catch {
    body = { note: "No JSON body" }
  }

  return new Response(
    JSON.stringify({
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      hasModels: Array.isArray(body?.models),
      sampleModel: body?.models?.[0]?.name,
      error: body?.error,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  )
}
