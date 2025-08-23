"use client"

import type * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, Moon, SunMedium, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type SettingsDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ProfileDraft = {
  displayName: string
  bio: string
  website: string
}

type Prefs = {
  language: "system" | "en" | "es" | "hi"
  theme: "system" | "light" | "dark"
  compact: boolean
  reduceMotion: boolean
}

const LS_KEYS = {
  profile: "settings:profile",
  prefs: "settings:prefs",
}

export default function SettingsDialog({ open = false, onOpenChange = () => {} }: SettingsDialogProps) {
  const { theme, setTheme, systemTheme } = useTheme()
  const { toast } = useToast()
  const { user, isLoaded } = useUser()

  const [prefs, setPrefs] = useState<Prefs>({
    language: "system",
    theme: "system",
    compact: false,
    reduceMotion: false,
  })

  const [profile, setProfile] = useState<ProfileDraft>({
    displayName: "",
    bio: "",
    website: "",
  })

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedPrefs = JSON.parse(localStorage.getItem(LS_KEYS.prefs) || "null")
      if (storedPrefs) setPrefs((p) => ({ ...p, ...storedPrefs }))
      const storedProfile = JSON.parse(localStorage.getItem(LS_KEYS.profile) || "null")
      if (storedProfile) setProfile((p) => ({ ...p, ...storedProfile }))
    } catch {}
  }, [])

  // Hydrate profile with Clerk data if signed in and empty
  useEffect(() => {
    if (!isLoaded) return
    if (user && !profile.displayName) {
      setProfile((p) => ({
        ...p,
        displayName: user.fullName || user.username || p.displayName,
      }))
    }
  }, [isLoaded, user, profile.displayName])

  // Persist prefs
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.prefs, JSON.stringify(prefs))
    } catch {}
  }, [prefs])

  // Sync theme with prefs
  useEffect(() => {
    setTheme(prefs.theme)
  }, [prefs.theme, setTheme])

  // Apply compact mode to document
  useEffect(() => {
    if (typeof document === "undefined") return
    document.documentElement.classList.toggle("compact", prefs.compact)
    document.documentElement.style.setProperty("--app-motion-scale", prefs.reduceMotion ? "0" : "1")
  }, [prefs.compact, prefs.reduceMotion])

  const effectiveTheme = useMemo(
    () =>
      prefs.theme === "system"
        ? ((systemTheme as "light" | "dark" | undefined) ?? "light")
        : (prefs.theme as "light" | "dark"),
    [prefs.theme, systemTheme],
  )

  function saveProfile() {
    try {
      localStorage.setItem(LS_KEYS.profile, JSON.stringify(profile))
    } catch {}
    toast({ title: "Profile saved" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your experience and manage your profile.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full mt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-6 pt-4">
            <Row label="Language">
              <Select value={prefs.language} onValueChange={(v: any) => setPrefs((p) => ({ ...p, language: v }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="System" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Separator />

            <Row label="Compact mode" helper="Tighter spacing for dense layouts.">
              <Switch
                checked={prefs.compact}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, compact: !!checked }))}
              />
            </Row>

            <Separator />

            <Row label="Reduce motion" helper="Minimize animations and transitions.">
              <Switch
                checked={prefs.reduceMotion}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, reduceMotion: !!checked }))}
              />
            </Row>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-6 pt-4">
            <SignedIn>
              <div className="rounded-md bg-muted/40 border p-3 text-sm">
                Signed in as{" "}
                <span className="font-medium">
                  {user?.primaryEmailAddress?.emailAddress || user?.username || user?.id}
                </span>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-900 p-3 text-sm">
                You are not signed in. You can still edit local profile preferences below.
              </div>
            </SignedOut>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://example.com"
                  inputMode="url"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell others a little about yourself"
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveProfile} className="gap-2">
                <Check className="h-4 w-4" />
                Save changes
              </Button>
            </div>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-6 pt-4">
            <Row label="Theme" helper="Choose light, dark, or follow your OS.">
              <RadioGroup
                className="grid grid-cols-3 gap-3"
                value={prefs.theme}
                onValueChange={(v: any) => setPrefs((p) => ({ ...p, theme: v }))}
              >
                <ThemeOption
                  value="light"
                  icon={<SunMedium className="h-4 w-4" />}
                  label="Light"
                  active={effectiveTheme === "light"}
                />
                <ThemeOption
                  value="dark"
                  icon={<Moon className="h-4 w-4" />}
                  label="Dark"
                  active={effectiveTheme === "dark"}
                />
                <ThemeOption
                  value="system"
                  icon={<Monitor className="h-4 w-4" />}
                  label="System"
                  active={prefs.theme === "system"}
                />
              </RadioGroup>
            </Row>

            <div className="rounded-lg border bg-muted/30 p-3">
              <div
                className={cn(
                  "rounded-md border p-4",
                  effectiveTheme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white",
                )}
              >
                <div className="text-sm text-muted-foreground mb-2">Preview</div>
                <div
                  className={cn(
                    "rounded-md p-3 border",
                    effectiveTheme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-slate-50",
                  )}
                >
                  <div className="font-medium mb-1">Card title</div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    This is how UI surfaces will look in your selected theme.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground">Frequently asked questions about AI and this app.</div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>How does AI work?</AccordionTrigger>
                <AccordionContent>
                  Most modern AI models learn statistical patterns from large datasets. During training, they adjust
                  internal parameters to minimize error on tasks such as predicting the next word, recognizing objects,
                  or mapping inputs to outputs. At runtime, they use those learned parameters to make fast predictions
                  or generate content.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>What are common applications?</AccordionTrigger>
                <AccordionContent>
                  Popular uses include chat assistants, search, summarization, translation, code generation,
                  recommendations, document processing, image understanding, and more—often combined to automate
                  workflows.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>What about ethics and safety?</AccordionTrigger>
                <AccordionContent>
                  Responsible AI considers privacy, fairness, transparency, and potential misuse. Always review
                  sensitive outputs, avoid sharing private data, and keep a human in the loop for high‑stakes decisions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>Troubleshooting common issues</AccordionTrigger>
                <AccordionContent>
                  If responses seem off-topic, try adding more context or examples. For timeouts or rate limits, retry
                  after a short delay. If uploads fail, check file size and type. For access problems, verify API keys
                  and sign-in status.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  helper,
  children,
}: {
  label: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
      <div className="sm:col-span-1">
        <div className="font-medium">{label}</div>
        {helper ? <div className="text-xs text-muted-foreground mt-0.5">{helper}</div> : null}
      </div>
      <div className="sm:col-span-2 flex justify-end">{children}</div>
    </div>
  )
}

function ThemeOption({
  value,
  label,
  icon,
  active,
}: {
  value: "light" | "dark" | "system"
  label: string
  icon: React.ReactNode
  active?: boolean
}) {
  return (
    <Label
      htmlFor={`theme-${value}`}
      className={cn(
        "cursor-pointer rounded-md border px-3 py-2 flex items-center gap-2",
        active ? "border-primary" : "border-border",
      )}
    >
      <RadioGroupItem id={`theme-${value}`} value={value} className="sr-only" />
      <div className="rounded-md p-2 bg-muted">{icon}</div>
      <span className="text-sm">{label}</span>
    </Label>
  )
}
