import { balanceDue, isOverdue } from "./invoice-helpers"
import type { Database, Invoice } from "./types"

export interface CustomerStats {
  invoiceCount: number
  billed: number
  paid: number
  outstanding: number
  overdue: number
  lastInvoiceDate?: string
}

/** Issued, non-void invoices: the ones that count as revenue and receivables. */
export function countable(inv: Invoice) {
  return inv.status !== "draft" && inv.status !== "void"
}

export function customerStats(db: Database) {
  const stats = new Map<string, CustomerStats>()
  for (const inv of db.invoices) {
    const s = stats.get(inv.customerId) ?? { invoiceCount: 0, billed: 0, paid: 0, outstanding: 0, overdue: 0 }
    if (countable(inv)) {
      s.invoiceCount += 1
      s.billed += inv.total
      s.paid += inv.amountPaid
      s.outstanding += balanceDue(inv)
      if (isOverdue(inv)) s.overdue += balanceDue(inv)
      if (!s.lastInvoiceDate || inv.issueDate > s.lastInvoiceDate) s.lastInvoiceDate = inv.issueDate
    }
    stats.set(inv.customerId, s)
  }
  return stats
}

export const emptyStats: CustomerStats = { invoiceCount: 0, billed: 0, paid: 0, outstanding: 0, overdue: 0 }

// ---------- Time series & reports ----------

export function lastMonths(count: number, today: string) {
  const [y, m] = today.split("-").map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 - (count - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
}

export function monthlySeries(db: Database, months: string[]) {
  const invoiced = new Map<string, number>()
  const collected = new Map<string, number>()
  for (const inv of db.invoices) {
    if (!countable(inv)) continue
    const k = inv.issueDate.slice(0, 7)
    invoiced.set(k, (invoiced.get(k) ?? 0) + inv.total)
  }
  const voided = new Set(db.invoices.filter((i) => i.status === "void").map((i) => i.id))
  for (const p of db.payments) {
    if (voided.has(p.invoiceId)) continue
    const k = p.date.slice(0, 7)
    collected.set(k, (collected.get(k) ?? 0) + p.amount)
  }
  return months.map((month) => ({ month, invoiced: invoiced.get(month) ?? 0, collected: collected.get(month) ?? 0 }))
}

export const AGING_BUCKETS = [
  { key: "current", label: "Not yet due" },
  { key: "1-30", label: "1–30 days" },
  { key: "31-60", label: "31–60 days" },
  { key: "61-90", label: "61–90 days" },
  { key: "90+", label: "90+ days" },
] as const

export type AgingKey = (typeof AGING_BUCKETS)[number]["key"]

export function agingBucket(inv: Invoice, today: string): AgingKey {
  if (inv.dueDate >= today) return "current"
  const days = Math.round((Date.parse(today) - Date.parse(inv.dueDate)) / 86_400_000)
  if (days <= 30) return "1-30"
  if (days <= 60) return "31-60"
  if (days <= 90) return "61-90"
  return "90+"
}

export function agingReport(db: Database, today: string) {
  const totals: Record<AgingKey, { amount: number; count: number }> = {
    current: { amount: 0, count: 0 },
    "1-30": { amount: 0, count: 0 },
    "31-60": { amount: 0, count: 0 },
    "61-90": { amount: 0, count: 0 },
    "90+": { amount: 0, count: 0 },
  }
  for (const inv of db.invoices) {
    if (inv.status !== "sent" && inv.status !== "partial") continue
    const due = balanceDue(inv)
    if (due <= 0) continue
    const b = totals[agingBucket(inv, today)]
    b.amount += due
    b.count += 1
  }
  return totals
}
