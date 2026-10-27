"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TabBar } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { ExportMenu } from "@/components/shared/export-menu"
import { StatusBadge } from "@/components/shared/status-badge"
import { ChartLegend, RevenueChart } from "@/components/charts/revenue-chart"
import { useData, useFormat } from "@/lib/hooks"
import { calculateInvoice } from "@/lib/calc"
import { AGING_BUCKETS, agingBucket, countable, lastMonths, monthlySeries, type AgingKey } from "@/lib/metrics"
import { balanceDue, daysOverdue, displayStatus } from "@/lib/invoice-helpers"
import { monthLabel, todayISO } from "@/lib/format"
import type { Cell } from "@/lib/export"
import { sumBy } from "@/lib/utils"
import { useT } from "@/lib/i18n"

type Tab = "sales" | "customers" | "products" | "tax" | "aging"
type Period = "12m" | "ytd" | "last-year" | "all"

function periodMonths(period: Period, today: string, firstDate: string) {
  const year = Number(today.slice(0, 4))
  if (period === "12m") return lastMonths(12, today)
  if (period === "ytd") return lastMonths(Number(today.slice(5, 7)), today)
  if (period === "last-year") return Array.from({ length: 12 }, (_, i) => `${year - 1}-${String(i + 1).padStart(2, "0")}`)
  const [fy, fm] = firstDate.split("-").map(Number)
  const span = (year - fy) * 12 + Number(today.slice(5, 7)) - fm + 1
  return lastMonths(Math.max(1, span), today)
}

const pct = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : "—")

