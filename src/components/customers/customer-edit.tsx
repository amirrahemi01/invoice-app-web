"use client"

import { useData } from "@/lib/hooks"
import { NotFoundCard } from "@/components/shared/not-found-card"
import { CustomerForm } from "./customer-form"

export function CustomerEdit({ id }: { id: string }) {
  const customer = useData().customers.find((c) => c.id === id)
  if (!customer) return <NotFoundCard what="Customer" backHref="/customers" />
  return <CustomerForm customer={customer} />
}
