import { Suspense } from "react"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { InvoicesFilters } from "@/components/invoices/invoices-filters"
import { InvoicesTableSkeleton } from "@/components/invoices/invoices-table-skeleton"

export default function InvoicesPage() {
  return (
    <div className="space-y-4">
      <InvoicesFilters />
      <Suspense fallback={<InvoicesTableSkeleton />}>
        <InvoicesTable />
      </Suspense>
    </div>
  )
}
