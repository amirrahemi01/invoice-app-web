import { STATUS_LABELS } from "@/lib/invoice-helpers"
import type { DisplayStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

const styles: Record<DisplayStatus, string> = {
  draft: "bg-muted text-muted-foreground ring-border",
  sent: "bg-info-soft text-info-text ring-info/25",
  partial: "bg-warning-soft text-warning-text ring-warning/30",
  paid: "bg-success-soft text-success-text ring-success/25",
  overdue: "bg-danger-soft text-danger-text ring-destructive/25",
  void: "bg-muted text-muted-foreground line-through ring-border",
}

const dots: Record<DisplayStatus, string> = {
  draft: "bg-muted-foreground/60",
  sent: "bg-info",
  partial: "bg-warning",
  paid: "bg-success",
  overdue: "bg-destructive",
  void: "bg-muted-foreground/40",
}

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  const { t } = useT()
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        styles[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[status])} />
      {t(STATUS_LABELS[status])}
    </span>
  )
}
