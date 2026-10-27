"use client"

import type React from "react"
import { useDB } from "@/lib/store"
import { Skeleton } from "@/components/ui/skeleton"

/** Renders children only once the client-side mock database has loaded. */
export function DataGate({ children }: { children: React.ReactNode }) {
  const db = useDB()
  if (!db) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }
  return <>{children}</>
}
