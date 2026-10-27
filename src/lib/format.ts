import type { CalendarType, ISODate } from "./types"

const decimalsCache = new Map<string, number>()

/** Number of minor-unit digits for a currency (USD 2, IRR 0, KWD 3). */
/** Toman is not an ISO currency (1 toman = 10 rials), so Intl does not know it. */
export const TOMAN = "IRT"

export function currencyDecimals(currency: string) {
  if (currency === TOMAN) return 0
  let digits = decimalsCache.get(currency)
  if (digits === undefined) {
    try {
      digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2
    } catch {
      digits = 2
    }
    decimalsCache.set(currency, digits)
  }
  return digits
}

export function formatMoney(amount: number, currency: string, locale = "en-US") {
  if (currency === TOMAN) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} ${locale.startsWith("fa") ? "تومان" : "Toman"}`
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

/** Compact money for chart axes and KPI subtitles, e.g. $12.4K */
export function formatMoneyCompact(amount: number, currency: string, locale = "en-US") {
  if (currency === TOMAN) {
    const n = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(amount)
    return `${n} ${locale.startsWith("fa") ? "تومان" : "Toman"}`
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  } catch {
    return formatMoney(amount, currency, locale)
  }
}

export function formatNumber(value: number, locale = "en-US", maxDigits = 3) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxDigits }).format(value)
}

export function formatPercent(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value) + "%"
}

/** Parse YYYY-MM-DD as a local date (no timezone shift). */
export function parseISODate(iso: ISODate) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function toISODate(date: Date): ISODate {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function addDays(iso: ISODate, days: number) {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function daysBetween(from: ISODate, to: ISODate) {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000)
}

export function formatDate(
  iso: ISODate | undefined | null,
  { locale = "en-US", calendar = "gregorian", style = "medium" }: { locale?: string; calendar?: CalendarType; style?: "short" | "medium" | "long" } = {},
) {
  if (!iso) return "—"
  const date = iso.length > 10 ? new Date(iso) : parseISODate(iso)
  const calLocale = `${locale.split("-u-")[0]}-u-ca-${calendar === "persian" ? "persian" : "gregory"}`
  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { year: "2-digit", month: "2-digit", day: "2-digit" }
      : style === "long"
        ? { year: "numeric", month: "long", day: "numeric" }
        : { year: "numeric", month: "short", day: "numeric" }
  try {
    return new Intl.DateTimeFormat(calLocale, options).format(date)
  } catch {
    return iso.slice(0, 10)
  }
}

export function formatRelative(isoDateTime: string, locale = "en", now = new Date()) {
  const diff = (new Date(isoDateTime).getTime() - now.getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  const abs = Math.abs(diff)
  if (abs < 60) return rtf.format(Math.round(diff), "second")
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour")
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day")
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), "month")
  return rtf.format(Math.round(diff / (86400 * 365)), "year")
}

export function monthKey(iso: ISODate) {
  return iso.slice(0, 7)
}

export function monthLabel(key: string, locale = "en-US") {
  const [y, m] = key.split("-").map(Number)
  return new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(new Date(y, m - 1, 1))
}

export const CURRENCIES = [
  { code: "IRT", name: "تومان" },
  { code: "IRR", name: "ریال" },
]

// ---------- Phone & sharing ----------

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"

/** Latin digits only, e.g. "۰۹۱۲ ۳۴۵" → "0912345" */
export function phoneDigits(phone: string | undefined) {
  return (phone ?? "")
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/\D/g, "")
}

export function smsLink(phone: string | undefined, body: string) {
  return `sms:${phoneDigits(phone)}?body=${encodeURIComponent(body)}`
}

/** wa.me wants an international number; Iranian 09… and 0… numbers become 98… */
export function whatsappLink(phone: string | undefined, body: string) {
  let digits = phoneDigits(phone)
  if (digits.startsWith("00")) digits = digits.slice(2)
  else if (digits.startsWith("0")) digits = "98" + digits.slice(1)
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`
}
