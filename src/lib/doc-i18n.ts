import type { DocLanguage } from "./types"

// Labels printed on the invoice document itself. The app UI stays English for
// now; the document is what customers see, so it supports EN / FA / AR + RTL.

const labels = {
  en: {
    invoice: "Invoice",
    draft: "Draft",
    number: "Invoice no.",
    issueDate: "Issue date",
    dueDate: "Due date",
    reference: "Reference",
    billTo: "Bill to",
    from: "From",
    taxId: "Tax ID",
    item: "Item",
    sku: "SKU",
    qty: "Qty",
    unitPrice: "Unit price",
    discount: "Discount",
    tax: "Tax",
    amount: "Amount",
    subtotal: "Subtotal",
    total: "Total",
    taxIncluded: "incl.",
    amountPaid: "Amount paid",
    balanceDue: "Balance due",
    notes: "Notes",
    terms: "Terms",
    paymentInstructions: "Payment details",
    paid: "Paid",
    void: "Void",
  },
  fa: {
    invoice: "فاکتور",
    draft: "پیش‌نویس",
    number: "شماره فاکتور",
    issueDate: "تاریخ صدور",
    dueDate: "سررسید",
    reference: "مرجع",
    billTo: "خریدار",
    from: "فروشنده",
    taxId: "شناسه مالیاتی",
    item: "شرح کالا / خدمات",
    sku: "کد کالا",
    qty: "تعداد",
    unitPrice: "قیمت واحد",
    discount: "تخفیف",
    tax: "مالیات",
    amount: "مبلغ",
    subtotal: "جمع",
    total: "مبلغ کل",
    taxIncluded: "شامل",
    amountPaid: "پرداخت‌شده",
    balanceDue: "مانده قابل پرداخت",
    notes: "توضیحات",
    terms: "شرایط",
    paymentInstructions: "اطلاعات پرداخت",
    paid: "پرداخت شد",
    void: "باطل",
  },
  ar: {
    invoice: "فاتورة",
    draft: "مسودة",
    number: "رقم الفاتورة",
    issueDate: "تاريخ الإصدار",
    dueDate: "تاريخ الاستحقاق",
    reference: "المرجع",
    billTo: "فاتورة إلى",
    from: "من",
    taxId: "الرقم الضريبي",
    item: "البند",
    sku: "الرمز",
    qty: "الكمية",
    unitPrice: "سعر الوحدة",
    discount: "الخصم",
    tax: "الضريبة",
    amount: "المبلغ",
    subtotal: "المجموع الفرعي",
    total: "الإجمالي",
    taxIncluded: "شامل",
    amountPaid: "المبلغ المدفوع",
    balanceDue: "الرصيد المستحق",
    notes: "ملاحظات",
    terms: "الشروط",
    paymentInstructions: "تفاصيل الدفع",
    paid: "مدفوعة",
    void: "ملغاة",
  },
} satisfies Record<DocLanguage, Record<string, string>>

export type DocLabels = (typeof labels)["en"]

export function docLabels(language: DocLanguage): DocLabels {
  return labels[language] ?? labels.en
}

export function docDirection(language: DocLanguage) {
  return language === "en" ? "ltr" : "rtl"
}

/** Locale used for numbers and dates on the document. */
export function docLocale(language: DocLanguage, appLocale: string) {
  if (language === "fa") return "fa-IR"
  if (language === "ar") return "ar-AE"
  return appLocale
}

export const LANGUAGE_NAMES: Record<DocLanguage, string> = {
  en: "English",
  fa: "فارسی (Persian)",
  ar: "العربية (Arabic)",
}
