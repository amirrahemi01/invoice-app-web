"use client"

// Client-side mock database persisted to localStorage. Every mutation goes
// through the actions below, which are shaped like the future server actions
// (validate → compute → write → log activity), so the UI won't need to change
// when the backend arrives.

import { useSyncExternalStore } from "react"
import { roundMoney } from "./calc"
import { todayISO } from "./format"
import { customerSnapshot, formatInvoiceNumber, statusFromPayments, withTotals } from "./invoice-helpers"
import { createSeedDatabase, DB_VERSION } from "./mock/seed"
import type { Activity, ActivityType, Customer, Database, Invoice, Payment, Product, Settings, TaxRate } from "./types"
import { uid } from "./utils"

const STORAGE_KEY = "belami-invoice-demo"

let db: Database | null = null
const listeners = new Set<() => void>()

function load(): Database {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (parsed.version === DB_VERSION) return parsed
    }
  } catch {
    // Corrupt or blocked storage: fall back to fresh demo data.
  }
  return createSeedDatabase()
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Storage full or unavailable: keep working in memory.
  }
}

function getDB(): Database {
  if (!db) {
    db = load()
    persist()
  }
  return db
}

function commit(update: (draft: Database) => Database) {
  db = update(getDB())
  persist()
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      db = load()
      listener()
    }
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** Returns the database, or null during server render / before hydration. */
export function useDB(): Database | null {
  return useSyncExternalStore(subscribe, getDB, () => null)
}

const now = () => new Date().toISOString()

function log(d: Database, type: ActivityType, message: string, refs: Pick<Activity, "invoiceId" | "customerId"> = {}): Database {
  const entry: Activity = { id: uid("act_"), type, message, createdAt: now(), ...refs }
  return { ...d, activity: [entry, ...d.activity].slice(0, 300) }
}

function replace<T extends { id: string }>(list: T[], item: T) {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list]
}

// ---------- Settings ----------

export function updateSettings(patch: Partial<Settings>) {
  commit((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
}

export function saveTaxRate(tax: TaxRate) {
  commit((d) => {
    let taxRates = replace(d.taxRates, tax)
    if (tax.isDefault) taxRates = taxRates.map((t) => ({ ...t, isDefault: t.id === tax.id }))
    return { ...d, taxRates }
  })
}

export function deleteTaxRate(id: string) {
  commit((d) => ({
    ...d,
    taxRates: d.taxRates.filter((t) => t.id !== id),
    products: d.products.map((p) => (p.taxRateId === id ? { ...p, taxRateId: null } : p)),
  }))
}

export function resetDemoData() {
  db = createSeedDatabase()
  persist()
  listeners.forEach((listener) => listener())
}

export function clearAllData() {
  commit((d) => ({ ...d, products: [], customers: [], invoices: [], payments: [], activity: [] }))
}

// ---------- Products ----------

export function saveProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const id = input.id ?? uid("prd_")
  commit((d) => {
    const existing = d.products.find((p) => p.id === id)
    const product: Product = { ...input, id, createdAt: existing?.createdAt ?? now(), updatedAt: now() }
    const next = { ...d, products: replace(d.products, product) }
    return existing ? next : log(next, "product.created", `Product "${product.name}" added`)
  })
  return id
}

export function setProductsArchived(ids: string[], archived: boolean) {
  commit((d) => ({ ...d, products: d.products.map((p) => (ids.includes(p.id) ? { ...p, archived, updatedAt: now() } : p)) }))
}

export function productIsUsed(d: Database, id: string) {
  return d.invoices.some((inv) => inv.lines.some((l) => l.productId === id))
}

/** Hard delete only products that never appear on an invoice; archive the rest. */
export function deleteProducts(ids: string[]) {
  commit((d) => {
    const used = new Set(ids.filter((id) => productIsUsed(d, id)))
    return {
      ...d,
      products: d.products
        .filter((p) => !ids.includes(p.id) || used.has(p.id))
        .map((p) => (used.has(p.id) ? { ...p, archived: true } : p)),
    }
  })
}

// ---------- Customers ----------

export function saveCustomer(input: Omit<Customer, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const id = input.id ?? uid("cus_")
  commit((d) => {
    const existing = d.customers.find((c) => c.id === id)
    const customer: Customer = { ...input, id, createdAt: existing?.createdAt ?? now(), updatedAt: now() }
    // Drafts follow customer edits; issued invoices keep their frozen snapshot.
    const invoices = d.invoices.map((inv) =>
      inv.customerId === id && inv.status === "draft" ? { ...inv, customerSnapshot: customerSnapshot(customer) } : inv,
    )
    const next = { ...d, customers: replace(d.customers, customer), invoices }
    return existing ? next : log(next, "customer.created", `Customer "${customer.name}" added`, { customerId: id })
  })
  return id
}

export function setCustomerArchived(id: string, archived: boolean) {
  commit((d) => ({ ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, archived, updatedAt: now() } : c)) }))
}

