"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Ban,
  ClipboardCopy,
  Copy,
  CreditCard,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Printer,
  Send,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { NotFoundCard } from "@/components/shared/not-found-card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useData, useFormat } from "@/lib/hooks"
import { balanceDue, daysOverdue, displayStatus, isOverdue, PAYMENT_METHOD_LABELS } from "@/lib/invoice-helpers"
import { deleteInvoices, deletePayment, duplicateInvoice, issueInvoice, voidInvoice } from "@/lib/store"
import { exportInvoiceCSV, exportInvoiceText, exportInvoiceXLSX, invoiceToText } from "@/lib/invoice-export"
import { elementToPNG, safeFilename } from "@/lib/export"
import { daysBetween, formatRelative, smsLink, todayISO, whatsappLink } from "@/lib/format"
import { cn } from "@/lib/utils"
import { translateMessage, useT } from "@/lib/i18n"
import { InvoiceDocument, ScaledPaper } from "./invoice-document"
import { RecordPaymentDialog } from "./record-payment-dialog"

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    document.body.appendChild(area)
    area.select()
    document.execCommand("copy")
    area.remove()
  }
}

export function InvoiceDetail({ id }: { id: string }) {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  const router = useRouter()
  const paperRef = useRef<HTMLDivElement>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [confirm, setConfirm] = useState<"void" | "delete" | null>(null)
  const invoice = db.invoices.find((i) => i.id === id)

  if (!invoice) return <NotFoundCard what="Invoice" backHref="/invoices" />

  const today = todayISO()
  const status = displayStatus(invoice, today)
  const balance = balanceDue(invoice)
  const payments = db.payments.filter((p) => p.invoiceId === invoice.id).sort((a, b) => b.date.localeCompare(a.date))
  const activity = db.activity.filter((a) => a.invoiceId === invoice.id)
  const isDraft = invoice.status === "draft"
  const canPay = (invoice.status === "sent" || invoice.status === "partial") && balance > 0
  const paidPct = invoice.total > 0 ? Math.min(100, (invoice.amountPaid / invoice.total) * 100) : 0
  const title = invoice.number ?? t("Draft invoice")

  const downloadPNG = async () => {
    if (!paperRef.current) return
    const pending = toast.loading(t("Rendering image…"))
    try {
      await elementToPNG(paperRef.current, `${safeFilename(title)}.png`)
      toast.success(t("Image downloaded"), { id: pending })
    } catch {
      toast.error(t("Couldn't render the image in this browser. Try Print → Save as PDF."), { id: pending })
    }
  }

  const shareBody = () =>
    t("Hello, invoice {number} for {amount} is due on {date}.", {
      number: invoice.number ?? "",
      amount: fmt.money(invoice.total, invoice.currency),
      date: fmt.date(invoice.dueDate),
    }) +
    "\n\n" +
    invoiceToText(invoice, db.settings)

  const exportMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download /> <span className="hidden sm:inline">{t("Download")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("Download as")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => window.open(`/print/invoices/${invoice.id}?autoprint=1`, "_blank")}>
          <FileType /> {t("PDF (print dialog)")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPNG}>
          <FileImage /> {t("Image (.png)")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            exportInvoiceXLSX(invoice, db.settings)
            toast.success(t("Excel file downloaded"))
          }}
        >
          <FileSpreadsheet /> {t("Excel (.xlsx)")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            exportInvoiceCSV(invoice)
            toast.success(t("CSV downloaded"))
          }}
        >
          <FileText /> {t("CSV (.csv)")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            exportInvoiceText(invoice, db.settings)
            toast.success(t("Text file downloaded"))
          }}
        >
          <FileText /> {t("Plain text (.txt)")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("Share")}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <a href={smsLink(invoice.customerSnapshot.phone, shareBody())}>
            <MessageSquare /> {t("Send SMS")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={whatsappLink(invoice.customerSnapshot.phone, shareBody())} target="_blank" rel="noreferrer">
            <Send /> {t("Send on WhatsApp")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await copyText(invoiceToText(invoice, db.settings))
            toast.success(t("Invoice copied as text"))
          }}
        >
          <ClipboardCopy /> {t("Copy as text")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        backHref="/invoices"
        title={title}
        badge={<StatusBadge status={status} />}
        description={
          <>
            <Link href={`/customers/${invoice.customerId}`} className="hover:text-foreground hover:underline">
              {invoice.customerSnapshot.name}
            </Link>
            {" · "}
            {fmt.money(invoice.total, invoice.currency)}
          </>
        }
        actions={
          <>
            {isDraft ? (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/invoices/${invoice.id}/edit`}>
                    <Pencil /> {t("Edit")}
                  </Link>
                </Button>
                <Button
                  onClick={() => {
                    issueInvoice(invoice.id)
                    toast.success(t("Invoice issued"), { description: t("It now has a number and is locked.") })
                  }}
                >
                  <Send /> {t("Issue")}
                </Button>
              </>
            ) : (
              canPay && (
                <Button onClick={() => setPayOpen(true)}>
                  <CreditCard /> {t("Record payment")}
                </Button>
              )
            )}
            {exportMenu}
            <Button variant="outline" size="icon" aria-label={t("Print")} onClick={() => window.open(`/print/invoices/${invoice.id}?autoprint=1`, "_blank")}>
              <Printer />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t("More actions")}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    const newId = duplicateInvoice(invoice.id)
                    if (newId) {
                      toast.success(t("Duplicated as a new draft"))
                      router.push(`/invoices/${newId}/edit`)
                    }
                  }}
                >
                  <Copy /> {t("Duplicate")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isDraft ? (
                  <DropdownMenuItem variant="destructive" onClick={() => setConfirm("delete")}>
                    <Trash2 /> {t("Delete draft")}
                  </DropdownMenuItem>
                ) : (
                  invoice.status !== "void" && (
                    <DropdownMenuItem variant="destructive" onClick={() => setConfirm("void")}>
                      <Ban /> {t("Void invoice")}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {isOverdue(invoice, today) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/25 bg-danger-soft px-4 py-3 text-sm text-danger-text">
          <span className="font-medium">
            {t("{n} days overdue. {amount} is still unpaid.", { n: daysOverdue(invoice, today), amount: fmt.money(balance, invoice.currency) })}
          </span>
          <Button size="sm" variant="outline" className="ms-auto bg-card" asChild>
            <a href={smsLink(invoice.customerSnapshot.phone, shareBody())}>
              <MessageSquare /> {t("Send reminder")}
            </a>
          </Button>
        </div>
      )}
      {isDraft && (
        <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {t("This is a draft. It gets a number and its customer details are locked when you issue it.")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-xl border bg-muted/40 p-3 sm:p-6">
          <ScaledPaper className="mx-auto max-w-[794px]">
            <InvoiceDocument ref={paperRef} invoice={invoice} settings={db.settings} />
          </ScaledPaper>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
            <h2 className="text-sm font-medium text-muted-foreground">{t("Balance")}</h2>
            <p className={cn("tabular mt-2 text-3xl font-semibold tracking-tight", balance === 0 && invoice.status === "paid" && "text-success-text")}>
              {fmt.money(balance, invoice.currency)}
            </p>
            {!isDraft && invoice.status !== "void" && (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(paidPct)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-success transition-all" style={{ width: `${paidPct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("{paid} of {total} paid", { paid: fmt.money(invoice.amountPaid, invoice.currency), total: fmt.money(invoice.total, invoice.currency) })}
                </p>
              </>
            )}
            <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("Issued")}</dt>
                <dd>{fmt.date(invoice.issueDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("Due")}</dt>
                <dd className={cn(isOverdue(invoice, today) && "font-medium text-danger-text")}>
                  {fmt.date(invoice.dueDate)}
                  {canPay && !isOverdue(invoice, today) && (
                    <span className="text-muted-foreground"> · {t("In {n}d", { n: Math.max(0, daysBetween(today, invoice.dueDate)) })}</span>
                  )}
                </dd>
              </div>
              {invoice.reference && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("Reference")}</dt>
                  <dd>{invoice.reference}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("Items")}</dt>
                <dd>{n(invoice.lines.length)}</dd>
              </div>
            </dl>
            {canPay && (
              <Button className="mt-4 w-full" onClick={() => setPayOpen(true)}>
                <CreditCard /> {t("Record payment")}
              </Button>
            )}
          </section>

          <section className="rounded-xl border bg-card shadow-xs">
            <h2 className="border-b px-4 py-3 text-sm font-medium sm:px-5">{t("Payments")}</h2>
            {payments.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">{isDraft ? t("Issue the invoice to start recording payments.") : t("No payments yet.")}</p>
            ) : (
              <ul className="divide-y">
                {payments.map((p) => (
                  <li key={p.id} className="group flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="tabular font-medium text-success-text">+{fmt.money(p.amount, invoice.currency)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {fmt.date(p.date)} · {t(PAYMENT_METHOD_LABELS[p.method])}
                        {p.reference && ` · ${p.reference}`}
                      </p>
                    </div>
                    {invoice.status !== "void" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground opacity-60 group-hover:opacity-100 hover:text-destructive"
                        aria-label={t("Remove payment")}
                        onClick={() => {
                          if (!window.confirm(t("Remove this payment?"))) return
                          deletePayment(p.id)
                          toast.success(t("Payment removed"))
                        }}
                      >
                        <X />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border bg-card shadow-xs">
            <h2 className="border-b px-4 py-3 text-sm font-medium sm:px-5">{t("Activity")}</h2>
            {activity.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">{t("No activity yet.")}</p>
            ) : (
              <ol className="relative space-y-4 px-4 py-4 sm:px-5">
                {activity.map((a, i) => (
                  <li key={a.id} className="relative flex gap-3 text-sm">
                    {i < activity.length - 1 && <span className="absolute start-[5px] top-4 h-[calc(100%+0.5rem)] w-px bg-border" aria-hidden />}
                    <span
                      className={cn(
                        "mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-card ring-1",
                        a.type.startsWith("payment") ? "bg-success ring-success/30" : a.type === "invoice.voided" ? "bg-destructive ring-destructive/30" : "bg-primary ring-primary/30",
                      )}
                    />
                    <div>
                      <p>{translateMessage(a.message)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt, fmt.locale)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>

      <RecordPaymentDialog invoice={invoice} open={payOpen} onOpenChange={setPayOpen} />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === "void" ? t("Void {number}?", { number: invoice.number ?? "" }) : t("Delete this draft?")}
        description={
          confirm === "void"
            ? t("The invoice stays on record with its number, but it no longer counts toward revenue or balances. Stock is returned. This can't be undone.")
            : t("This can't be undone.")
        }
        confirmLabel={confirm === "void" ? "Void invoice" : "Delete draft"}
        destructive
        onConfirm={() => {
          if (confirm === "void") {
            voidInvoice(invoice.id)
            toast.success(t("{number} voided", { number: invoice.number ?? "" }))
          } else {
            deleteInvoices([invoice.id])
            toast.success(t("Draft deleted"))
            router.push("/invoices")
          }
        }}
      />
    </div>
  )
}
