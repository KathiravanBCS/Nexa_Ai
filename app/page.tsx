"use client"

import Sidebar from "@/components/sidebar"
import Chat from "@/components/chat"
import { Suspense, useState } from "react"
import { SidebarClose } from "lucide-react"

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function cn(...classes: (string | undefined | false)[]): string {
    return classes.filter(Boolean).join(" ");
  }
  return (
    <main className="min-h-screen flex bg-white dark:bg-slate-900">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <section
          className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            sidebarOpen ? "ml-64" : "lg:ml-14"
          )}
        >
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
          <Chat sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </Suspense>
      </section>
    </main>
  )
}