"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { NotFoundCard } from "@/components/shared/not-found-card"
import { useData } from "@/lib/hooks"
import { useT } from "@/lib/i18n"
import { InvoiceEditor } from "./invoice-editor"

export function InvoiceEdit({ id }: { id: string }) {
  const invoice = useData().invoices.find((i) => i.id === id)
  const { t } = useT()
  if (!invoice) return <NotFoundCard what="Invoice" backHref="/invoices" />
  if (invoice.status !== "draft") {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={Lock}
          title={t("{number} is locked", { number: invoice.number ?? "" })}
          description={t("Issued invoices can't be edited, so your records stay accurate. Void it and duplicate it to make corrections.")}
          action={
            <Button asChild variant="outline">
              <Link href={`/invoices/${invoice.id}`}>{t("View invoice")}</Link>
            </Button>
          }
        />
      </div>
    )
  }
  return <InvoiceEditor key={invoice.id} invoice={invoice} />
}