export function ReportsView() {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  const params = useSearchParams()
  const today = todayISO()
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "sales")
  const [period, setPeriod] = useState<Period>("12m")

  const firstDate = useMemo(() => db.invoices.reduce((min, i) => (i.issueDate < min ? i.issueDate : min), today), [db.invoices, today])
  const months = useMemo(() => periodMonths(period, today, firstDate), [period, today, firstDate])
  const monthSet = useMemo(() => new Set(months), [months])
  const inPeriod = useMemo(() => db.invoices.filter((i) => countable(i) && monthSet.has(i.issueDate.slice(0, 7))), [db.invoices, monthSet])
  const series = useMemo(() => monthlySeries(db, months), [db, months])

  const invoiced = sumBy(inPeriod, (i) => i.total)
  const taxTotal = sumBy(inPeriod, (i) => i.taxTotal)
  const collected = sumBy(series, (s) => s.collected)
  const avgInvoice = inPeriod.length ? invoiced / inPeriod.length : 0

  const byCustomer = useMemo(() => {
    const map = new Map<string, { name: string; count: number; billed: number; paid: number; outstanding: number }>()
    for (const inv of inPeriod) {
      const row = map.get(inv.customerId) ?? { name: inv.customerSnapshot.name, count: 0, billed: 0, paid: 0, outstanding: 0 }
      row.count += 1
      row.billed += inv.total
      row.paid += inv.amountPaid
      row.outstanding += balanceDue(inv)
      map.set(inv.customerId, row)
    }
    return [...map.entries()].map(([id, r]) => ({ id, ...r })).sort((a, b) => b.billed - a.billed)
  }, [inPeriod])

  const byProduct = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; units: number; revenue: number; cost: number | null }>()
    for (const inv of inPeriod) {
      const totals = calculateInvoice(inv)
      inv.lines.forEach((line, i) => {
        const key = line.productId ?? `custom:${line.name}`
        const product = line.productId ? db.products.find((p) => p.id === line.productId) : undefined
        const row = map.get(key) ?? { name: line.name, sku: line.sku ?? "", units: 0, revenue: 0, cost: product?.cost !== undefined ? 0 : null }
        row.units += line.quantity
        row.revenue += totals.lines[i].taxable
        if (row.cost !== null && product?.cost !== undefined) row.cost += product.cost * line.quantity
        map.set(key, row)
      })
    }
    return [...map.entries()].map(([id, r]) => ({ id, ...r })).sort((a, b) => b.revenue - a.revenue)
  }, [inPeriod, db.products])

  const byTax = useMemo(() => {
    const map = new Map<string, { name: string; rate: number; taxable: number; tax: number }>()
    for (const inv of inPeriod) {
      for (const t of calculateInvoice(inv).taxes) {
        const key = `${t.name}|${t.rate}`
        const row = map.get(key) ?? { name: t.name, rate: t.rate, taxable: 0, tax: 0 }
        row.taxable += t.taxable
        row.tax += t.tax
        map.set(key, row)
      }
    }
    return [...map.values()].sort((a, b) => b.tax - a.tax)
  }, [inPeriod])

  const agingRows = useMemo(
    () =>
      db.invoices
        .filter((i) => (i.status === "sent" || i.status === "partial") && balanceDue(i) > 0)
        .map((inv) => ({ inv, bucket: agingBucket(inv, today) }))
        .sort((a, b) => a.inv.dueDate.localeCompare(b.inv.dueDate)),
    [db.invoices, today],
  )
  const agingTotals = AGING_BUCKETS.map((b) => ({ ...b, amount: sumBy(agingRows.filter((r) => r.bucket === b.key), (r) => balanceDue(r.inv)) }))

  const exportRows = (): Cell[][] => {
    switch (tab) {
      case "sales":
        return [["Month", "Invoiced", "Collected"], ...series.map((s) => [s.month, s.invoiced, s.collected])]
      case "customers":
        return [["Customer", "Invoices", "Billed", "Paid", "Outstanding"], ...byCustomer.map((r) => [r.name, r.count, r.billed, r.paid, r.outstanding])]
      case "products":
        return [
          ["Item", "SKU", "Units", "Revenue (excl. tax)", "Cost", "Profit", "Margin"],
          ...byProduct.map((r) => [r.name, r.sku, r.units, r.revenue, r.cost ?? "", r.cost === null ? "" : r.revenue - r.cost, r.cost === null ? "" : pct(r.revenue - r.cost, r.revenue)]),
        ]
      case "tax":
        return [["Tax", "Rate %", "Taxable amount", "Tax"], ...byTax.map((r) => [r.name, r.rate, r.taxable, r.tax])]
      case "aging":
        return [
          ["Invoice", "Customer", "Due date", "Days overdue", "Bucket", "Balance"],
          ...agingRows.map(({ inv, bucket }) => [inv.number, inv.customerSnapshot.name, inv.dueDate, daysOverdue(inv, today), AGING_BUCKETS.find((b) => b.key === bucket)?.label, balanceDue(inv)]),
        ]
    }
  }

  const periodLabel = t({ "12m": "Last 12 months", ytd: "This year", "last-year": "Last year", all: "All time" }[period])

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("Reports")}
        description={t("Understand your sales, customers, tax and unpaid invoices.")}
        actions={
          <>
            {tab !== "aging" && (
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-40" aria-label={t("Period")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12m">{t("Last 12 months")}</SelectItem>
                  <SelectItem value="ytd">{t("This year")}</SelectItem>
                  <SelectItem value="last-year">{t("Last year")}</SelectItem>
                  <SelectItem value="all">{t("All time")}</SelectItem>
                </SelectContent>
              </Select>
            )}
            <ExportMenu filename={`report-${tab}-${period}`} sheetName={tab} getRows={exportRows} />
          </>
        }
      />

      <TabBar<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { value: "sales", label: t("Sales") },
          { value: "customers", label: t("By customer") },
          { value: "products", label: t("By product") },
          { value: "tax", label: t("Tax summary") },
          { value: "aging", label: t("Aging") },
        ]}
      />

      {tab !== "aging" && (
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("Invoiced")} value={fmt.compact(invoiced)} hint={periodLabel} />
          <StatCard label={t("Collected")} value={fmt.compact(collected)} tone="success" hint={t("{pct} of invoiced", { pct: pct(collected, invoiced) })} />
          <StatCard label={t("Invoices issued")} value={n(inPeriod.length)} hint={t("Avg. {amount}", { amount: fmt.money(avgInvoice) })} />
          <StatCard label={t("Tax collected")} value={fmt.compact(taxTotal)} tone="info" />
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-xs">
        {tab === "sales" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
              <h2 className="font-medium">{t("Invoiced vs collected")}</h2>
              <ChartLegend />
            </div>
            <div className="p-3 sm:p-5">
              <RevenueChart data={series} currency={fmt.currency} locale={fmt.locale} height={300} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">{t("Month")}</TableHead>
                  <TableHead className="text-end">{t("Invoiced")}</TableHead>
                  <TableHead className="text-end">{t("Collected")}</TableHead>
                  <TableHead className="pe-4 text-end">{t("Collection rate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...series].reverse().map((s) => (
                  <TableRow key={s.month}>
                    <TableCell className="ps-4">{monthLabel(s.month, fmt.locale)}</TableCell>
                    <TableCell className="tabular text-end">{fmt.money(s.invoiced)}</TableCell>
                    <TableCell className="tabular text-end">{fmt.money(s.collected)}</TableCell>
                    <TableCell className="tabular pe-4 text-end text-muted-foreground">{pct(s.collected, s.invoiced)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="ps-4 font-medium">{t("Total")}</TableCell>
                  <TableCell className="tabular text-end font-medium">{fmt.money(sumBy(series, (s) => s.invoiced))}</TableCell>
                  <TableCell className="tabular text-end font-medium">{fmt.money(collected)}</TableCell>
                  <TableCell className="tabular pe-4 text-end">{pct(collected, sumBy(series, (s) => s.invoiced))}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </>
        )}

        {tab === "customers" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">{t("Customer")}</TableHead>
                  <TableHead className="text-end">{t("Invoices")}</TableHead>
                  <TableHead className="text-end">{t("Billed")}</TableHead>
                  <TableHead className="hidden text-end sm:table-cell">{t("Paid")}</TableHead>
                  <TableHead className="text-end">{t("Outstanding")}</TableHead>
                  <TableHead className="hidden pe-4 text-end lg:table-cell">{t("Share")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCustomer.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-56 truncate ps-4">
                      <Link href={`/customers/${r.id}`} className="hover:text-primary hover:underline">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular text-end">{n(r.count)}</TableCell>
                    <TableCell className="tabular text-end font-medium">{fmt.money(r.billed)}</TableCell>
                    <TableCell className="tabular hidden text-end sm:table-cell">{fmt.money(r.paid)}</TableCell>
                    <TableCell className="tabular text-end">{fmt.money(r.outstanding)}</TableCell>
                    <TableCell className="hidden pe-4 lg:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-chart-1" style={{ width: pct(r.billed, invoiced) }} />
                        </div>
                        <span className="tabular w-12 text-end text-xs text-muted-foreground">{pct(r.billed, invoiced)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === "products" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">{t("Item")}</TableHead>
                  <TableHead className="text-end">{t("Units")}</TableHead>
                  <TableHead className="text-end">{t("Revenue")}</TableHead>
                  <TableHead className="hidden text-end md:table-cell">{t("Profit")}</TableHead>
                  <TableHead className="pe-4 text-end">{t("Margin")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byProduct.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-64 ps-4">
                      <p className="truncate">{r.name}</p>
                      {r.sku && <p className="font-mono text-xs text-muted-foreground">{r.sku}</p>}
                    </TableCell>
                    <TableCell className="tabular text-end">{fmt.number(r.units)}</TableCell>
                    <TableCell className="tabular text-end font-medium">{fmt.money(r.revenue)}</TableCell>
                    <TableCell className="tabular hidden text-end md:table-cell">{r.cost === null ? "—" : fmt.money(r.revenue - r.cost)}</TableCell>
                    <TableCell className="tabular pe-4 text-end text-muted-foreground">{r.cost === null ? "—" : pct(r.revenue - r.cost, r.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === "tax" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4">{t("Tax")}</TableHead>
                <TableHead className="text-end">{t("Rate")}</TableHead>
                <TableHead className="text-end">{t("Taxable amount")}</TableHead>
                <TableHead className="pe-4 text-end">{t("Tax collected")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byTax.map((r) => (
                <TableRow key={r.name + r.rate}>
                  <TableCell className="ps-4">{r.name}</TableCell>
                  <TableCell className="tabular text-end">{r.rate}%</TableCell>
                  <TableCell className="tabular text-end">{fmt.money(r.taxable)}</TableCell>
                  <TableCell className="tabular pe-4 text-end font-medium">{fmt.money(r.tax)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="ps-4 font-medium" colSpan={2}>
                  Total
                </TableCell>
                <TableCell className="tabular text-end font-medium">{fmt.money(sumBy(byTax, (r) => r.taxable))}</TableCell>
                <TableCell className="tabular pe-4 text-end font-medium">{fmt.money(sumBy(byTax, (r) => r.tax))}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}

        {tab === "aging" && (
          <>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-t-xl border-b bg-border sm:grid-cols-5">
              {agingTotals.map((b) => (
                <div key={b.key} className="bg-card p-4">
                  <p className="text-xs text-muted-foreground">{t(b.label)}</p>
                  <p className={`tabular mt-1 text-lg font-semibold ${b.key !== "current" && b.amount > 0 ? "text-danger-text" : ""}`}>{fmt.money(b.amount)}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-4">{t("Invoice")}</TableHead>
                    <TableHead>{t("Customer")}</TableHead>
                    <TableHead>{t("Due")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead className="pe-4 text-end">{t("Balance")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agingRows.map(({ inv, bucket }) => (
                    <TableRow key={inv.id}>
                      <TableCell className="ps-4 whitespace-nowrap">
                        <Link href={`/invoices/${inv.id}`} className="font-medium hover:text-primary hover:underline">
                          {inv.number}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{inv.customerSnapshot.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {fmt.date(inv.dueDate)}
                        {(bucket as AgingKey) !== "current" && <span className="text-danger-text"> · {t("{n}d", { n: daysOverdue(inv, today) })}</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={displayStatus(inv, today)} />
                      </TableCell>
                      <TableCell className="tabular pe-4 text-end font-medium">{fmt.money(balanceDue(inv), inv.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
