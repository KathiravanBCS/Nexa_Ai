import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import AppProviders from "@/components/app-providers"

export const metadata: Metadata = {
  title: "Nexa",
  description: "Nexa AI Assistant",
}

// Extract a clean Clerk publishable key from commonly misconfigured env strings
function extractClerkPublishableKey(input?: string | null): string {
  if (!input) return ""
  const cleaned = input.replace(/['"]/g, " ").trim()
  const match = cleaned.match(/pk_(test|live)_[A-Za-z0-9]+/i)
  return match?.[0] ?? ""
}

function getPublishableKey(): string | undefined {
  const fromServer = extractClerkPublishableKey(process.env.CLERK_PUBLISHABLE_KEY)
  const fromPublic = extractClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  return fromServer || fromPublic || undefined
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = getPublishableKey()
  const missingKeyBanner =
    !publishableKey && process.env.NODE_ENV !== "production" ? (
      <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-3 py-2">
        Missing or invalid Clerk publishable key. Set CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.
      </div>
    ) : null


  return (
    // Add server-side class and color-scheme style to match the ThemeProvider's defaultTheme
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className="min-h-screen">
        {missingKeyBanner}
  <AppProviders publishableKey={publishableKey}>{children}</AppProviders>
      </body>
    </html>
  );
}
