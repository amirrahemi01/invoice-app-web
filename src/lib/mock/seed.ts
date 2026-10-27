// Builds a demo database: the catalog products (محصولات بتن دکوراتیو), 24
// customers and about a year of invoices and payments. A seeded PRNG keeps the data stable between resets;
// dates are relative to "today" so the dashboard always looks current.

import snapshot from "./snapshot.json"
import { roundMoney } from "../calc"
import { addDays, todayISO } from "../format"
import { customerSnapshot, formatInvoiceNumber, lineFromProduct, withTotals } from "../invoice-helpers"
import type { Activity, Customer, Database, Invoice, Payment, PaymentMethod, Product, Settings, TaxRate } from "../types"
import { customerRows } from "./customers"
import { catalog } from "./catalog"

export const DB_VERSION = 3

export const defaultSettings: Settings = {
  business: {
    name: "بتن دکوراتیو",
    legalName: "تولیدی بتن دکوراتیو",
    email: "info@decorative-beton.ir",
    phone: "۰۲۱ ۸۸۸۸ ۱۲۳۴",
    website: "decorative-beton.ir",
    taxId: "۱۴۰۰۱۲۳۴۵۶۷",
    address: { line1: "خیابان ولیعصر، پلاک ۱۲۰", city: "تهران", region: "تهران", postalCode: "۱۵۸۷۶۴۳۲۱۰", country: "ایران" },
  },
  invoice: {
    numberFormat: "INV-{YYYY}-{####}",
    nextNumber: 1,
    dueDays: 7,
    notes: "از اعتماد شما سپاسگزاریم.",
    terms:
      "زمان تحویل سفارش ۵ تا ۱۰ روز کاری از زمان ثبت سفارش است. ارسال با تیپاکس، چاپار یا باربری و به‌صورت پس‌کرایه انجام می‌شود و فقط با تسویه کامل فاکتور امکان‌پذیر است. هزینه بسته‌بندی و ارسال بر عهدهٔ خریدار است.",
    pricesIncludeTax: false,
    paymentInstructions: "شمارهٔ کارت: ۶۰۳۷ ۹۹۷۳ ۱۲۳۴ ۵۶۷۸\nبه نام: تولیدی بتن دکوراتیو\nبانک ملی ایران",
    footer: "بتن دکوراتیو · طراحی و تولید انواع دست‌سازه‌های دکوراتیو بتنی و چوبی",
  },
  template: {
    id: "classic",
    accent: "#4f46e5",
    showLogo: true,
    showSku: true,
    showTaxColumn: false,
    showPaymentInstructions: true,
  },
  locale: { currency: "IRT", locale: "fa-IR", language: "fa", calendar: "persian" },
}

export const defaultTaxRates: TaxRate[] = [
  { id: "tax_std", name: "مالیات بر ارزش افزوده", rate: 10, isDefault: false },
]

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n: number, size = 3) => String(n).padStart(size, "0")

function quantityFor(price: number, rand: () => number) {
  const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
  if (price >= 1_000_000) return between(1, 2)
  if (price >= 400_000) return between(1, 6)
  return between(2, 12)
}

