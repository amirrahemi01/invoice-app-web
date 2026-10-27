import { Suspense } from "react"
import type { Metadata } from "next"
import { InvoicesView } from "@/components/invoices/invoices-view"

export const metadata: Metadata = { title: "فاکتورها" }

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesView page={1} />
    </Suspense>
  )
}
