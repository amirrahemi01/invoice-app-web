import type React from "react"
import { AuthAside, AuthBrand } from "@/components/auth/auth-aside"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <AuthAside />
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <AuthBrand />
          {children}
        </div>
      </main>
    </div>
  )
}
