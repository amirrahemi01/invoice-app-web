"use client"

import { Search } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "./theme-toggle"
import { openCommandMenu } from "./command-menu"
import { useT } from "@/lib/i18n"

export function AppHeader() {
  const { t } = useT()
  return (
    <header className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4">
      <SidebarTrigger className="-ms-1" />
      <button
        type="button"
        onClick={openCommandMenu}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent sm:max-w-sm"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">{t("Search invoices, customers, products…")}</span>
        <kbd dir="ltr" className="ms-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
      </button>
      <div className="ms-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  )
}