function createGeneratedSeed(today = todayISO()): Database {
  const rand = mulberry32(20251226)
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const startStamp = `${addDays(today, -400)}T09:00:00.000Z`

  const products: Product[] = catalog.map((row, i) => ({
    id: `prd_${pad(i + 1)}`,
    name: row.name,
    sku: row.code,
    description: row.description || undefined,
    category: row.category,
    unit: "عدد",
    price: row.variants[0]?.price ?? 0,
    variants: row.variants,
    image: row.image,
    taxRateId: null,
    trackStock: false,
    stock: 0,
    lowStockAt: 0,
    archived: false,
    createdAt: startStamp,
    updatedAt: startStamp,
  }))

  const customers: Customer[] = customerRows.map((row, i) => ({
    id: `cus_${pad(i + 1)}`,
    name: row.name,
    phone: row.phone,
    archived: false,
    createdAt: startStamp,
    updatedAt: startStamp,
  }))

  const settings: Settings = structuredClone(defaultSettings)
  const invoices: Invoice[] = []
  const payments: Payment[] = []
  const activity: Activity[] = []
  const methods: PaymentMethod[] = ["bank_transfer", "bank_transfer", "card", "card", "cash", "cheque"]

  // Weighted customers: the first ones are regulars.
  const weightedCustomers = customers.flatMap((c, i) => Array(i < 8 ? 4 : i < 16 ? 2 : 1).fill(c) as Customer[])
  // 5–8 invoices per month for the past year, plus three fresh drafts.
  const ages: number[] = []
  for (let month = 11; month >= 0; month--) {
    const count = 5 + Math.floor(rand() * 4)
    for (let k = 0; k < count; k++) ages.push(month * 30 + 3 + Math.floor(rand() * 27))
  }
  ages.sort((a, b) => b - a)
  ages.push(2, 1, 0)

  let counter = 1
  ages.forEach((age, index) => {
    const customer = pick(weightedCustomers)
    const issueDate = addDays(today, -age)
    const dueDays = rand() < 0.7 ? 7 : 14
    const lineCount = 1 + Math.floor(rand() * 4)
    const chosen = new Set<Product>()
    while (chosen.size < lineCount) chosen.add(pick(products))

    const lines = [...chosen].map((product) => {
      const line = lineFromProduct(product, defaultTaxRates)
      line.id = `ln_${pad(index + 1)}_${product.id}`
      const variant = product.variants[Math.floor(rand() * product.variants.length)] ?? product.variants[0]
      line.variant = variant?.label
      line.unitPrice = variant?.price ?? product.price
      line.quantity = quantityFor(line.unitPrice, rand)
      if (rand() < 0.15) line.discountValue = 10
      return line
    })

    const isLast = index >= ages.length - 3
    let status: Invoice["status"]
    const r = rand()
    if (isLast) status = "draft"
    else if (age > 60) status = r < 0.85 ? "paid" : r < 0.92 ? "partial" : r < 0.97 ? "sent" : "void"
    else if (age > 30) status = r < 0.6 ? "paid" : r < 0.75 ? "partial" : "sent"
    else status = r < 0.3 ? "paid" : r < 0.4 ? "partial" : r < 0.9 ? "sent" : "draft"

    const number = status === "draft" ? null : formatInvoiceNumber(settings.invoice.numberFormat, counter++, issueDate)
    const stamp = `${issueDate}T10:${pad(index % 60, 2)}:00.000Z`

    let invoice: Invoice = withTotals({
      id: `inv_${pad(index + 1)}`,
      number,
      status: status === "paid" || status === "partial" ? "sent" : status,
      customerId: customer.id,
      customerSnapshot: customerSnapshot(customer),
      issueDate,
      dueDate: addDays(issueDate, dueDays),
      reference: rand() < 0.3 ? `سفارش ${1000 + Math.floor(rand() * 9000)}` : undefined,
      currency: settings.locale.currency,
      language: "fa",
      lines,
      discountType: "percent",
      discountValue: rand() < 0.1 ? 5 : 0,
      pricesIncludeTax: false,
      notes: settings.invoice.notes,
      terms: settings.invoice.terms,
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      total: 0,
      amountPaid: 0,
      createdAt: stamp,
      updatedAt: stamp,
      issuedAt: status === "draft" ? undefined : stamp,
      voidedAt: status === "void" ? stamp : undefined,
    })

    if (status === "paid" || status === "partial") {
      const amount = status === "paid" ? invoice.total : roundMoney(invoice.total * (0.3 + rand() * 0.4), invoice.currency)
      const parts = status === "paid" && rand() < 0.25 ? 2 : 1
      let remaining = amount
      for (let p = 0; p < parts; p++) {
        const partAmount = p === parts - 1 ? remaining : roundMoney(amount / 2, invoice.currency)
        remaining = roundMoney(remaining - partAmount, invoice.currency)
        const payDate = [addDays(issueDate, 2 + Math.floor(rand() * (dueDays + 8))), today].sort()[0]
        const payment: Payment = {
          id: `pay_${pad(payments.length + 1)}`,
          invoiceId: invoice.id,
          amount: partAmount,
          date: payDate,
          method: pick(methods),
          reference: rand() < 0.6 ? `TRX-${100000 + Math.floor(rand() * 900000)}` : undefined,
          createdAt: `${payDate}T12:00:00.000Z`,
        }
        payments.push(payment)
        activity.push({
          id: `act_${payment.id}`,
          type: "payment.recorded",
          message: `Payment received for ${invoice.number}`,
          invoiceId: invoice.id,
          customerId: customer.id,
          createdAt: payment.createdAt,
        })
      }
      invoice = withTotals({ ...invoice, amountPaid: amount })
    }

    invoices.push(invoice)
    activity.push({
      id: `act_${invoice.id}`,
      type: status === "draft" ? "invoice.created" : status === "void" ? "invoice.voided" : "invoice.issued",
      message:
        status === "draft"
          ? `Draft invoice created for ${customer.name}`
          : status === "void"
            ? `${invoice.number} was voided`
            : `${invoice.number} issued to ${customer.name}`,
      invoiceId: invoice.id,
      customerId: customer.id,
      createdAt: stamp,
    })
  })

  settings.invoice.nextNumber = counter
  activity.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    version: DB_VERSION,
    settings,
    taxRates: structuredClone(defaultTaxRates),
    products,
    customers,
    invoices,
    payments,
    activity: activity.slice(0, 200),
  }
}

// The shipped demo data: a snapshot of the real app state (logo lives in public/).
export function createSeedDatabase(): Database {
  return structuredClone(snapshot) as Database
}
