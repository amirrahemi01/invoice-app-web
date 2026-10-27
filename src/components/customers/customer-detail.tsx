"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Archive, ArchiveRestore, FilePlus2, FileSpreadsheet, FileText, MoreHorizontal, Pencil, Phone, Receipt, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TabBar } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { NotFoundCard } from "@/components/shared/not-found-card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useData, useFormat } from "@/lib/hooks"
import { customerStats, emptyStats } from "@/lib/metrics"
import { balanceDue, displayStatus, PAYMENT_METHOD_LABELS } from "@/lib/invoice-helpers"
import { deleteCustomer, setCustomerArchived } from "@/lib/store"
import { downloadCSV, downloadXLSX, safeFilename, type Cell } from "@/lib/export"
import { useT } from "@/lib/i18n"
import { CustomerAvatar } from "./customer-avatar"

type Tab = "all" | "unpaid" | "paid" | "draft"

export function CustomerDetail({ id }: { id: string }) {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("all")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const customer = db.customers.find((c) => c.id === id)
  const stats = useMemo(() => customerStats(db).get(id) ?? emptyStats, [db, id])

  const invoices = useMemo(
    () => db.invoices.filter((i) => i.customerId === id).sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    [db.invoices, id],
  )
  const invoiceIds = new Set(invoices.map((i) => i.id))
  const payments = db.payments.filter((p) => invoiceIds.has(p.invoiceId)).sort((a, b) => b.date.localeCompare(a.date))
  const invoiceById = new Map(invoices.map((i) => [i.id, i]))

  if (!customer) return <NotFoundCard what="Customer" backHref="/customers" />

  const shown = invoices.filter((inv) => {
    if (tab === "unpaid") return (inv.status === "sent" || inv.status === "partial") && balanceDue(inv) > 0
    if (tab === "paid") return inv.status === "paid"
    if (tab === "draft") return inv.status === "draft"
    return true
  })

  const statementRows = (): Cell[][] => {
    const rows: Cell[][] = [
      [`Statement — ${customer.name}`],
      [`Generated`, new Date().toISOString().slice(0, 10)],
      [],
      ["Date", "Type", "Reference", "Charges", "Payments", "Balance"],
    ]
    const entries = [
      ...invoices
        .filter((i) => i.status !== "draft" && i.status !== "void")
        .map((i) => ({ date: i.issueDate, type: "Invoice", ref: i.number ?? "", charge: i.total, payment: 0 })),
      ...payments.map((p) => ({ date: p.date, type: "Payment", ref: invoiceById.get(p.invoiceId)?.number ?? "", charge: 0, payment: p.amount })),
    ].sort((a, b) => a.date.localeCompare(b.date))
    let balance = 0
    for (const e of entries) {
      balance = Math.round((balance + e.charge - e.payment) * 100) / 100
      rows.push([e.date, e.type, e.ref, e.charge || "", e.payment || "", balance])
    }
    rows.push([], ["", "", "Balance due", "", "", balance])
    return rows
  }

  const exportStatement = (kind: "csv" | "xlsx") => {
    const name = `statement-${safeFilename(customer.name)}`
    const rows = statementRows()
    if (kind === "csv") downloadCSV(rows, `${name}.csv`)
    else downloadXLSX([{ name: "Statement", rows, boldRows: [0, 3, rows.length - 1] }], `${name}.xlsx`)
    toast.success(t("Statement exported"))
  }

  const hasInvoices = invoices.length > 0

  return (
    <div className="space-y-5">
      <PageHeader
        backHref="/customers"
        title={
          <span className="flex items-center gap-3">
            <CustomerAvatar customer={customer} className="size-10" />
            <span className="truncate">{customer.name}</span>
          </span>
        }
        badge={customer.archived ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t("Archived")}</span> : undefined}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/customers/${customer.id}/edit`}>
                <Pencil /> <span className="hidden sm:inline">{t("Edit")}</span>
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t("More actions")}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportStatement("xlsx")}>
                  <FileSpreadsheet /> {t("Statement (Excel)")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportStatement("csv")}>
                  <FileText /> {t("Statement (CSV)")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setCustomerArchived(customer.id, !customer.archived)
                    toast.success(customer.archived ? t("Customer restored") : t("Customer archived"))
                  }}
                >
                  {customer.archived ? <ArchiveRestore /> : <Archive />} {customer.archived ? t("Restore") : t("Archive")}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 /> {t("Delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild>
              <Link href={`/invoices/new?customer=${customer.id}`}>
                <FilePlus2 /> {t("New invoice")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("Total billed")} value={fmt.money(stats.billed)} hint={t("{n} invoices", { n: stats.invoiceCount })} />
        <StatCard label={t("Paid")} value={fmt.money(stats.paid)} tone="success" />
        <StatCard label={t("Outstanding")} value={fmt.money(stats.outstanding)} tone="info" />
        <StatCard label={t("Overdue")} value={fmt.money(stats.overdue)} tone={stats.overdue ? "danger" : "default"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <section className="rounded-xl border bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <h2 className="font-medium">{t("Invoices")}</h2>
              <TabBar<Tab>
                value={tab}
                onChange={setTab}
                items={[
                  { value: "all", label: t("All"), count: invoices.length },
                  { value: "unpaid", label: t("Unpaid") },
                  { value: "paid", label: t("Paid") },
                  { value: "draft", label: t("Drafts") },
                ]}
              />
            </div>
            {shown.length === 0 ? (
              <EmptyState icon={Receipt} title={t("No invoices here")} className="py-10" />
            ) : (
              <ul className="divide-y">
                {shown.map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/invoices/${inv.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-muted/50 sm:px-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{inv.number ?? t("Draft")}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmt.date(inv.issueDate)} · {t("due {date}", { date: fmt.date(inv.dueDate) })}
                        </p>
                      </div>
                      <StatusBadge status={displayStatus(inv)} className="hidden sm:inline-flex" />
                      <div className="text-end">
                        <p className="tabular font-medium">{fmt.money(inv.total, inv.currency)}</p>
                        {balanceDue(inv) > 0 && inv.status !== "draft" && inv.status !== "void" && (
                          <p className="tabular text-xs text-muted-foreground">{t("{amount} due", { amount: fmt.money(balanceDue(inv), inv.currency) })}</p>
                        )}
                        <StatusBadge status={displayStatus(inv)} className="mt-1 sm:hidden" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border bg-card shadow-xs">
            <h2 className="border-b p-3 font-medium sm:p-4">{t("Payments")}</h2>
            {payments.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{t("No payments recorded yet.")}</p>
            ) : (
              <ul className="divide-y">
                {payments.slice(0, 10).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-3 text-sm sm:px-4">
                    <div>
                      <p className="font-medium">{fmt.date(p.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(PAYMENT_METHOD_LABELS[p.method])} · {invoiceById.get(p.invoiceId)?.number}
                      </p>
                    </div>
                    <p className="tabular font-medium text-success-text">+{fmt.money(p.amount)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
            <h2 className="text-sm font-medium text-muted-foreground">{t("Contact")}</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="font-medium">{customer.name}</li>
              {customer.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className="hover:text-primary hover:underline" dir="ltr">
                    {customer.phone}
                  </a>
                </li>
              )}
            </ul>
            <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t("Customer since")}</dt>
                <dd>{fmt.date(customer.createdAt.slice(0, 10))}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={hasInvoices ? t("Archive this customer?") : t("Delete this customer?")}
        description={
          hasInvoices
            ? t("This customer has invoices, so they'll be archived instead of deleted. Their invoices stay unchanged.")
            : t("This can't be undone.")
        }
        confirmLabel={hasInvoices ? "Archive" : "Delete"}
        destructive
        onConfirm={() => {
          deleteCustomer(customer.id)
          toast.success(hasInvoices ? t("Customer archived") : t("Customer deleted"))
          router.push("/customers")
        }}
      />
    </div>
  )
}
