"use client"

import type React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "onChange" | "value"> & { value: string; onChange: (value: string) => void }) {
  const { t } = useT()
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(placeholder)}
        className="ps-8 pe-8 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label={t("Clear search")}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
