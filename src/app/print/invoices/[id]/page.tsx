import type { Metadata } from "next"
import { PrintView } from "@/components/invoices/print-view"

export const metadata: Metadata = { title: "چاپ فاکتور" }

export default async function PrintInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ autoprint?: string }>
}) {
  const { id } = await params
  const { autoprint } = await searchParams
  return <PrintView id={id} autoPrint={autoprint === "1"} />
}
