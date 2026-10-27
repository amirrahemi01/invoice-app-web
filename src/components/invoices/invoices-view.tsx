"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { FileText, Plus, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Combobox } from "@/components/ui/combobox"
import { TabBar } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { ExportMenu } from "@/components/shared/export-menu"
import { StatusBadge } from "@/components/shared/status-badge"
import { useData, useDebounced, useFormat } from "@/lib/hooks"
import { balanceDue, daysOverdue, displayStatus, isOverdue } from "@/lib/invoice-helpers"
import { invoiceListRows } from "@/lib/invoice-export"
import { addDays, daysBetween, todayISO } from "@/lib/format"
import { deleteInvoices, issueInvoice } from "@/lib/store"
import type { Invoice } from "@/lib/types"
import { cn, sumBy } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { InvoiceRowActions } from "./invoice-row-actions"
import { RecordPaymentDialog } from "./record-payment-dialog"

type Tab = "all" | "outstanding" | "overdue" | "paid" | "draft" | "void"
type Range = "all" | "30d" | "month" | "quarter" | "year" | "last-year"
type SortKey = "date-desc" | "date-asc" | "due" | "amount-desc" | "amount-asc" | "number"

function inRange(iso: string, range: Range, today: string) {
  const y = Number(today.slice(0, 4))
  const m = Number(today.slice(5, 7))
  switch (range) {
    case "30d":
      return iso >= addDays(today, -30)
    case "month":
      return iso.slice(0, 7) === today.slice(0, 7)
    case "quarter": {
      const q = Math.floor((m - 1) / 3)
      const start = `${y}-${String(q * 3 + 1).padStart(2, "0")}-01`
      return iso >= start
    }
    case "year":
      return iso.slice(0, 4) === String(y)
    case "last-year":
      return iso.slice(0, 4) === String(y - 1)
    default:
      return true
  }
}

function matchesTab(inv: Invoice, tab: Tab, today: string) {
  switch (tab) {
    case "outstanding":
      return (inv.status === "sent" || inv.status === "partial") && balanceDue(inv) > 0
    case "overdue":
      return isOverdue(inv, today)
    case "paid":
      return inv.status === "paid"
    case "draft":
      return inv.status === "draft"
    case "void":
      return inv.status === "void"
    default:
      return true
  }
}

function DueLabel({ invoice, today }: { invoice: Invoice; today: string }) {
  const fmt = useFormat()
  const { t } = useT()
  if (invoice.status === "paid" || invoice.status === "void" || invoice.status === "draft") {
    return <span className="text-muted-foreground">{fmt.date(invoice.dueDate)}</span>
  }
  if (isOverdue(invoice, today)) {
    return <span className="font-medium text-danger-text">{t("{n}d overdue", { n: daysOverdue(invoice, today) })}</span>
  }
  const days = daysBetween(today, invoice.dueDate)
  return <span className={cn(days <= 3 ? "text-warning-text" : "text-muted-foreground")}>{days === 0 ? t("Due today") : t("In {n}d", { n: days })}</span>
}

