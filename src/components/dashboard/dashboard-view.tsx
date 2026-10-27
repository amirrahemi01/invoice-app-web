"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  CloudSun,
  MoonStar,
  Sun,
  Sunrise,
  Sunset,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  FilePlus2,
  FileText,
  MessageSquare,
  Package,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { ChartLegend, RevenueChart } from "@/components/charts/revenue-chart"
import { RecordPaymentDialog } from "@/components/invoices/record-payment-dialog"
import { useData, useFormat } from "@/lib/hooks"
import { balanceDue, daysOverdue, displayStatus, isOverdue } from "@/lib/invoice-helpers"
import { AGING_BUCKETS, agingReport, countable, customerStats, lastMonths, monthlySeries } from "@/lib/metrics"
import { addDays, formatRelative, smsLink, todayISO } from "@/lib/format"
import type { Invoice } from "@/lib/types"
import { cn, sumBy } from "@/lib/utils"
import { translateMessage, useT, type TFunction } from "@/lib/i18n"

const SETUP_KEY = "belami-setup-dismissed"

/** Greeting and icon by the visitor's local time of day. */
function greeting(t: TFunction, now = new Date()) {
  const h = now.getHours()
  if (h >= 5 && h < 12) return { text: t("Good morning"), Icon: Sunrise, tone: "text-amber-500" }
  if (h >= 12 && h < 15) return { text: t("Good noon"), Icon: Sun, tone: "text-yellow-500" }
  if (h >= 15 && h < 18) return { text: t("Good afternoon"), Icon: CloudSun, tone: "text-orange-500" }
  if (h >= 18 && h < 22) return { text: t("Good evening"), Icon: Sunset, tone: "text-rose-500" }
  return { text: t("Good night"), Icon: MoonStar, tone: "text-indigo-400" }
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const { t, n } = useT()
  if (previous === 0) return <span>{t("vs. last month: —")}</span>
  const pct = ((current - previous) / previous) * 100
  const up = pct >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={cn("inline-flex items-center gap-1", up ? "text-success-text" : "text-danger-text")}>
      <Icon className="size-3.5" />
      <span dir="ltr">
        {up ? "+" : ""}
        {n(Math.round(pct))}%
      </span>{" "}
      {t("vs. last month")}
    </span>
  )
}

