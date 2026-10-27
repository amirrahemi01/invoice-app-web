// Invoice calculation engine. Pure and shared by the editor preview and the
// store (and later the server), so totals are always computed the same way.
//
// All arithmetic happens in integer minor units (cents) to avoid float drift.
// Order: qty × price → line discount → invoice discount (allocated pro rata)
// → tax per line → rounding per line to the currency's precision.

import { currencyDecimals } from "./format"
import type { DiscountType, InvoiceLine, InvoiceTotals, LineTotals, TaxBreakdown } from "./types"

export interface CalcInput {
  lines: Pick<InvoiceLine, "quantity" | "unitPrice" | "discountType" | "discountValue" | "taxName" | "taxRate">[]
  discountType: DiscountType
  discountValue: number
  currency: string
  pricesIncludeTax: boolean
}

function toMinor(amount: number, factor: number) {
  return Math.round(Number((amount * factor).toFixed(6)))
}

function discountMinor(base: number, type: DiscountType, value: number, factor: number) {
  if (!value || value <= 0 || base <= 0) return 0
  if (type === "percent") return Math.min(base, Math.round((base * Math.min(value, 100)) / 100))
  return Math.min(base, toMinor(value, factor))
}

/** Split `amount` across `weights` proportionally, so the parts sum exactly to `amount`. */
export function allocate(amount: number, weights: number[]) {
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (amount === 0 || totalWeight === 0) return weights.map(() => 0)
  const raw = weights.map((w) => (amount * w) / totalWeight)
  const parts = raw.map(Math.floor)
  let remainder = amount - parts.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac)
  for (let k = 0; remainder > 0 && k < order.length; k++, remainder--) parts[order[k].i] += 1
  return parts
}

export function calculateInvoice(input: CalcInput): InvoiceTotals {
  const factor = 10 ** currencyDecimals(input.currency)

  const base = input.lines.map((line) => {
    const qty = Number.isFinite(line.quantity) ? Math.max(0, line.quantity) : 0
    const price = Number.isFinite(line.unitPrice) ? line.unitPrice : 0
    const gross = Math.round(qty * toMinor(price, factor))
    const lineDiscount = discountMinor(gross, line.discountType, line.discountValue, factor)
    return { gross, lineDiscount, net: gross - lineDiscount }
  })

  const netSum = base.reduce((sum, b) => sum + b.net, 0)
  const invoiceDiscount = discountMinor(netSum, input.discountType, input.discountValue, factor)
  const allocations = allocate(
    invoiceDiscount,
    base.map((b) => Math.max(0, b.net)),
  )

  const taxMap = new Map<string, TaxBreakdown>()
  const lines: LineTotals[] = base.map((b, i) => {
    const rate = Math.max(0, input.lines[i].taxRate || 0)
    const afterDiscount = b.net - allocations[i]
    let taxable: number
    let tax: number
    if (input.pricesIncludeTax) {
      taxable = Math.round(afterDiscount / (1 + rate / 100))
      tax = afterDiscount - taxable
    } else {
      taxable = afterDiscount
      tax = Math.round((taxable * rate) / 100)
    }
    if (rate > 0) {
      const key = `${input.lines[i].taxName}|${rate}`
      const entry = taxMap.get(key) ?? { name: input.lines[i].taxName, rate, taxable: 0, tax: 0 }
      entry.taxable += taxable
      entry.tax += tax
      taxMap.set(key, entry)
    }
    return {
      gross: b.gross,
      lineDiscount: b.lineDiscount,
      net: b.net,
      invoiceDiscount: allocations[i],
      taxable,
      tax,
      total: taxable + tax,
    }
  })

  const subtotal = base.reduce((s, b) => s + b.gross, 0)
  const lineDiscountTotal = base.reduce((s, b) => s + b.lineDiscount, 0)
  const taxTotal = lines.reduce((s, l) => s + l.tax, 0)
  const total = lines.reduce((s, l) => s + l.total, 0)
  const toMajor = (minor: number) => minor / factor

  return {
    lines: lines.map((l) => ({
      gross: toMajor(l.gross),
      lineDiscount: toMajor(l.lineDiscount),
      net: toMajor(l.net),
      invoiceDiscount: toMajor(l.invoiceDiscount),
      taxable: toMajor(l.taxable),
      tax: toMajor(l.tax),
      total: toMajor(l.total),
    })),
    subtotal: toMajor(subtotal),
    lineDiscountTotal: toMajor(lineDiscountTotal),
    invoiceDiscountTotal: toMajor(invoiceDiscount),
    discountTotal: toMajor(lineDiscountTotal + invoiceDiscount),
    taxTotal: toMajor(taxTotal),
    total: toMajor(total),
    taxes: [...taxMap.values()].map((t) => ({ ...t, taxable: toMajor(t.taxable), tax: toMajor(t.tax) })),
  }
}

/** Round a major-unit amount to the currency's precision. */
export function roundMoney(amount: number, currency: string) {
  const factor = 10 ** currencyDecimals(currency)
  return toMinor(amount, factor) / factor
}