export function InvoicesView({ page = 1 }: { page?: number }) {
  const db = useData()
  const fmt = useFormat()
  const { t } = useT()
  const router = useRouter()
  const params = useSearchParams()
  const today = todayISO()
  const [tab, setTab] = useState<Tab>((params.get("status") as Tab) || "all")
  const [query, setQuery] = useState("")
  const [range, setRange] = useState<Range>("all")
  const [customerId, setCustomerId] = useState<string>(params.get("customer") ?? "all")
  const [sort, setSort] = useState<SortKey>("date-desc")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [payFor, setPayFor] = useState<Invoice | null>(null)
  const search = useDebounced(query)

  const base = useMemo(() => {
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean)
    return db.invoices.filter((inv) => {
      if (!inRange(inv.issueDate, range, today)) return false
      if (customerId !== "all" && inv.customerId !== customerId) return false
      const hay = `${inv.number ?? "draft"} ${inv.customerSnapshot.name} ${inv.reference ?? ""} ${inv.total} ${inv.lines.map((l) => l.name).join(" ")}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
  }, [db.invoices, search, range, customerId, today])

  const counts = useMemo(() => {
    const tabs: Tab[] = ["all", "outstanding", "overdue", "paid", "draft", "void"]
    return Object.fromEntries(tabs.map((t) => [t, base.filter((inv) => matchesTab(inv, t, today)).length])) as Record<Tab, number>
  }, [base, today])

  const filtered = useMemo(() => {
    const list = base.filter((inv) => matchesTab(inv, tab, today))
    const sorters: Record<SortKey, (a: Invoice, b: Invoice) => number> = {
      "date-desc": (a, b) => b.issueDate.localeCompare(a.issueDate) || b.createdAt.localeCompare(a.createdAt),
      "date-asc": (a, b) => a.issueDate.localeCompare(b.issueDate),
      due: (a, b) => a.dueDate.localeCompare(b.dueDate),
      "amount-desc": (a, b) => b.total - a.total,
      "amount-asc": (a, b) => a.total - b.total,
      number: (a, b) => (b.number ?? "~").localeCompare(a.number ?? "~"),
    }
    return list.sort(sorters[sort])
  }, [base, tab, sort, today])

  // The page number lives in the URL: /invoices/2
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20))
  const current = Math.min(Math.max(1, page), pageCount)
  const pager = {
    page: current,
    pageCount,
    total: filtered.length,
    items: filtered.slice((current - 1) * 20, current * 20),
    from: filtered.length === 0 ? 0 : (current - 1) * 20 + 1,
    to: Math.min(current * 20, filtered.length),
  }
  const query_ = typeof window === "undefined" ? "" : window.location.search
  const goToPage = (n: number) => router.push(`/invoices/${n}${query_}`)
  const firstPage = () => {
    if (page > 1) router.push(`/invoices/1${query_}`)
  }
  const pageIds = pager.items.map((i) => i.id)
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const selectedInvoices = db.invoices.filter((i) => selected.has(i.id))
  const selectedDrafts = selectedInvoices.filter((i) => i.status === "draft")

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const totalShown = sumBy(filtered.filter((i) => i.status !== "void"), (i) => i.total)
  const dueShown = sumBy(filtered.filter((i) => i.status === "sent" || i.status === "partial"), balanceDue)

  const customerOptions = [
    { value: "all", label: t("All customers") },
    ...db.customers.map((c) => ({ value: c.id, label: c.name, keywords: [c.phone ?? ""] })),
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("Invoices")}
        description={t("Create, send and track every invoice.")}
        actions={
          <>
            <ExportMenu
              filename="invoices"
              sheetName={t("Invoices")}
              getRows={() => invoiceListRows(selected.size ? selectedInvoices : filtered)}
            />
            <Button asChild>
              <Link href="/invoices/new">
                <Plus /> {t("New invoice")}
              </Link>
            </Button>
          </>
        }
      />

      <TabBar<Tab>
        value={tab}
        onChange={(t) => {
          setTab(t)
          firstPage()
          setSelected(new Set())
        }}
        items={[
          { value: "all", label: t("All"), count: counts.all },
          { value: "outstanding", label: t("Outstanding"), count: counts.outstanding },
          { value: "overdue", label: t("Overdue"), count: counts.overdue },
          { value: "paid", label: t("Paid"), count: counts.paid },
          { value: "draft", label: t("Drafts"), count: counts.draft },
          { value: "void", label: t("Void"), count: counts.void },
        ]}
      />

      <div className="rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center">
          <SearchInput value={query} onChange={(v) => { setQuery(v); firstPage() }} placeholder={t("Search number, customer, item…")} className="xl:max-w-xs xl:flex-1" />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Combobox
              options={customerOptions}
              value={customerId}
              onChange={(v) => { setCustomerId(v); firstPage() }}
              searchPlaceholder={t("Find customer…")}
              className="col-span-2 sm:w-52"
            />
            <Select value={range} onValueChange={(v) => { setRange(v as Range); firstPage() }}>
              <SelectTrigger className="w-full sm:w-40" aria-label={t("Date range")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All time")}</SelectItem>
                <SelectItem value="30d">{t("Last 30 days")}</SelectItem>
                <SelectItem value="month">{t("This month")}</SelectItem>
                <SelectItem value="quarter">{t("This quarter")}</SelectItem>
                <SelectItem value="year">{t("This year")}</SelectItem>
                <SelectItem value="last-year">{t("Last year")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => { setSort(v as SortKey); firstPage() }}>
              <SelectTrigger className="w-full sm:w-44" aria-label={t("Sort")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">{t("Newest first")}</SelectItem>
                <SelectItem value="date-asc">{t("Oldest first")}</SelectItem>
                <SelectItem value="due">{t("Due date")}</SelectItem>
                <SelectItem value="amount-desc">{t("Amount: high to low")}</SelectItem>
                <SelectItem value="amount-asc">{t("Amount: low to high")}</SelectItem>
                <SelectItem value="number">{t("Invoice number")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="tabular flex gap-4 text-sm text-muted-foreground xl:ms-auto">
            <span>
              {t("Total")} <span className="font-medium text-foreground">{fmt.money(totalShown)}</span>
            </span>
            <span>
              {t("Due")} <span className="font-medium text-foreground">{fmt.money(dueShown)}</span>
            </span>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-accent/50 px-4 py-2 text-sm">
            <span className="font-medium">{t("{n} selected", { n: selected.size })}</span>
            {selectedDrafts.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    selectedDrafts.forEach((d) => issueInvoice(d.id))
                    toast.success(t("{n} drafts issued", { n: selectedDrafts.length }))
                    setSelected(new Set())
                  }}
                >
                  <Send /> {t("Issue {n} drafts", { n: selectedDrafts.length })}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    if (!window.confirm(t("Delete {n} drafts?", { n: selectedDrafts.length }))) return
                    deleteInvoices(selectedDrafts.map((d) => d.id))
                    toast.success(t("Drafts deleted"))
                    setSelected(new Set())
                  }}
                >
                  <Trash2 /> {t("Delete drafts")}
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setSelected(new Set())}>
              {t("Clear")}
            </Button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={db.invoices.length ? t("No invoices match") : t("No invoices yet")}
            description={db.invoices.length ? t("Try another tab, search or date range.") : t("Create your first invoice in under a minute.")}
            action={
              <Button asChild>
                <Link href="/invoices/new">
                  <Plus /> New invoice
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <ul className="divide-y xl:hidden">
              {pager.items.map((inv) => (
                <li key={inv.id} className="flex items-start gap-3 px-3 py-3">
                  <Checkbox className="mt-0.5" checked={selected.has(inv.id)} onCheckedChange={() => toggle(inv.id)} aria-label={`${t("Select")} ${inv.number ?? t("Draft")}`} />
                  <Link href={`/invoices/${inv.id}`} className="min-w-0 flex-1 space-y-1.5">
                    <p className="line-clamp-2 text-sm leading-snug font-medium">{inv.customerSnapshot.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span dir="ltr">{inv.number ?? t("Draft")}</span> · {fmt.date(inv.issueDate, "short")}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={displayStatus(inv, today)} />
                      <p className="tabular text-sm font-medium">{fmt.money(inv.total, inv.currency)}</p>
                    </div>
                  </Link>
                  <InvoiceRowActions invoice={inv} onRecordPayment={setPayFor} />
                </li>
              ))}
            </ul>

            <Table className="hidden xl:table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 ps-5 pe-2">
                    <Checkbox
                      checked={allOnPage}
                      onCheckedChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev)
                          pageIds.forEach((id) => (allOnPage ? next.delete(id) : next.add(id)))
                          return next
                        })
                      }
                      aria-label={t("Select page")}
                    />
                  </TableHead>
                  <TableHead>{t("Invoice")}</TableHead>
                  <TableHead>{t("Customer")}</TableHead>
                  <TableHead className="hidden xl:table-cell">{t("Issued")}</TableHead>
                  <TableHead>{t("Due")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-end">{t("Amount")}</TableHead>
                  <TableHead className="hidden text-end 2xl:table-cell">{t("Balance")}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pager.items.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    data-state={selected.has(inv.id) ? "selected" : undefined}
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="ps-5 pe-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(inv.id)} onCheckedChange={() => toggle(inv.id)} aria-label={`${t("Select")} ${inv.number ?? t("Draft")}`} />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{inv.number ?? <span className="text-muted-foreground italic">{t("Draft")}</span>}</TableCell>
                    <TableCell className="max-w-56">
                      <p className="truncate">{inv.customerSnapshot.name}</p>
                      {inv.reference && <p className="truncate text-xs text-muted-foreground">{inv.reference}</p>}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">{fmt.date(inv.issueDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <DueLabel invoice={inv} today={today} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={displayStatus(inv, today)} />
                    </TableCell>
                    <TableCell className="tabular text-end font-medium whitespace-nowrap">{fmt.money(inv.total, inv.currency)}</TableCell>
                    <TableCell className="tabular hidden text-end text-muted-foreground 2xl:table-cell">
                      {inv.status === "draft" || inv.status === "void" ? "—" : fmt.money(balanceDue(inv), inv.currency)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <InvoiceRowActions invoice={inv} onRecordPayment={setPayFor} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        <div className="border-t px-3 py-3 sm:px-4">
          <Pagination {...pager} onPage={goToPage} noun="invoices" />
        </div>
      </div>

      <RecordPaymentDialog invoice={payFor} open={payFor !== null} onOpenChange={(open) => !open && setPayFor(null)} />
    </div>
  )
}
