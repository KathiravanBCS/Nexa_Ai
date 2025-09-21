"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SignedIn, SignedOut, SignInButton, UserButton, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageIcon, Mic, Send, Trash2, Loader2, X, Bot, User, Plus, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveMessageAction, ensureThreadAction } from "@/lib/server-actions"
import { useSearchParams } from "next/navigation"
import { onPickImages } from "@/lib/image-utils"
import { getThreadsClient } from "@/lib/supabase/client"

type ImageData = { name: string; type: string; base64: string }
type Part = { type: "text"; text: string } | { type: "image"; image: string; mimeType: string; name?: string }
type Message = { role: "user" | "assistant"; content: Part[]; created_at?: string }

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 30000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  const finalInit = { ...init, signal: controller.signal }
  return fetch(input, finalInit).finally(() => clearTimeout(id))
}

export default function Chat({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) {
  const params = useSearchParams()
  const initialThreadId = params.get("thread") ?? undefined

  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const scrollerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const askRef = useRef<() => Promise<void> | void>(() => {})

  // Load messages when threadId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!threadId) {
        setMessages([])
        return
      }
      
      const supabase = getThreadsClient()
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading messages:', error)
        return
      }
      
      if (data) {
        const formattedMessages = data.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: JSON.parse(String(msg.content)),
          created_at: typeof msg.created_at === "string" ? msg.created_at : undefined
        }))
        setMessages(formattedMessages)
      }
    }
    
    loadMessages()
  }, [threadId])

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight })
  }, [messages, loading])

  // Setup SpeechRecognition (Web Speech API) when available
  useEffect(() => {
    const win: any = typeof window !== "undefined" ? window : undefined
    const SpeechRecognition = win?.SpeechRecognition || win?.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recog = new SpeechRecognition()
    recog.lang = "en-US"
    recog.interimResults = true
    recog.maxAlternatives = 1

    recog.onstart = () => {
      setListening(true)
      setInterimTranscript("")
    }

    recog.onresult = (event: any) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i]
        if (res.isFinal) final += res[0].transcript
        else interim += res[0].transcript
      }
      if (final) {
        // Append final transcript to input and auto-send
        setInput((prev) => (prev ? prev + " " + final : final))
        setInterimTranscript("")
        // small timeout to allow UI update before sending
        setTimeout(() => {
          const fn = askRef.current
          try {
            const p = fn()
            if (p && typeof (p as any).catch === "function") (p as any).catch(() => {})
          } catch {}
        }, 150)
      } else {
        setInterimTranscript(interim)
      }
    }

    recog.onerror = (e: any) => {
      console.error("SpeechRecognition error", e)
    }

    recog.onend = () => {
      setListening(false)
      setInterimTranscript("")
    }

  recognitionRef.current = recog

    return () => {
      try {
        recog.onresult = null
        recog.onend = null
        recog.onerror = null
        recog.onstart = null
        recog.stop()
      } catch {}
      recognitionRef.current = null
    }
  }, [])

  const disabled = useMemo(() => loading || (!input.trim() && images.length === 0), [loading, input, images])

  const ask = useCallback(async () => {
    if (disabled) return
    setLoading(true)

    const userParts: Part[] = []
    if (input.trim()) userParts.push({ type: "text", text: input.trim() })
    for (const img of images) {
      userParts.push({ type: "image", image: img.base64, mimeType: img.type, name: img.name })
    }

    try {
      const nextThreadId: string =
        threadId ??
        (await (async () => {
          try {
            return String(await ensureThreadAction(input.trim().slice(0, 60) || "New chat"))
          } catch {
            return Math.random().toString(36).slice(2)
          }
        })())
      setThreadId(nextThreadId)

      const userMsg: Message = { role: "user", content: userParts }
      setMessages((prev) => [...prev, userMsg])
      setInput("")
      setImages([])
      saveMessageAction(nextThreadId, userMsg).catch(() => {})

      const devApiKey =
        process.env.NODE_ENV !== "production"
          ? (typeof window !== "undefined" &&
              (localStorage.getItem("gemini_api_key") || process.env.NEXT_PUBLIC_GEMINI_API_KEY)) ||
            undefined
          : undefined

      let replyText = ""
      try {
        const res = await fetchWithTimeout(
          "/api/chat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [...messages, userMsg], apiKey: devApiKey }),
          },
          30000,
        )

        if (!res.ok) {
          let msg = `Sorry, the server returned ${res.status}. Please try again.`
          try {
            const err = await res.json()
            if (err?.error) msg = err.error
          } catch {}
          replyText = msg
        } else {
          const data = (await res.json()) as { text: string }
          replyText = data.text || "I didn't get a response. Please try again."
        }
      } catch (err: any) {
        replyText =
          err?.name === "AbortError" ? "Request timed out. Please try again." : "Network error. Please try again."
      }

      const assistantMsg: Message = { role: "assistant", content: [{ type: "text", text: replyText }] }
      setMessages((prev) => [...prev, assistantMsg])
      saveMessageAction(nextThreadId, assistantMsg).catch(() => {})
    } finally {
      setLoading(false)
    }
  }, [disabled, images, input, messages, threadId])

  // Keep askRef up-to-date so SpeechRecognition can call the latest version
  useEffect(() => {
    askRef.current = ask
  }, [ask])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      ask()
    }
  }

  const toggleListening = () => {
    const recog = recognitionRef.current
    if (!recog) return
    try {
      if (listening) {
        recog.stop()
      } else {
        // clear interim and start
        setInterimTranscript("")
        recog.start()
      }
    } catch (e) {
      console.error("toggleListening error", e)
    }
  }

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-300",
    )}>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nexa AI</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your intelligent assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="redirect">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <Button size="sm" className="hidden sm:flex">Sign up</Button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full rounded-lg">
          <div ref={scrollerRef} className="space-y-4 p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <Bot className="h-10 w-10 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Hello! I'm Nexa</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                  Your AI assistant. How can I help you today? You can ask me anything or upload an image for analysis.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "assistant" ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-3xl rounded-2xl p-4",
                    m.role === "assistant"
                      ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "p-1 rounded-full",
                        m.role === "assistant"
                          ? "bg-purple-100 dark:bg-purple-900/30"
                          : "bg-white/20",
                      )}
                    >
                      {m.role === "assistant" ? (
                        <Bot className="h-4 w-4 text-purple-500" />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className="text-xs font-medium">
                      {m.role === "assistant" ? "Nexa" : "You"}
                    </span>
                  </div>
                  <div className="prose max-w-none">
                    {m.content.map((part, idx) =>
                      part.type === "text" ? (
                        <p key={idx} className="whitespace-pre-wrap leading-7">
                          {part.text}
                        </p>
                      ) : (
                        <img
                          key={idx}
                          src={`data:${(part as any).mimeType};base64,${(part as any).image}`}
                          alt={(part as any).name ?? "uploaded image"}
                          className="rounded-md max-h-80 border mt-2"
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-3xl rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <Bot className="h-4 w-4 text-purple-500" />
                    </div>
                    <span className="text-xs font-medium">Nexa</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700">
        {images.length > 0 && (
          <div className="max-w-3xl mx-auto mb-3 flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={`data:${img.type};base64,${img.base64}`}
                  alt={img.name}
                  className="h-16 w-16 object-cover rounded-md border"
                />
                <button
                  onClick={() => setImages(images.filter((_, index) => index !== i))}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-3xl mx-auto rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-end gap-2 p-3">
          <label className="cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Add images">
            <input
              className="hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onPickImages(e.target.files, setImages)}
            />
            {images.length > 0 ? <ImageIcon className="h-5 w-5 text-purple-500" /> : <Plus className="h-5 w-5 text-slate-500" />}
          </label>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Nexa..."
            className="min-h-[44px] max-h-40 resize-none border-0 bg-transparent focus-visible:ring-0 rounded-lg px-3 py-2 flex-1"
            rows={1}
          />

          <div className="flex items-center gap-1">
            <Button
              variant={listening ? "default" : "ghost"}
              size="icon"
              className={"rounded-full h-10 w-10"}
              onClick={toggleListening}
              aria-pressed={listening}
              title={listening ? "Stop listening" : "Start speaking"}
            >
              {listening ? (
                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
              ) : (
                <Mic className="h-5 w-5 text-slate-500" />
              )}
            </Button>

            <Button
              onClick={ask}
              className="rounded-full h-10 w-10 p-0"
              disabled={disabled}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-center text-slate-400 mt-2">
          Nexa can analyze images and answer questions. Feel free to upload anything! {interimTranscript && (
            <span className="block text-amber-600">Listening: "{interimTranscript}"</span>
          )}
        </p>
      </div>
    </div>
  )
}