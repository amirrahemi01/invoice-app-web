"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Plus, Users, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { ExportMenu } from "@/components/shared/export-menu"
import { StatCard } from "@/components/shared/stat-card"
import { TabBar } from "@/components/ui/tabs"
import { useData, useDebounced, useFormat } from "@/lib/hooks"
import { customerStats, emptyStats } from "@/lib/metrics"
import { customerRows } from "@/lib/invoice-export"
import { cn, sumBy } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { CustomerAvatar } from "./customer-avatar"

type Filter = "all" | "outstanding" | "archived"
type SortKey = "name" | "outstanding" | "billed" | "recent"

export function CustomersView({ page = 1 }: { page?: number }) {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<SortKey>("name")
  const search = useDebounced(query)
  const stats = useMemo(() => customerStats(db), [db])

  const filtered = useMemo(() => {
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean)
    const list = db.customers.filter((c) => {
      if (filter === "archived" ? !c.archived : c.archived) return false
      if (filter === "outstanding" && !((stats.get(c.id)?.outstanding ?? 0) > 0)) return false
      const hay = `${c.name} ${c.phone ?? ""}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
    const s = (id: string) => stats.get(id) ?? emptyStats
    return list.sort((a, b) => {
      if (sort === "outstanding") return s(b.id).outstanding - s(a.id).outstanding
      if (sort === "billed") return s(b.id).billed - s(a.id).billed
      if (sort === "recent") return (s(b.id).lastInvoiceDate ?? "").localeCompare(s(a.id).lastInvoiceDate ?? "")
      return a.name.localeCompare(b.name)
    })
  }, [db.customers, search, filter, sort, stats])

  // The page number lives in the URL: /customers/2
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
  const goToPage = (n: number) => router.push(`/customers/${n}${query_}`)
  const firstPage = () => {
    if (page > 1) router.push(`/customers/1${query_}`)
  }
  const active = db.customers.filter((c) => !c.archived)
  const totalOutstanding = sumBy([...stats.values()], (s) => s.outstanding)
  const totalOverdue = sumBy([...stats.values()], (s) => s.overdue)
  const balances = new Map([...stats.entries()].map(([id, s]) => [id, s.outstanding]))

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("Customers")}
        description={t("Everyone you bill, with their balances and history.")}
        actions={
          <>
            <ExportMenu filename="customers" sheetName={t("Customers")} getRows={() => customerRows(filtered, balances)} />
            <Button asChild>
              <Link href="/customers/new">
                <Plus /> {t("New customer")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("Active customers")} value={n(active.length)} icon={Users} />
        <StatCard label={t("With balance")} value={n([...stats.values()].filter((x) => x.outstanding > 0).length)} />
        <StatCard label={t("Outstanding")} value={fmt.compact(totalOutstanding)} icon={Wallet} tone="info" />
        <StatCard label={t("Overdue")} value={fmt.compact(totalOverdue)} icon={AlertCircle} tone={totalOverdue ? "danger" : "default"} />
      </div>

      <div className="rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between">
          <TabBar<Filter>
            value={filter}
            onChange={(v) => { setFilter(v); firstPage() }}
            items={[
              { value: "all", label: t("All") },
              { value: "outstanding", label: t("With balance") },
              { value: "archived", label: t("Archived") },
            ]}
          />
          <div className="flex gap-2">
            <SearchInput value={query} onChange={(v) => { setQuery(v); firstPage() }} placeholder={t("Search name or phone…")} className="flex-1 xl:w-64" />
            <Select value={sort} onValueChange={(v) => { setSort(v as SortKey); firstPage() }}>
              <SelectTrigger className="w-40" aria-label={t("Sort")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t("Name A–Z")}</SelectItem>
                <SelectItem value="outstanding">{t("Highest balance")}</SelectItem>
                <SelectItem value="billed">{t("Top billed")}</SelectItem>
                <SelectItem value="recent">{t("Recently invoiced")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("No customers found")}
            description={db.customers.length ? t("Try a different search or filter.") : t("Add your first customer to start invoicing.")}
            action={
              <Button asChild>
                <Link href="/customers/new">
                  <Plus /> {t("New customer")}
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <ul className="divide-y xl:hidden">
              {pager.items.map((c) => {
                const s = stats.get(c.id) ?? emptyStats
                return (
                  <li key={c.id}>
                    <Link href={`/customers/${c.id}`} className="flex items-center gap-3 px-3 py-3 active:bg-muted">
                      <CustomerAvatar customer={c} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground" dir="ltr">{c.phone}</p>
                      </div>
                      <div className="text-end">
                        <p className={cn("tabular text-sm font-medium", s.overdue > 0 && "text-danger-text")}>{fmt.money(s.outstanding)}</p>
                        <p className="text-xs text-muted-foreground">{t("{n} invoices", { n: s.invoiceCount })}</p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <Table className="hidden xl:table">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">{t("Customer")}</TableHead>
                  <TableHead>{t("Phone")}</TableHead>
                  <TableHead className="text-end">{t("Invoices")}</TableHead>
                  <TableHead className="text-end">{t("Total billed")}</TableHead>
                  <TableHead className="pe-4 text-end">{t("Outstanding")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pager.items.map((c) => {
                  const s = stats.get(c.id) ?? emptyStats
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                      <TableCell className="ps-4">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar customer={c} />
                          <div className="min-w-0">
                            <p className="max-w-56 truncate font-medium">{c.name}</p>
                            
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground" dir="ltr">{c.phone}</TableCell>
                      <TableCell className="tabular text-end">{n(s.invoiceCount)}</TableCell>
                      <TableCell className="tabular text-end">{fmt.money(s.billed)}</TableCell>
                      <TableCell className="pe-4 text-end">
                        <span className={cn("tabular font-medium", s.overdue > 0 ? "text-danger-text" : s.outstanding === 0 && "text-muted-foreground")}>
                          {fmt.money(s.outstanding)}
                        </span>
                        {s.overdue > 0 && <p className="tabular text-xs text-danger-text">{t("{amount} overdue", { amount: fmt.money(s.overdue) })}</p>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </>
        )}
        <div className="border-t px-3 py-3 sm:px-4">
          <Pagination {...pager} onPage={goToPage} noun="customers" />
        </div>
      </div>
    </div>
  )
}
