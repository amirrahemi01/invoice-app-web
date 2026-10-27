import type { Metadata } from "next"
import { CustomerEdit } from "@/components/customers/customer-edit"

export const metadata: Metadata = { title: "ویرایش مشتری" }

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CustomerEdit id={id} />
}
