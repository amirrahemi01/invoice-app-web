import { Suspense } from "react"
import type { Metadata } from "next"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"
import { InvoicesView } from "@/components/invoices/invoices-view"

export const metadata: Metadata = { title: "فاکتورها" }

// /invoices/2 is page 2 of the list; /invoices/inv_001 is an invoice.
export default async function InvoiceRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (/^\d+$/.test(id)) {
    return (
      <Suspense>
        <InvoicesView page={Number(id)} />
      </Suspense>
    )
  }
  return <InvoiceDetail id={id} />
}
