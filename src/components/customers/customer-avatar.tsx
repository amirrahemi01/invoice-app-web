import type { Customer } from "@/lib/types"
import { cn, initials } from "@/lib/utils"

export function CustomerAvatar({ customer, className }: { customer: Pick<Customer, "name">; className?: string }) {
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary", className)}
      aria-hidden
    >
      {initials(customer.name)}
    </span>
  )
}
