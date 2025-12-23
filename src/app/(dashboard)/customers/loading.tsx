import { CustomersTableSkeleton } from "@/components/customers/customers-table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function CustomersLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <CustomersTableSkeleton />
    </div>
  )
}
