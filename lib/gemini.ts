export type TextPart = { type: "text"; text: string }
export type ImagePart = { type: "image"; image: string; mimeType: string; name?: string }
export type Part = TextPart | ImagePart
export type Message = { role: "user" | "assistant"; content: Part[] }

const DEFAULT_MODEL = "gemini-2.0-flash"

function toGeminiRole(role: Message["role"]) {
  return role === "assistant" ? "model" : "user"
}

function stripBase64(data: string) {
  const i = data.indexOf("base64,")
  return i >= 0 ? data.slice(i + "base64,".length) : data
}

function buildContents(messages: Message[]) {
  return messages
    .map((m) => {
      const parts = m.content
        .map((p) => {
          if ((p as TextPart).type === "text") {
            const t = (p as TextPart).text?.trim()
            return t ? { text: t } : null
          } else {
            const img = p as ImagePart
            if (!img?.image || !img?.mimeType) return null
            const data = stripBase64(img.image)
            if (!data) return null
            return {
              inline_data: {
                mime_type: img.mimeType,
                data,
              },
            }
          }
        })
        .filter(Boolean)
      if (!parts.length) return null
      return { role: toGeminiRole(m.role), parts }
    })
    .filter(Boolean)
}

function sanitizeKey(k?: string) {
  if (!k) return ""
  // Strip common paste artifacts: quotes and whitespace.
  return k.replace(/['"\s]/g, "").trim()
}

function resolveKey(devOverride?: string) {
  // Priority: route-provided apiKey -> server env -> NEXT_PUBLIC for preview fallback
  const key =
    sanitizeKey(devOverride) ||
    sanitizeKey(process.env.GEMINI_API_KEY) ||
    sanitizeKey(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

  if (!key || key.length < 20) {
    const err = new Error(
      "Missing Gemini API key. Send apiKey in the request (preview) or set GEMINI_API_KEY on the server.",
    )
    ;(err as any).status = 401
    throw err
  }
  return key
}

export async function runGemini(
  messages: Message[],
  modelName = DEFAULT_MODEL,
  opts?: { apiKey?: string },
): Promise<string> {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Missing messages")
  }

  const API_KEY = resolveKey(opts?.apiKey)
  const endpoint = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`)
  endpoint.searchParams.set("key", API_KEY)
  const headers = {
    "Content-Type": "application/json",
    "X-goog-api-key": API_KEY,
  }

  const body = JSON.stringify({
    contents: buildContents(messages),
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  })

  const res = await fetch(endpoint.toString(), { method: "POST", headers, body })

  if (!res.ok) {
    let cause: any = undefined
    try {
      cause = await res.json()
    } catch {}
    const msg = cause?.error?.message || cause?.message || `Gemini error ${res.status} ${res.statusText}`
    const err = new Error(msg)
    ;(err as any).status = res.status
    ;(err as any).cause = cause
    throw err
  }

  const data = await res.json()
  const parts = data?.candidates?.[0]?.content?.parts?.filter((p: any) => typeof p?.text === "string") ?? []
  const text = parts
    .map((p: any) => p.text)
    .join("\n")
    .trim()

  return text || "I couldn’t generate a response."
}
