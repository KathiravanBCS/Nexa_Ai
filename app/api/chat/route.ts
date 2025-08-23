import { runGemini } from "@/lib/gemini"

function withTimeout<T>(promise: Promise<T>, ms: number, err: Error): Promise<T> {
  let id: any
  return new Promise((resolve, reject) => {
    id = setTimeout(() => reject(err), ms)
    promise.then(
      (v) => {
        clearTimeout(id)
        resolve(v)
      },
      (e) => {
        clearTimeout(id)
        reject(e)
      },
    )
  })
}

function getTimeoutMs() {
  const fromEnv = Number(process.env.AI_TIMEOUT_MS)
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 60000
}

export async function POST(req: Request) {
  const timeoutMs = getTimeoutMs()
  try {
    const url = new URL(req.url)
    const qsApiKey = url.searchParams.get("apiKey") || undefined

    const body = await req.json()
    const messages = body?.messages ?? []

    // Priority for preview/dev: body.apiKey -> header -> query -> server env (handled in runGemini)
    const headerApiKey = req.headers.get("x-gemini-api-key") || undefined
    const apiKey = (body?.apiKey as string | undefined) || headerApiKey || qsApiKey

    const text = await withTimeout(
      runGemini(messages, "gemini-2.0-flash", { apiKey }),
      timeoutMs,
      new Error(`Model did not respond within ${timeoutMs}ms`),
    )

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    const msg = err?.message || "Failed to generate text"
    const isTimeout = msg.includes("did not respond within")
    const status = typeof err?.status === "number" ? err.status : isTimeout ? 504 : 500
    console.error("Gemini route error:", { status, msg, cause: err?.cause })
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  }
}
