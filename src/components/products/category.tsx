import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

const palette = [
  "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/30",
  "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
  "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
  "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30",
  "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
  "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30",
  "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-500/30",
]

export function categoryColor(category: string) {
  let hash = 0
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return palette[hash % palette.length]
}

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset", categoryColor(category), className)}>
      {category}
    </span>
  )
}

export function StockBadge({ trackStock, stock, lowStockAt }: { trackStock: boolean; stock: number; lowStockAt: number }) {
  const { t, n } = useT()
  if (!trackStock) return <span className="text-xs text-muted-foreground">{t("Not tracked")}</span>
  const tone =
    stock <= 0
      ? "bg-danger-soft text-danger-text"
      : stock <= lowStockAt
        ? "bg-warning-soft text-warning-text"
        : "bg-muted text-muted-foreground"
  return (
    <span className={cn("tabular inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium", tone)}>
      {stock <= 0 ? t("Out of stock") : stock <= lowStockAt ? t("Low · {n}", { n: stock }) : t("{n} in stock", { n: stock })}
    </span>
  )
}
