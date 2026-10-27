"use client"

import { calculateInvoice } from "./calc"
import { docLabels, docDirection } from "./doc-i18n"
import { downloadCSV, downloadText, downloadXLSX, safeFilename, type Cell } from "./export"
import { formatMoney, formatNumber } from "./format"
import { balanceDue, STATUS_LABELS, displayStatus } from "./invoice-helpers"
import type { Customer, Invoice, Payment, Product, Settings } from "./types"

function invoiceName(invoice: Invoice) {
  return safeFilename(invoice.number ?? `draft-${invoice.id}`)
}

function lineRows(invoice: Invoice): Cell[][] {
  const t = docLabels(invoice.language)
  const totals = calculateInvoice(invoice)
  return [
    [t.item, t.sku, t.qty, "Unit", t.unitPrice, t.discount, t.tax + " %", t.tax, t.amount],
    ...invoice.lines.map((line, i) => [
      line.name,
      line.sku ?? "",
      line.quantity,
      line.unit,
      line.unitPrice,
      totals.lines[i].lineDiscount + totals.lines[i].invoiceDiscount,
      line.taxRate,
      totals.lines[i].tax,
      totals.lines[i].total,
    ]),
  ]
}

function summaryRows(invoice: Invoice): Cell[][] {
  const t = docLabels(invoice.language)
  return [
    [t.subtotal, invoice.subtotal],
    [t.discount, invoice.discountTotal ? -invoice.discountTotal : 0],
    [t.tax, invoice.taxTotal],
    [t.total, invoice.total],
    [t.amountPaid, invoice.amountPaid],
    [t.balanceDue, balanceDue(invoice)],
  ]
}

export function exportInvoiceCSV(invoice: Invoice) {
  const t = docLabels(invoice.language)
  const rows: Cell[][] = [
    [t.number, invoice.number ?? t.draft],
    [t.issueDate, invoice.issueDate],
    [t.dueDate, invoice.dueDate],
    [t.billTo, invoice.customerSnapshot.name],
    ["Currency", invoice.currency],
    [],
    ...lineRows(invoice),
    [],
    ...summaryRows(invoice),
  ]
  downloadCSV(rows, `${invoiceName(invoice)}.csv`)
}

export function exportInvoiceXLSX(invoice: Invoice, settings: Settings) {
  const t = docLabels(invoice.language)
  const header: Cell[][] = [
    [settings.business.name],
    [t.invoice, invoice.number ?? t.draft],
    [t.issueDate, invoice.issueDate],
    [t.dueDate, invoice.dueDate],
    [t.billTo, invoice.customerSnapshot.name],
    ["Currency", invoice.currency],
    [],
  ]
  const lines = lineRows(invoice)
  const summary = summaryRows(invoice)
  const rows = [...header, ...lines, [], ...summary]
  const lineHeaderRow = header.length
  const totalRow = header.length + lines.length + 1 + 3
  downloadXLSX(
    [{ name: invoice.number ?? "Draft", rows, boldRows: [0, lineHeaderRow, totalRow], rtl: docDirection(invoice.language) === "rtl" }],
    `${invoiceName(invoice)}.xlsx`,
  )
}

export function invoiceToText(invoice: Invoice, settings: Settings) {
  const t = docLabels(invoice.language)
  const money = (n: number) => formatMoney(n, invoice.currency, settings.locale.locale)
  const totals = calculateInvoice(invoice)
  const width = 64
  const rule = "-".repeat(width)
  const row = (left: string, right: string) => left + " ".repeat(Math.max(1, width - left.length - right.length)) + right
  const out: string[] = [
    settings.business.name.toUpperCase(),
    [settings.business.address.line1, settings.business.address.city, settings.business.address.country].filter(Boolean).join(", "),
    [settings.business.email, settings.business.phone].filter(Boolean).join(" · "),
    "",
    `${t.invoice.toUpperCase()} ${invoice.number ?? `(${t.draft})`}`,
    row(`${t.issueDate}: ${invoice.issueDate}`, `${t.dueDate}: ${invoice.dueDate}`),
    invoice.reference ? `${t.reference}: ${invoice.reference}` : "",
    "",
    `${t.billTo}:`,
    invoice.customerSnapshot.name,
    invoice.customerSnapshot.phone ?? "",
    "",
    rule,
  ]
  invoice.lines.forEach((line, i) => {
    out.push(row(line.name, money(totals.lines[i].total)))
    out.push(`  ${formatNumber(line.quantity)} ${line.unit} × ${money(line.unitPrice)}${line.taxRate ? `  (+${line.taxRate}% ${line.taxName})` : ""}`)
  })
  out.push(rule)
  out.push(row(t.subtotal, money(invoice.subtotal)))
  if (invoice.discountTotal) out.push(row(t.discount, "-" + money(invoice.discountTotal)))
  out.push(row(t.tax, money(invoice.taxTotal)))
  out.push(row(t.total, money(invoice.total)))
  if (invoice.amountPaid) out.push(row(t.amountPaid, money(invoice.amountPaid)))
  out.push(row(t.balanceDue, money(balanceDue(invoice))))
  out.push(rule)
  if (invoice.notes) out.push("", `${t.notes}:`, invoice.notes)
  if (invoice.terms) out.push("", `${t.terms}:`, invoice.terms)
  if (settings.template.showPaymentInstructions && settings.invoice.paymentInstructions)
    out.push("", `${t.paymentInstructions}:`, settings.invoice.paymentInstructions)
  return out.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n")
}

export function exportInvoiceText(invoice: Invoice, settings: Settings) {
  downloadText(invoiceToText(invoice, settings), `${invoiceName(invoice)}.txt`)
}

// ---------- List exports ----------

export function invoiceListRows(invoices: Invoice[]): Cell[][] {
  return [
    ["Number", "Customer", "Status", "Issue date", "Due date", "Currency", "Subtotal", "Discount", "Tax", "Total", "Paid", "Balance"],
    ...invoices.map((inv) => [
      inv.number ?? "Draft",
      inv.customerSnapshot.name,
      STATUS_LABELS[displayStatus(inv)],
      inv.issueDate,
      inv.dueDate,
      inv.currency,
      inv.subtotal,
      inv.discountTotal,
      inv.taxTotal,
      inv.total,
      inv.amountPaid,
      balanceDue(inv),
    ]),
  ]
}

export function productRows(products: Product[], taxName: (id: string | null) => string): Cell[][] {
  return [
    ["Name", "Code", "Category", "Unit", "Price", "Prices by type", "Tax", "Stock", "Status", "Description"],
    ...products.map((p) => [
      p.name,
      p.sku,
      p.category,
      p.unit,
      p.price,
      p.variants.map((v) => `${v.label}: ${v.price}`).join(" | "),
      taxName(p.taxRateId),
      p.trackStock ? p.stock : "",
      p.archived ? "Archived" : "Active",
      p.description ?? "",
    ]),
  ]
}

export function customerRows(customers: Customer[], balances: Map<string, number>): Cell[][] {
  return [
    ["Name", "Phone", "Outstanding"],
    ...customers.map((c) => [c.name, c.phone ?? "", balances.get(c.id) ?? 0]),
  ]
}

export function paymentRows(payments: Payment[], invoiceById: Map<string, Invoice>): Cell[][] {
  return [
    ["Date", "Invoice", "Customer", "Method", "Reference", "Amount"],
    ...payments.map((p) => {
      const inv = invoiceById.get(p.invoiceId)
      return [p.date, inv?.number ?? "", inv?.customerSnapshot.name ?? "", p.method, p.reference ?? "", p.amount]
    }),
  ]
}
