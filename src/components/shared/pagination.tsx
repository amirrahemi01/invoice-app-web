"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

export function Pagination({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
  noun = "items",
}: {
  page: number
  pageCount: number
  from: number
  to: number
  total: number
  onPage: (page: number) => void
  noun?: string
}) {
  const { t, n } = useT()
  if (total === 0) return null
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
      <p className="tabular">
        {t("{from}–{to} of {total} {noun}", { from, to, total, noun: t(noun) })}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t("Previous page")}>
          <ChevronLeft className="rtl:rotate-180" />
        </Button>
        <span className="tabular min-w-16 text-center">
          {n(page)} / {n(pageCount)}
        </span>
        <Button variant="outline" size="icon-sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label={t("Next page")}>
          <ChevronRight className="rtl:rotate-180" />
        </Button>
      </div>
    </div>
  )
}
