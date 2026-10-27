import type { Metadata } from "next"
import { InvoiceEditor } from "@/components/invoices/invoice-editor"

export const metadata: Metadata = { title: "فاکتور جدید" }

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string; product?: string }>
}) {
  const { customer, product } = await searchParams
  return <InvoiceEditor initialCustomerId={customer} initialProductId={product} />
}
