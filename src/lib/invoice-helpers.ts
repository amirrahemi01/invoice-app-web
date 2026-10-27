import { calculateInvoice, roundMoney } from "./calc"
import { daysBetween, todayISO } from "./format"
import type {
  Customer,
  CustomerSnapshot,
  DisplayStatus,
  Invoice,
  InvoiceStatus,
  PaymentMethod,
  Product,
  TaxRate,
  InvoiceLine,
} from "./types"
import { uid } from "./utils"

export function balanceDue(invoice: Invoice) {
  return roundMoney(Math.max(0, invoice.total - invoice.amountPaid), invoice.currency)
}

export function isOverdue(invoice: Invoice, today = todayISO()) {
  return (invoice.status === "sent" || invoice.status === "partial") && invoice.dueDate < today && balanceDue(invoice) > 0
}

export function displayStatus(invoice: Invoice, today = todayISO()): DisplayStatus {
  return isOverdue(invoice, today) ? "overdue" : invoice.status
}

export function daysOverdue(invoice: Invoice, today = todayISO()) {
  return Math.max(0, daysBetween(invoice.dueDate, today))
}

/** Status after a payment change. Draft and void are never changed here. */
export function statusFromPayments(invoice: Pick<Invoice, "status" | "total" | "amountPaid" | "currency">): InvoiceStatus {
  if (invoice.status === "draft" || invoice.status === "void") return invoice.status
  const balance = roundMoney(invoice.total - invoice.amountPaid, invoice.currency)
  if (balance <= 0 && invoice.total > 0) return "paid"
  if (invoice.amountPaid > 0) return "partial"
  return "sent"
}

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  card: "Card",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other",
}

/** Expand a number pattern like "INV-{YYYY}-{####}" */
export function formatInvoiceNumber(pattern: string, n: number, date = todayISO()) {
  return pattern
    .replace(/\{YYYY\}/g, date.slice(0, 4))
    .replace(/\{YY\}/g, date.slice(2, 4))
    .replace(/\{MM\}/g, date.slice(5, 7))
    .replace(/\{(#+)\}/g, (_, hashes: string) => String(n).padStart(hashes.length, "0"))
}

export function customerSnapshot(customer: Customer): CustomerSnapshot {
  return { name: customer.name, phone: customer.phone }
}

export function lineFromProduct(product: Product, taxRates: TaxRate[], variantLabel?: string): InvoiceLine {
  const tax = taxRates.find((t) => t.id === product.taxRateId)
  const variant = product.variants.find((v) => v.label === variantLabel) ?? product.variants[0]
  return {
    id: uid("ln_"),
    productId: product.id,
    name: product.name,
    description: product.description,
    sku: product.sku,
    variant: variant?.label,
    unit: product.unit,
    quantity: 1,
    unitPrice: variant?.price ?? product.price,
    discountType: "percent",
    discountValue: 0,
    taxRateId: tax?.id ?? null,
    taxName: tax?.name ?? "",
    taxRate: tax?.rate ?? 0,
  }
}

export function emptyLine(defaultTax?: TaxRate): InvoiceLine {
  return {
    id: uid("ln_"),
    productId: null,
    name: "",
    unit: "pcs",
    quantity: 1,
    unitPrice: 0,
    discountType: "percent",
    discountValue: 0,
    taxRateId: defaultTax?.id ?? null,
    taxName: defaultTax?.name ?? "",
    taxRate: defaultTax?.rate ?? 0,
  }
}

/** Recompute stored totals from lines. */
export function withTotals(invoice: Invoice): Invoice {
  const totals = calculateInvoice(invoice)
  const next = {
    ...invoice,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
  }
  return { ...next, status: statusFromPayments(next) }
}
