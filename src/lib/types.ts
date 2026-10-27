// Domain types. These mirror the planned database schema so the mock store
// can later be swapped for server actions without touching the UI.

export type ID = string
/** Calendar date without time, formatted YYYY-MM-DD */
export type ISODate = string
/** Full timestamp, ISO 8601 */
export type ISODateTime = string

export type DiscountType = "percent" | "fixed"
export type DocLanguage = "en" | "fa" | "ar"
export type CalendarType = "gregorian" | "persian"
export type TemplateId = "classic" | "modern" | "minimal"

export interface Address {
  line1: string
  line2?: string
  city: string
  region?: string
  postalCode?: string
  country: string
}

export interface TaxRate {
  id: ID
  name: string
  /** Percentage, e.g. 9 for 9% */
  rate: number
  isDefault: boolean
}

/** A priced option of a product, e.g. خام (raw), رنگی (colored), چوبی (wood). */
export interface ProductVariant {
  label: string
  price: number
}

export interface Product {
  id: ID
  name: string
  /** Product code (کد محصول) */
  sku: string
  /** Specs, one per line, e.g. "ابعاد پایه: ۱۰*۱۰" */
  description?: string
  category: string
  unit: string
  /** Default price: the first variant's price */
  price: number
  cost?: number
  variants: ProductVariant[]
  /** Path under /public or a data URL */
  image?: string
  taxRateId: ID | null
  trackStock: boolean
  stock: number
  lowStockAt: number
  archived: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface Customer {
  id: ID
  name: string
  phone?: string
  archived: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

/** Customer details frozen onto an invoice when it is issued */
export interface CustomerSnapshot {
  name: string
  phone?: string
}

export interface InvoiceLine {
  id: ID
  productId: ID | null
  name: string
  description?: string
  sku?: string
  /** Chosen price option, e.g. "رنگی" */
  variant?: string
  unit: string
  quantity: number
  unitPrice: number
  discountType: DiscountType
  discountValue: number
  taxRateId: ID | null
  taxName: string
  taxRate: number
}

export interface LineTotals {
  gross: number
  lineDiscount: number
  net: number
  invoiceDiscount: number
  taxable: number
  tax: number
  total: number
}

export interface TaxBreakdown {
  name: string
  rate: number
  taxable: number
  tax: number
}

export interface InvoiceTotals {
  lines: LineTotals[]
  subtotal: number
  lineDiscountTotal: number
  invoiceDiscountTotal: number
  discountTotal: number
  taxTotal: number
  total: number
  taxes: TaxBreakdown[]
}

/** Stored status. "overdue" is derived from due date and balance. */
export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "void"
export type DisplayStatus = InvoiceStatus | "overdue"

export interface Invoice {
  id: ID
  number: string | null
  status: InvoiceStatus
  customerId: ID
  customerSnapshot: CustomerSnapshot
  issueDate: ISODate
  dueDate: ISODate
  reference?: string
  currency: string
  language: DocLanguage
  lines: InvoiceLine[]
  discountType: DiscountType
  discountValue: number
  pricesIncludeTax: boolean
  notes?: string
  terms?: string
  subtotal: number
  discountTotal: number
  taxTotal: number
  total: number
  amountPaid: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
  issuedAt?: ISODateTime
  voidedAt?: ISODateTime
}

export type PaymentMethod = "bank_transfer" | "card" | "cash" | "cheque" | "other"

export interface Payment {
  id: ID
  invoiceId: ID
  amount: number
  date: ISODate
  method: PaymentMethod
  reference?: string
  note?: string
  createdAt: ISODateTime
}

export type ActivityType =
  | "invoice.created"
  | "invoice.updated"
  | "invoice.issued"
  | "invoice.voided"
  | "invoice.deleted"
  | "invoice.duplicated"
  | "payment.recorded"
  | "payment.deleted"
  | "customer.created"
  | "product.created"

export interface Activity {
  id: ID
  type: ActivityType
  message: string
  invoiceId?: ID
  customerId?: ID
  createdAt: ISODateTime
}

export interface BusinessProfile {
  name: string
  legalName?: string
  email: string
  phone: string
  website?: string
  taxId?: string
  address: Address
  logo?: string
}

export interface InvoiceSettings {
  /** Pattern tokens: {YYYY}, {YY}, {MM}, {####} (number of # = zero padding) */
  numberFormat: string
  nextNumber: number
  dueDays: number
  notes: string
  terms: string
  pricesIncludeTax: boolean
  paymentInstructions: string
  footer: string
}

export interface TemplateSettings {
  id: TemplateId
  accent: string
  showLogo: boolean
  showSku: boolean
  showTaxColumn: boolean
  showPaymentInstructions: boolean
}

export interface LocaleSettings {
  currency: string
  /** BCP 47 locale used for app formatting */
  locale: string
  language: DocLanguage
  calendar: CalendarType
}

export interface Settings {
  business: BusinessProfile
  invoice: InvoiceSettings
  template: TemplateSettings
  locale: LocaleSettings
}

export interface Database {
  version: number
  settings: Settings
  taxRates: TaxRate[]
  products: Product[]
  customers: Customer[]
  invoices: Invoice[]
  payments: Payment[]
  activity: Activity[]
}
