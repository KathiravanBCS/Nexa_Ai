import { google } from "@ai-sdk/google"
import type { LanguageModel } from "ai"

// Uses GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY from env; falls back to provided key for preview convenience.
// Replace with your own and configure on Vercel.
const FALLBACK_KEY = "AIzaSyCM_nsXuR8d4tOsbywbBcaCUFUxkl7fna0"

export function getGeminiModel(modelName = "gemini-2.0-flash"): LanguageModel {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    FALLBACK_KEY

  // The AI SDK Google provider picks up keys from env; we pass it in providerOptions if needed.
  return google(modelName, { apiKey })
}
