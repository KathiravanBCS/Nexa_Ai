export type ImageData = { name: string; type: string; base64: string }
export type Part = { type: "text"; text: string } | { type: "image"; image: string; mimeType: string; name?: string }
export type Message = { role: "user" | "assistant"; content: Part[]; created_at?: string }
