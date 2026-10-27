"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CalendarClock, CreditCard, Plus, Receipt, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { ExportMenu } from "@/components/shared/export-menu"
import { RecordPaymentDialog } from "@/components/invoices/record-payment-dialog"
import { useData, useDebounced, useFormat, usePagination } from "@/lib/hooks"
import { balanceDue, PAYMENT_METHOD_LABELS } from "@/lib/invoice-helpers"
import { paymentRows } from "@/lib/invoice-export"
import { addDays, daysBetween, todayISO } from "@/lib/format"
import type { Invoice, PaymentMethod } from "@/lib/types"
import { sumBy } from "@/lib/utils"
import { useT } from "@/lib/i18n"

type Range = "all" | "30d" | "90d" | "year"

export function PaymentsView() {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  const today = todayISO()
  const [query, setQuery] = useState("")
  const [method, setMethod] = useState<PaymentMethod | "all">("all")
  const [range, setRange] = useState<Range>("all")
  const [pickOpen, setPickOpen] = useState(false)
  const [payFor, setPayFor] = useState<Invoice | null>(null)
  const search = useDebounced(query)

  const invoiceById = useMemo(() => new Map(db.invoices.map((i) => [i.id, i])), [db.invoices])

  const filtered = useMemo(() => {
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean)
    const from = range === "30d" ? addDays(today, -30) : range === "90d" ? addDays(today, -90) : range === "year" ? `${today.slice(0, 4)}-01-01` : ""
    return db.payments
      .filter((p) => {
        if (method !== "all" && p.method !== method) return false
        if (from && p.date < from) return false
        const inv = invoiceById.get(p.invoiceId)
        const hay = `${inv?.number ?? ""} ${inv?.customerSnapshot.name ?? ""} ${p.reference ?? ""} ${p.amount}`.toLowerCase()
        return terms.every((t) => hay.includes(t))
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [db.payments, search, method, range, today, invoiceById])

  const pager = usePagination(filtered, 20, `${search}|${method}|${range}`)
  const monthKey = today.slice(0, 7)
  const thisMonth = sumBy(db.payments.filter((p) => p.date.startsWith(monthKey)), (p) => p.amount)
  const last30 = sumBy(db.payments.filter((p) => p.date >= addDays(today, -30)), (p) => p.amount)

  // Average days from issue to final payment, for paid invoices.
  const paidInvoices = db.invoices.filter((i) => i.status === "paid")
  const avgDays = paidInvoices.length
    ? Math.round(
        sumBy(paidInvoices, (inv) => {
          const last = db.payments.filter((p) => p.invoiceId === inv.id).reduce((max, p) => (p.date > max ? p.date : max), inv.issueDate)
          return Math.max(0, daysBetween(inv.issueDate, last))
        }) / paidInvoices.length,
      )
    : 0

  const unpaid = db.invoices.filter((i) => (i.status === "sent" || i.status === "partial") && balanceDue(i) > 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("Payments")}
        description={t("Every payment received, across all invoices.")}
        actions={
          <>
            <ExportMenu filename="payments" sheetName={t("Payments")} getRows={() => paymentRows(filtered, invoiceById)} />
            <Button onClick={() => setPickOpen(true)}>
              <Plus /> {t("Record payment")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("This month")} value={fmt.compact(thisMonth)} icon={CreditCard} tone="success" />
        <StatCard label={t("Last 30 days")} value={fmt.compact(last30)} icon={TrendingUp} />
        <StatCard label={t("Avg. time to pay")} value={t("{n} days", { n: avgDays })} icon={CalendarClock} tone="info" hint={t("Issue date → final payment")} />
        <StatCard label={t("Awaiting payment")} value={n(unpaid.length)} icon={Receipt} tone="warning" hint={fmt.money(sumBy(unpaid, balanceDue))} />
      </div>

      <div className="rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
          <SearchInput value={query} onChange={setQuery} placeholder={t("Search invoice, customer, reference…")} className="sm:max-w-xs sm:flex-1" />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod | "all")}>
              <SelectTrigger className="w-full sm:w-40" aria-label={t("Method")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All methods")}</SelectItem>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {t(PAYMENT_METHOD_LABELS[m])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger className="w-full sm:w-36" aria-label={t("Date range")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All time")}</SelectItem>
                <SelectItem value="30d">{t("Last 30 days")}</SelectItem>
                <SelectItem value="90d">{t("Last 90 days")}</SelectItem>
                <SelectItem value="year">{t("This year")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="tabular text-sm text-muted-foreground sm:ms-auto">
            {t("Total")} <span className="font-medium text-foreground">{fmt.money(sumBy(filtered, (p) => p.amount))}</span>
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title={t("No payments found")} description={t("Payments appear here when you record them on an invoice.")} />
        ) : (
          <>
            <ul className="divide-y xl:hidden">
              {pager.items.map((p) => {
                const inv = invoiceById.get(p.invoiceId)
                return (
                  <li key={p.id}>
                    <Link href={`/invoices/${p.invoiceId}`} className="flex items-center gap-3 px-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{inv?.customerSnapshot.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmt.date(p.date, "short")} · {inv?.number} · {t(PAYMENT_METHOD_LABELS[p.method])}
                        </p>
                      </div>
                      <p className="tabular text-sm font-medium text-success-text">+{fmt.money(p.amount)}</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <Table className="hidden xl:table">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">{t("Date")}</TableHead>
                  <TableHead>{t("Invoice")}</TableHead>
                  <TableHead>{t("Customer")}</TableHead>
                  <TableHead>{t("Method")}</TableHead>
                  <TableHead className="hidden xl:table-cell">{t("Reference")}</TableHead>
                  <TableHead className="pe-4 text-end">{t("Amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pager.items.map((p) => {
                  const inv = invoiceById.get(p.invoiceId)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="ps-4 whitespace-nowrap text-muted-foreground">{fmt.date(p.date)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/invoices/${p.invoiceId}`} className="font-medium hover:text-primary hover:underline">
                          {inv?.number ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-56 truncate">{inv?.customerSnapshot.name}</TableCell>
                      <TableCell>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs">{t(PAYMENT_METHOD_LABELS[p.method])}</span>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">{p.reference ?? "—"}</TableCell>
                      <TableCell className="tabular pe-4 text-end font-medium text-success-text">+{fmt.money(p.amount)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </>
        )}
        <div className="border-t px-3 py-3 sm:px-4">
          <Pagination {...pager} onPage={pager.setPage} noun="payments" />
        </div>
      </div>

      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Record a payment")}</DialogTitle>
            <DialogDescription>{t("Choose the invoice this payment is for.")}</DialogDescription>
          </DialogHeader>
          <Command className="rounded-lg border" loop>
            <CommandInput placeholder={t("Search number or customer…")} autoFocus />
            <CommandList className="max-h-[50vh]">
              <CommandEmpty>{t("No unpaid invoices")}</CommandEmpty>
              {unpaid.map((i) => (
                <CommandItem
                  key={i.id}
                  value={`${i.number} ${i.customerSnapshot.name} ${i.id}`}
                  onSelect={() => {
                    setPickOpen(false)
                    setPayFor(i)
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {i.number} · {i.customerSnapshot.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("Due")} {fmt.date(i.dueDate)}</p>
                  </div>
                  <span className="tabular text-sm font-medium">{fmt.money(balanceDue(i), i.currency)}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
      <RecordPaymentDialog invoice={payFor} open={payFor !== null} onOpenChange={(o) => !o && setPayFor(null)} />
    </div>
  )
}