export function deleteCustomer(id: string) {
  commit((d) => {
    if (d.invoices.some((inv) => inv.customerId === id)) {
      return { ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, archived: true } : c)) }
    }
    return { ...d, customers: d.customers.filter((c) => c.id !== id) }
  })
}

// ---------- Invoices ----------

function adjustStock(d: Database, invoice: Invoice, direction: -1 | 1): Product[] {
  const qtyByProduct = new Map<string, number>()
  for (const line of invoice.lines) {
    if (line.productId) qtyByProduct.set(line.productId, (qtyByProduct.get(line.productId) ?? 0) + line.quantity)
  }
  return d.products.map((p) =>
    p.trackStock && qtyByProduct.has(p.id) ? { ...p, stock: p.stock + direction * (qtyByProduct.get(p.id) ?? 0) } : p,
  )
}

export type InvoiceDraft = Omit<
  Invoice,
  "id" | "number" | "status" | "customerSnapshot" | "subtotal" | "discountTotal" | "taxTotal" | "total" | "amountPaid" | "createdAt" | "updatedAt"
> & { id?: string }

/** Create or update a draft. Issued invoices are locked and cannot be saved here. */
export function saveDraft(input: InvoiceDraft): string {
  const id = input.id ?? uid("inv_")
  commit((d) => {
    const existing = d.invoices.find((i) => i.id === id)
    if (existing && existing.status !== "draft") return d
    const customer = d.customers.find((c) => c.id === input.customerId)
    const invoice = withTotals({
      ...input,
      id,
      number: null,
      status: "draft",
      customerSnapshot: customer ? customerSnapshot(customer) : (existing?.customerSnapshot ?? { name: "" }),
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      total: 0,
      amountPaid: 0,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    })
    const next = { ...d, invoices: replace(d.invoices, invoice) }
    return existing
      ? next
      : log(next, "invoice.created", `Draft invoice created for ${invoice.customerSnapshot.name || "a customer"}`, {
          invoiceId: id,
          customerId: invoice.customerId,
        })
  })
  return id
}

/** Assign the next number, freeze customer details, deduct stock, mark as sent. */
export function issueInvoice(id: string) {
  commit((d) => {
    const invoice = d.invoices.find((i) => i.id === id)
    if (!invoice || invoice.status !== "draft") return d
    const customer = d.customers.find((c) => c.id === invoice.customerId)
    const number = formatInvoiceNumber(d.settings.invoice.numberFormat, d.settings.invoice.nextNumber, invoice.issueDate)
    const issued: Invoice = withTotals({
      ...invoice,
      number,
      status: "sent",
      customerSnapshot: customer ? customerSnapshot(customer) : invoice.customerSnapshot,
      issuedAt: now(),
      updatedAt: now(),
    })
    const next: Database = {
      ...d,
      invoices: replace(d.invoices, issued),
      products: adjustStock(d, issued, -1),
      settings: { ...d.settings, invoice: { ...d.settings.invoice, nextNumber: d.settings.invoice.nextNumber + 1 } },
    }
    return log(next, "invoice.issued", `${number} issued to ${issued.customerSnapshot.name}`, {
      invoiceId: id,
      customerId: issued.customerId,
    })
  })
}

