import type React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  tone?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}) {
  const toneClass = {
    default: "bg-primary/10 text-primary",
    success: "bg-success-soft text-success-text",
    warning: "bg-warning-soft text-warning-text",
    danger: "bg-danger-soft text-danger-text",
    info: "bg-info-soft text-info-text",
  }[tone]
  return (
    <div className={cn("rounded-xl border bg-card p-3 shadow-xs min-[400px]:p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground min-[400px]:text-sm">{label}</p>
        {Icon && (
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg min-[400px]:size-8", toneClass)}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="tabular mt-2 text-lg font-semibold tracking-tight min-[400px]:text-xl sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