export function DashboardView() {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  // Re-evaluated every minute so the greeting follows the clock.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const today = todayISO()
  const hello = greeting(t, now)
  const [payFor, setPayFor] = useState<Invoice | null>(null)
  const [setupDismissed, setSetupDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(SETUP_KEY) === "1"
    } catch {
      return false
    }
  })

  const months = useMemo(() => lastMonths(12, today), [today])
  const series = useMemo(() => monthlySeries(db, months), [db, months])
  const aging = useMemo(() => agingReport(db, today), [db, today])
  const thisMonth = series[series.length - 1]
  const lastMonth = series[series.length - 2]

  const open = db.invoices.filter((i) => (i.status === "sent" || i.status === "partial") && balanceDue(i) > 0)
  const overdue = open.filter((i) => isOverdue(i, today)).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const dueSoon = open
    .filter((i) => !isOverdue(i, today) && i.dueDate <= addDays(today, 7))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const drafts = db.invoices.filter((i) => i.status === "draft")
  const outstanding = sumBy(open, balanceDue)
  const overdueTotal = sumBy(overdue, balanceDue)
  const agingMax = Math.max(1, ...Object.values(aging).map((a) => a.amount))

  const yearKey = today.slice(0, 4)
  const topCustomers = useMemo(() => {
    const totals = new Map<string, number>()
    for (const inv of db.invoices) {
      if (!countable(inv) || !inv.issueDate.startsWith(yearKey)) continue
      totals.set(inv.customerId, (totals.get(inv.customerId) ?? 0) + inv.total)
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, total]) => ({ customer: db.customers.find((c) => c.id === id), total }))
  }, [db.invoices, db.customers, yearKey])
  const topMax = topCustomers[0]?.total ?? 1
  const stats = useMemo(() => customerStats(db), [db])

  const lowStock = db.products.filter((p) => !p.archived && p.trackStock && p.stock <= p.lowStockAt).sort((a, b) => a.stock - b.stock)

  const setupSteps = [
    { done: !!db.settings.business.logo, label: t("Upload your logo"), href: "/settings?tab=business" },
    { done: db.settings.template.id !== "classic" || db.settings.template.accent !== "#4f46e5", label: t("Pick an invoice template and color"), href: "/settings?tab=template" },
    { done: db.settings.business.name !== "بتن دکوراتیو", label: t("Enter your business details"), href: "/settings?tab=business" },
    { done: db.invoices.some((i) => i.id.length > 7), label: t("Create your first invoice"), href: "/invoices/new" },
  ]
  const setupDone = setupSteps.filter((s) => s.done).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{fmt.date(today, "long")}</p>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <hello.Icon className={`size-6 ${hello.tone}`} aria-hidden />
            {hello.text}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/invoices?status=outstanding">
              <CreditCard /> {t("Record payment")}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/invoices/new">
              <FilePlus2 /> {t("New invoice")}
            </Link>
          </Button>
        </div>
      </div>

      {!setupDismissed && setupDone < setupSteps.length && (
        <section className="relative rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] to-transparent p-4 sm:p-5">
          <button
            type="button"
            className="absolute end-3 top-3 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("Dismiss")}
            onClick={() => {
              setSetupDismissed(true)
              try {
                window.localStorage.setItem(SETUP_KEY, "1")
              } catch {}
            }}
          >
            <X className="size-4" />
          </button>
          <h2 className="font-medium">{t("Make it yours")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("{done} of {total} done. You're exploring demo data, so feel free to change anything.", { done: setupDone, total: setupSteps.length })}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {setupSteps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:border-primary/40">
                  {s.done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}
                  <span className={cn(s.done && "text-muted-foreground line-through")}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <Link href="/invoices?status=outstanding" className="rounded-xl transition-shadow hover:shadow-md">
          <StatCard label={t("Outstanding")} value={fmt.compact(outstanding)} icon={Wallet} tone="info" hint={t("{n} unpaid invoices", { n: open.length })} className="h-full" />
        </Link>
        <Link href="/invoices?status=overdue" className="rounded-xl transition-shadow hover:shadow-md">
          <StatCard label={t("Overdue")} value={fmt.compact(overdueTotal)} icon={AlertTriangle} tone={overdue.length ? "danger" : "default"} hint={t("{n} invoices", { n: overdue.length })} className="h-full" />
        </Link>
        <StatCard
          label={t("Collected this month")}
          value={fmt.compact(thisMonth.collected)}
          icon={CreditCard}
          tone="success"
          hint={<Delta current={thisMonth.collected} previous={lastMonth.collected} />}
        />
        <StatCard label={t("Invoiced this month")} value={fmt.compact(thisMonth.invoiced)} icon={FileText} hint={<Delta current={thisMonth.invoiced} previous={lastMonth.invoiced} />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">{t("Revenue")}</h2>
              <p className="text-sm text-muted-foreground">{t("Last 12 months · {amount} collected", { amount: fmt.money(sumBy(series, (s) => s.collected)) })}</p>
            </div>
            <ChartLegend />
          </div>
          <RevenueChart data={series} currency={fmt.currency} locale={fmt.locale} />
        </section>

        <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="font-medium">{t("Receivables aging")}</h2>
              <p className="text-sm text-muted-foreground">{t("{amount} unpaid", { amount: fmt.money(outstanding) })}</p>
            </div>
            <Link href="/reports?tab=aging" className="text-sm text-primary hover:underline">
              {t("Details")}
            </Link>
          </div>
          <ul className="space-y-3.5">
            {AGING_BUCKETS.map((b, i) => {
              const row = aging[b.key]
              return (
                <li key={b.key}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{t(b.label)}</span>
                    <span className="tabular font-medium">
                      {fmt.money(row.amount)} <span className="text-xs font-normal text-muted-foreground">· {n(row.count)}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", i === 0 ? "bg-chart-1" : i === 1 ? "bg-warning" : "bg-destructive")}
                      style={{ width: `${(row.amount / agingMax) * 100}%`, opacity: i >= 2 ? 0.55 + i * 0.12 : 1 }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border bg-card shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <h2 className="font-medium">{t("Needs attention")}</h2>
            <Link href="/invoices?status=overdue" className="flex items-center gap-1 text-sm text-primary hover:underline">
              {t("All overdue")} <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>
          {overdue.length === 0 && dueSoon.length === 0 && drafts.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-8 text-sm text-muted-foreground">
              <CheckCircle2 className="size-5 text-success" /> {t("You're all caught up.")}
            </div>
          ) : (
            <ul className="divide-y">
              {[...overdue.slice(0, 5), ...dueSoon.slice(0, 3)].map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                  <Link href={`/invoices/${inv.id}`} className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                    <p className="truncate font-medium">{inv.customerSnapshot.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.number} ·{" "}
                      {isOverdue(inv, today) ? (
                        <span className="text-danger-text">{t("{n} days overdue", { n: daysOverdue(inv, today) })}</span>
                      ) : (
                        <span className="text-warning-text">{t("due {date}", { date: fmt.date(inv.dueDate) })}</span>
                      )}
                    </p>
                  </Link>
                  <div className="flex basis-full items-center justify-between gap-3 sm:basis-auto sm:justify-end">
                  <p className="tabular font-semibold sm:text-end">{fmt.money(balanceDue(inv), inv.currency)}</p>
                  <div className="flex shrink-0 gap-1">
                    {inv.customerSnapshot.phone && (
                      <Button variant="ghost" size="icon-sm" asChild aria-label={t("Send reminder")}>
                        <a
                          href={smsLink(
                            inv.customerSnapshot.phone,
                            t("Reminder: invoice {number} for {amount} was due on {date}.", {
                              number: inv.number ?? "",
                              amount: fmt.money(balanceDue(inv), inv.currency),
                              date: fmt.date(inv.dueDate),
                            }),
                          )}
                        >
                          <MessageSquare />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setPayFor(inv)}>
                      <CreditCard /> {t("Paid")}
                    </Button>
                  </div>
                  </div>
                </li>
              ))}
              {drafts.length > 0 && (
                <li>
                  <Link href="/invoices?status=draft" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50 sm:px-5">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="flex-1">
                      {t(drafts.length === 1 ? "{n} draft waiting to be issued" : "{n} drafts waiting to be issued", { n: drafts.length })}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground rtl:rotate-180" />
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card shadow-xs">
          <h2 className="border-b px-4 py-3 font-medium sm:px-5">{t("Recent activity")}</h2>
          <ol className="divide-y">
            {db.activity.slice(0, 7).map((a) => (
              <li key={a.id} className="flex gap-3 px-4 py-2.5 text-sm sm:px-5">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    a.type.startsWith("payment") ? "bg-success" : a.type === "invoice.voided" ? "bg-destructive" : "bg-primary",
                  )}
                />
                <div className="min-w-0">
                  {a.invoiceId ? (
                    <Link href={`/invoices/${a.invoiceId}`} className="line-clamp-2 hover:text-primary">
                      {translateMessage(a.message)}
                    </Link>
                  ) : (
                    <p className="line-clamp-2">{translateMessage(a.message)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt, fmt.locale)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border bg-card shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <h2 className="font-medium">{t("Recent invoices")}</h2>
            <Link href="/invoices" className="flex items-center gap-1 text-sm text-primary hover:underline">
              {t("View all")} <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>
          <ul className="divide-y">
            {[...db.invoices]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 6)
              .map((inv) => (
                <li key={inv.id}>
                  <Link href={`/invoices/${inv.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{inv.customerSnapshot.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.number ?? t("Draft")} · {fmt.date(inv.issueDate)}
                      </p>
                    </div>
                    <StatusBadge status={displayStatus(inv, today)} className="hidden sm:inline-flex" />
                    <p className="tabular w-24 text-end font-medium">{fmt.money(inv.total, inv.currency)}</p>
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
            <h2 className="font-medium">{t("Top customers")}</h2>
            <p className="text-sm text-muted-foreground">{t("Billed in {year}", { year: fmt.number(Number(yearKey)).replace(/[,٬]/g, "") })}</p>
            <ul className="mt-4 space-y-3">
              {topCustomers.map(({ customer, total }) =>
                customer ? (
                  <li key={customer.id}>
                    <Link href={`/customers/${customer.id}`} className="group block">
                      <div className="mb-1 flex justify-between gap-2 text-sm">
                        <span className="truncate group-hover:text-primary">{customer.name}</span>
                        <span className="tabular font-medium">{fmt.compact(total)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-chart-1" style={{ width: `${(total / topMax) * 100}%` }} />
                      </div>
                      {(stats.get(customer.id)?.overdue ?? 0) > 0 && (
                        <p className="mt-0.5 text-xs text-danger-text">{t("{amount} overdue", { amount: fmt.money(stats.get(customer.id)!.overdue) })}</p>
                      )}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </section>

          <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{t("Low stock")}</h2>
              <Link href="/products" className="text-sm text-primary hover:underline">
                {t("Products")}
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t("Everything is well stocked.")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {lowStock.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link href={`/products/${p.id}`} className="flex items-center gap-2 text-sm hover:text-primary">
                      <Package className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className={cn("tabular rounded px-1.5 text-xs font-medium", p.stock <= 0 ? "bg-danger-soft text-danger-text" : "bg-warning-soft text-warning-text")}>
                        {p.stock <= 0 ? t("Out") : n(p.stock)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <RecordPaymentDialog invoice={payFor} open={payFor !== null} onOpenChange={(o) => !o && setPayFor(null)} />
    </div>
  )
}
