"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Shield } from "lucide-react"

function mask(key: string) {
  if (!key) return ""
  if (key.length <= 10) return "*".repeat(key.length)
  return key.slice(0, 6) + "..." + key.slice(-4)
}

export default function DevKey() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState<string>("")

  useEffect(() => {
    setMounted(true)
    try {
      const existing = localStorage.getItem("gemini_api_key") || ""
      setSaved(existing)
      setValue(existing)
    } catch {}
  }, [])

  const isProd = useMemo(() => process.env.NODE_ENV === "production", [])
  if (!mounted || isProd) return null

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-slate-500">{saved ? `Preview key: ${mask(saved)}` : "No preview key set"}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 bg-transparent">
            <Shield className="h-3.5 w-3.5" />
            Set API Key
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Gemini API key (Preview only)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <label className="text-sm text-slate-500">
              Paste your Gemini AI Studio key (will be saved to localStorage)
            </label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="AIzaSy..." autoFocus />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                try {
                  localStorage.removeItem("gemini_api_key")
                  setSaved("")
                  setValue("")
                } catch {}
              }}
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                const sanitized = (value || "").replace(/['"\s]/g, "").trim()
                if (!sanitized) return
                try {
                  localStorage.setItem("gemini_api_key", sanitized)
                  setSaved(sanitized)
                } catch {}
                setOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
