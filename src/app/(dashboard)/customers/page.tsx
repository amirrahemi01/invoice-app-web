import type { Metadata } from "next"
import { CustomersView } from "@/components/customers/customers-view"

export const metadata: Metadata = { title: "مشتریان" }

export default function CustomersPage() {
  return <CustomersView page={1} />
}
