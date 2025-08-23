"use client"

import type { PropsWithChildren } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { ThemeProvider } from "@/components/theme-provider"
import { useTheme } from "next-themes"

// Wraps Theme + Clerk together so Clerk follows your theme and buttons work in client contexts.
function ClerkWithTheme({ publishableKey, children }: PropsWithChildren<{ publishableKey?: string }>) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  if (!publishableKey) {
    // If Clerk key is missing, render children without Clerk (app remains usable)
    return <>{children}</>
  }
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      // Path-based auth in App Router
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      // After auth, return to home (customize as needed)
      afterSignInUrl="/"
      afterSignUpUrl="/"
      // Sync Clerk's UI theme with app theme
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: "#6d28d9", // violet-700 accent
          colorBackground: "transparent",
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}

export default function AppProviders({ publishableKey, children }: PropsWithChildren<{ publishableKey?: string }>) {
  return (
    // Use a fixed default theme on the server to avoid hydration mismatches with client-side
    // theme detection (system) which can differ between server and client during first render.
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ClerkWithTheme publishableKey={publishableKey}>{children}</ClerkWithTheme>
    </ThemeProvider>
  )
}