export function voidInvoice(id: string) {
  commit((d) => {
    const invoice = d.invoices.find((i) => i.id === id)
    if (!invoice || invoice.status === "draft" || invoice.status === "void") return d
    const voided: Invoice = { ...invoice, status: "void", voidedAt: now(), updatedAt: now() }
    const next = { ...d, invoices: replace(d.invoices, voided), products: adjustStock(d, invoice, 1) }
    return log(next, "invoice.voided", `${invoice.number} was voided`, { invoiceId: id, customerId: invoice.customerId })
  })
}

export function deleteInvoices(ids: string[]) {
  commit((d) => {
    const deletable = new Set(d.invoices.filter((i) => ids.includes(i.id) && i.status === "draft").map((i) => i.id))
    return { ...d, invoices: d.invoices.filter((i) => !deletable.has(i.id)) }
  })
}

export function duplicateInvoice(id: string): string | null {
  const source = getDB().invoices.find((i) => i.id === id)
  if (!source) return null
  const today = todayISO()
  const dueOffset = Math.max(0, Math.round((Date.parse(source.dueDate) - Date.parse(source.issueDate)) / 86_400_000))
  const due = new Date()
  due.setDate(due.getDate() + dueOffset)
  const newId = saveDraft({
    customerId: source.customerId,
    issueDate: today,
    dueDate: due.toISOString().slice(0, 10),
    reference: source.reference,
    currency: source.currency,
    language: source.language,
    lines: source.lines.map((l) => ({ ...l, id: uid("ln_") })),
    discountType: source.discountType,
    discountValue: source.discountValue,
    pricesIncludeTax: source.pricesIncludeTax,
    notes: source.notes,
    terms: source.terms,
  })
  commit((d) => log(d, "invoice.duplicated", `Duplicated ${source.number ?? "draft"} into a new draft`, { invoiceId: newId }))
  return newId
}

// ---------- Payments ----------

export function recordPayment(input: Omit<Payment, "id" | "createdAt">) {
  commit((d) => {
    const invoice = d.invoices.find((i) => i.id === input.invoiceId)
    if (!invoice || invoice.status === "draft" || invoice.status === "void") return d
    const payment: Payment = { ...input, id: uid("pay_"), createdAt: now() }
    const amountPaid = roundMoney(invoice.amountPaid + payment.amount, invoice.currency)
    const updated = { ...invoice, amountPaid, updatedAt: now() }
    const next = {
      ...d,
      payments: [payment, ...d.payments],
      invoices: replace(d.invoices, { ...updated, status: statusFromPayments(updated) }),
    }
    return log(next, "payment.recorded", `Payment received for ${invoice.number}`, {
      invoiceId: invoice.id,
      customerId: invoice.customerId,
    })
  })
}

export function deletePayment(id: string) {
  commit((d) => {
    const payment = d.payments.find((p) => p.id === id)
    if (!payment) return d
    const invoice = d.invoices.find((i) => i.id === payment.invoiceId)
    const payments = d.payments.filter((p) => p.id !== id)
    if (!invoice) return { ...d, payments }
    const updated = { ...invoice, amountPaid: roundMoney(Math.max(0, invoice.amountPaid - payment.amount), invoice.currency) }
    const next = { ...d, payments, invoices: replace(d.invoices, { ...updated, status: statusFromPayments(updated) }) }
    return log(next, "payment.deleted", `Payment removed from ${invoice.number}`, { invoiceId: invoice.id })
  })
}
