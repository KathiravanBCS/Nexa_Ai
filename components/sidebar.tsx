"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Menu, Clock, Settings, LogOut, LogIn, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getThreadsClient } from "@/lib/supabase/client"
import { SignedIn, SignedOut, SignInButton, SignOutButton, useUser } from "@clerk/nextjs"
import SettingsDialog from "@/components/settings-dialog"

type Thread = {
  id: string
  title: string | null
  created_at: string
  user_id: string | null
}

export default function Sidebar({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>("")
  const [threads, setThreads] = useState<Thread[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { user, isLoaded } = useUser()
  const userId = user?.id || null

  // Track thread param from URL
  const [currentThread, setCurrentThread] = useState<string | null>(null)
  
  useEffect(() => {
    const updateThread = () => {
      const params = new URLSearchParams(window.location.search)
      setCurrentThread(params.get("thread"))
    }
    updateThread()
    window.addEventListener("popstate", updateThread)
    return () => {
      window.removeEventListener("popstate", updateThread)
    }
  }, [])

  // Rename thread
  const handleRenameThread = async (id: string) => {
    const supabase = getThreadsClient()
    await supabase.from("threads").update({ title: editingTitle }).eq("id", id)
    setThreads((prev) => prev.map((t) => t.id === id ? { ...t, title: editingTitle } : t))
    setEditingThreadId(null)
    setEditingTitle("")
  }
  
  // Delete thread
  const handleDeleteThread = async (id: string) => {
    const supabase = getThreadsClient()
    // Delete all messages associated with the thread
    await supabase.from("messages").delete().eq("thread_id", id)
    // Delete the thread itself
    await supabase.from("threads").delete().eq("id", id)
    setThreads((prev) => prev.filter((t) => t.id !== id))
    // If the deleted thread is currently open, redirect to home
    const params = new URLSearchParams(window.location.search)
    if (params.get("thread") === id) {
      window.location.href = "/"
    }
  }

  // Function to load threads
  const loadThreads = async () => {
    const supabase = getThreadsClient()
    
    // Get current Supabase session to check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    let q = supabase
      .from("threads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)
    
    // If user is authenticated with Supabase, filter by user_id
    if (session?.user?.id) {
      q = q.eq("user_id", session.user.id)
    } else {
      // For anonymous users, only show threads with no user_id
      q = q.is("user_id", null)
    }
    
    const { data, error } = await q
    
    if (error) {
      console.error("Error loading threads:", error)
      return
    }
    
    setThreads((data ?? []) as Thread[])
  }

  // Reload threads when userId, isLoaded, or currentThread changes
  useEffect(() => {
    if (isLoaded) loadThreads()
  }, [userId, isLoaded, currentThread])

  // Create new thread and redirect
  const handleNewChat = async () => {
    const supabase = getThreadsClient()
    
    // Get current Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    const supabaseUserId = session?.user?.id || null
    
    const title = "New chat"
    const { data, error } = await supabase
      .from("threads")
      .insert([{ title, user_id: supabaseUserId }])
      .select()
    
    if (error) {
      console.error("Error creating thread:", error)
      return
    }
    
    if (data && data[0]?.id) {
      setThreads((prev) => [data[0] as Thread, ...prev])
      window.location.href = `/?thread=${data[0].id}`
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "h-screen flex-shrink-0 border-r bg-slate-50/60 dark:bg-slate-900/80 flex flex-col transition-all duration-300 fixed top-0 left-0 z-50 backdrop-blur-md",
          open ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b">
            {open && <span className="font-semibold tracking-tight">Nexa</span>}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle sidebar">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <div className="px-3 py-4">
            <Button className="w-full justify-start gap-2" variant="secondary" onClick={handleNewChat}>
              <Plus className="h-4 w-4" />
              {open && "New chat"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            <div className="space-y-1">
              {threads.map((t) => (
                <div key={t.id} className="flex items-center group">
                  <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                  {editingThreadId === t.id ? (
                    <input
                      className="flex-1 px-2 py-1 rounded border"
                      value={editingTitle}
                      autoFocus
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={() => handleRenameThread(t.id)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleRenameThread(t.id)
                        if (e.key === "Escape") { setEditingThreadId(null); setEditingTitle("") }
                      }}
                    />
                  ) : (
                    <Link href={`/?thread=${t.id}`} className="flex-1 block" onClick={() => window.innerWidth < 1024 && setOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start truncate"
                        title={t.title ?? "Untitled"}
                        onDoubleClick={() => { setEditingThreadId(t.id); setEditingTitle(t.title ?? "") }}
                      >
                        {open && <span className="truncate">{t.title ?? "Untitled"}</span>}
                      </Button>
                    </Link>
                  )}
                  {open && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1 text-red-500 opacity-0 group-hover:opacity-100"
                      title="Delete thread"
                      onClick={() => handleDeleteThread(t.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {isLoaded && !userId && open && (
                <div className="px-2 py-3 text-xs text-slate-500">Sign in to sync your chats across devices.</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 pb-4 border-t">
            <Button variant="ghost" className="justify-start" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              {open && "Settings"}
            </Button>
            <SignedIn>
              <SignOutButton redirectUrl="/">
                <Button variant="ghost" className="justify-start text-red-600 hover:text-red-700">
                  <LogOut className="h-4 w-4 mr-2" />
                  {open && "Sign out"}
                </Button>
              </SignOutButton>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="redirect">
                <Button variant="ghost" className="justify-start">
                  <LogIn className="h-4 w-4 mr-2" />
                  {open && "Sign in"}
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
      </aside>
    </>
  )
}