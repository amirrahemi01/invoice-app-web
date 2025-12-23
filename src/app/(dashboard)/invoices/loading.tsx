import { InvoicesTableSkeleton } from "@/components/invoices/invoices-table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function InvoicesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-9" />
      </div>
      <InvoicesTableSkeleton />
    </div>
  )
}
