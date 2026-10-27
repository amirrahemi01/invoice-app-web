"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Ban, Copy, CreditCard, Eye, MoreHorizontal, Pencil, Printer, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useT } from "@/lib/i18n"
import { balanceDue } from "@/lib/invoice-helpers"
import { deleteInvoices, duplicateInvoice, issueInvoice, voidInvoice } from "@/lib/store"
import type { Invoice } from "@/lib/types"

export function InvoiceRowActions({
  invoice,
  onRecordPayment,
}: {
  invoice: Invoice
  onRecordPayment: (invoice: Invoice) => void
}) {
  const router = useRouter()
  const { t } = useT()
  const isDraft = invoice.status === "draft"
  const canPay = (invoice.status === "sent" || invoice.status === "partial") && balanceDue(invoice) > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`${t("Actions")} ${invoice.number ?? t("Draft")}`} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>
          <Eye /> {t("View")}
        </DropdownMenuItem>
        {isDraft && (
          <>
            <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
              <Pencil /> {t("Edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                issueInvoice(invoice.id)
                toast.success(t("Invoice issued and marked as sent"))
              }}
            >
              <Send /> {t("Issue & mark sent")}
            </DropdownMenuItem>
          </>
        )}
        {canPay && (
          <DropdownMenuItem onClick={() => onRecordPayment(invoice)}>
            <CreditCard /> {t("Record payment")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            const id = duplicateInvoice(invoice.id)
            if (id) {
              toast.success(t("Duplicated as a new draft"))
              router.push(`/invoices/${id}/edit`)
            }
          }}
        >
          <Copy /> {t("Duplicate")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(`/print/invoices/${invoice.id}?autoprint=1`, "_blank")}>
          <Printer /> {t("Print / PDF")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isDraft ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              if (!window.confirm(t("Delete this draft? This can't be undone."))) return
              deleteInvoices([invoice.id])
              toast.success(t("Draft deleted"))
            }}
          >
            <Trash2 /> {t("Delete draft")}
          </DropdownMenuItem>
        ) : (
          invoice.status !== "void" && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (!window.confirm(t("Void {number}? It stays on record but no longer counts as revenue.", { number: invoice.number ?? "" }))) return
                voidInvoice(invoice.id)
                toast.success(t("{number} voided", { number: invoice.number ?? "" }))
              }}
            >
              <Ban /> {t("Void")}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
