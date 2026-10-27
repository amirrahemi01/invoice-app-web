import type { Metadata } from "next"
import { InvoiceEdit } from "@/components/invoices/invoice-edit"

export const metadata: Metadata = { title: "ویرایش فاکتور" }

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InvoiceEdit id={id} />
}
