"use client"

import { SignIn } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <SignIn
        // Use path routing and redirect after success
        routing="path"
        afterSignInUrl="/"
        signUpUrl="/sign-up"
      />
    </div>
  )
}
