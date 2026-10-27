import type { Metadata } from "next"
import { CustomerDetail } from "@/components/customers/customer-detail"
import { CustomersView } from "@/components/customers/customers-view"

export const metadata: Metadata = { title: "مشتریان" }

// /customers/2 is page 2 of the list; /customers/cus_001 is a customer.
export default async function CustomerRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (/^\d+$/.test(id)) return <CustomersView page={Number(id)} />
  return <CustomerDetail id={id} />
}
