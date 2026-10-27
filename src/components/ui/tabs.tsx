"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

export interface TabItem<T extends string> {
  value: T
  label: React.ReactNode
  count?: number
}

/** Segmented tab bar. Scrolls horizontally on small screens. */
export function TabBar<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn("-mx-1 overflow-x-auto px-1 [scrollbar-width:none]", className)}>
      <div role="tablist" className="inline-flex min-w-max items-center gap-1 rounded-lg bg-muted p-1">
        {items.map((item) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    "tabular rounded-full px-1.5 text-xs",
                    active ? "bg-primary/10 text-primary" : "bg-background/60 text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
