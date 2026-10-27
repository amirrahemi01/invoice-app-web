"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts"
import { useT } from "@/lib/i18n"
import { formatMoney, monthLabel } from "@/lib/format"

export interface RevenuePoint {
  month: string
  invoiced: number
  collected: number
}

const SERIES = [
  { key: "invoiced", label: "Invoiced", color: "var(--chart-1)" },
  { key: "collected", label: "Collected", color: "var(--chart-2)" },
] as const

function ChartTooltip({ active, payload, label, currency, locale }: TooltipProps<number, string> & { currency: string; locale: string }) {
  const { t } = useT()
  if (!active || !payload?.length) return null
  return (
    <div dir="rtl" className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium">{monthLabel(String(label), locale)}</p>
      {SERIES.map((s) => {
        const item = payload.find((p) => p.dataKey === s.key)
        return (
          <p key={s.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm" style={{ background: s.color }} />
              {t(s.label)}
            </span>
            <span className="tabular font-medium">{formatMoney(Number(item?.value ?? 0), currency, locale)}</span>
          </p>
        )
      })}
    </div>
  )
}

export function ChartLegend() {
  const { t } = useT()
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      {SERIES.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
          {t(s.label)}
        </span>
      ))}
    </div>
  )
}

/** Invoiced vs collected per month. One axis, grouped thin bars, legend + hover tooltip. */
export function RevenueChart({ data, currency, locale, height = 280 }: { data: RevenuePoint[]; currency: string; locale: string; height?: number }) {
  const { t, dir } = useT()
  // Axis shows plain numbers in millions (or thousands); the unit is stated once above the chart.
  const max = Math.max(1, ...data.map((d) => Math.max(d.invoiced, d.collected)))
  const divisor = max >= 1_000_000 ? 1_000_000 : max >= 1_000 ? 1_000 : 1
  const unit = divisor === 1_000_000 ? t("Millions") : divisor === 1_000 ? t("Thousands") : ""
  const axisNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  return (
    <div style={{ height }} className="w-full">
      {unit && (
        <p className="mb-1 text-xs text-muted-foreground">
          {unit} {currency === "IRT" ? t("Toman") : currency === "IRR" ? t("Rial") : currency}
        </p>
      )}
      <div dir="ltr" style={{ height: unit ? "92%" : "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} accessibilityLayer barGap={2} barCategoryGap="16%">
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
          <XAxis
            dataKey="month"
            reversed={dir === "rtl"}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(m: string) => monthLabel(m, locale)}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            orientation={dir === "rtl" ? "right" : "left"}
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(v: number) => axisNumber.format(v / divisor)}
          />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<ChartTooltip currency={currency} locale={locale} />} />
          {SERIES.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={t(s.label)} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
