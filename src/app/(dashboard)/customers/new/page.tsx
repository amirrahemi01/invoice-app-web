import type { Metadata } from "next"
import { CustomerForm } from "@/components/customers/customer-form"

export const metadata: Metadata = { title: "مشتری جدید" }

export default function NewCustomerPage() {
  return <CustomerForm />
}
