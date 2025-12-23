// path: src/app/customers/page.tsx

import { Suspense } from "react"
import { CustomersTable } from "@/components/customers/customers-table"
import { CustomersFilters } from "@/components/customers/customers-filters"
import { CustomersTableSkeleton } from "@/components/customers/customers-table-skeleton"

export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <CustomersFilters />
      <Suspense fallback={<CustomersTableSkeleton />}>
        <CustomersTable />
      </Suspense>
    </div>
  )
}
