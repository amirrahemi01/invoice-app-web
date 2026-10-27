"use client"

import { forwardRef, useLayoutEffect, useRef, useState } from "react"
import type React from "react"
import { calculateInvoice } from "@/lib/calc"
import { docDirection, docLabels, docLocale } from "@/lib/doc-i18n"
import { formatDate, formatMoney, formatNumber } from "@/lib/format"
import type { Address, CustomerSnapshot, Invoice, InvoiceStatus, Settings, TemplateSettings } from "@/lib/types"
import { cn } from "@/lib/utils"

export type DocumentInvoice = Pick<
  Invoice,
  | "number"
  | "issueDate"
  | "dueDate"
  | "reference"
  | "currency"
  | "language"
  | "lines"
  | "discountType"
  | "discountValue"
  | "pricesIncludeTax"
  | "notes"
  | "terms"
  | "amountPaid"
> & { status: InvoiceStatus; customerSnapshot: CustomerSnapshot }

function AddressLines({ address }: { address: Address }) {
  return (
    <>
      <div data-bidi="">{address.line1}</div>
      {address.line2 && <div data-bidi="">{address.line2}</div>}
      <div data-bidi="">{[address.city, address.region, address.postalCode].filter(Boolean).join(", ")}</div>
      <div data-bidi="">{address.country}</div>
    </>
  )
}

interface Props {
  invoice: DocumentInvoice
  settings: Settings
  /** Override template settings, e.g. for the template preview in Settings */
  template?: TemplateSettings
  className?: string
}

/** The invoice as the customer sees it. A4 sized, always light. */
export const InvoiceDocument = forwardRef<HTMLDivElement, Props>(function InvoiceDocument(
  { invoice, settings, template = settings.template, className },
  ref,
) {
  const t = docLabels(invoice.language)
  const dir = docDirection(invoice.language)
  const locale = docLocale(invoice.language, settings.locale.locale)
  const calendar = settings.locale.calendar
  const money = (n: number) => formatMoney(n, invoice.currency, locale)
  const date = (iso: string) => formatDate(iso, { locale, calendar, style: "long" })
  const totals = calculateInvoice(invoice)
  const balance = Math.max(0, totals.total - invoice.amountPaid)
  const accent = template.accent
  const business = settings.business
  const hasDiscount = invoice.lines.some((l) => l.discountValue > 0)
  const showTax = template.showTaxColumn && invoice.lines.some((l) => l.taxRate > 0)
  const modern = template.id === "modern"
  const minimal = template.id === "minimal"

  const stamp =
    invoice.status === "paid" ? { text: t.paid, color: "#059669" } : invoice.status === "void" ? { text: t.void, color: "#dc2626" } : invoice.status === "draft" ? { text: t.draft, color: "#94a3b8" } : null

  const meta: [string, React.ReactNode][] = [
    [t.number, invoice.number ?? "—"],
    [t.issueDate, date(invoice.issueDate)],
    [t.dueDate, date(invoice.dueDate)],
  ]
  if (invoice.reference) meta.push([t.reference, invoice.reference])

  return (
    <div
      ref={ref}
      dir={dir}
      lang={invoice.language}
      className={cn("invoice-paper print-sheet relative flex min-h-[297mm] w-[210mm] flex-col overflow-hidden text-[13px] leading-relaxed", className)}
      style={{ ["--accent" as string]: accent }}
    >
      {stamp && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-[38%] left-1/2 -translate-x-1/2 -rotate-12 rounded-xl border-[5px] px-8 py-2 text-6xl font-black tracking-widest uppercase opacity-[0.13]"
          style={{ color: stamp.color, borderColor: stamp.color }}
        >
          {stamp.text}
        </div>
      )}

      {/* Header */}
      <header
        className={cn("flex items-start justify-between gap-8 px-12 pt-12 pb-8", modern && "pb-10 text-white")}
        style={modern ? { background: accent } : undefined}
      >
        <div className="min-w-0">
          {template.showLogo && business.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo} alt={business.name} className="mb-3 max-h-16 max-w-[180px] object-contain" />
          ) : (
            <div
              className={cn("mb-3 flex size-12 items-center justify-center rounded-lg text-lg font-bold", modern ? "bg-white/15" : "text-white")}
              style={modern ? undefined : { background: accent }}
            >
              {business.name.slice(0, 1)}
            </div>
          )}
          <div className="text-base font-semibold" data-bidi="">{business.name}</div>
          <div className={cn("text-[12px]", modern ? "text-white/80" : "text-slate-500")}>
            <AddressLines address={business.address} />
            <div dir="ltr" className={dir === "rtl" ? "text-right" : undefined}>
              {[business.email, business.phone].filter(Boolean).join(" · ")}
            </div>
            {business.taxId && (
              <div>
                {t.taxId}: {business.taxId}
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 text-end">
          <div
            className={cn("text-3xl font-bold tracking-tight uppercase", minimal && "font-light tracking-[0.2em] text-slate-800")}
            style={!modern && !minimal ? { color: accent } : undefined}
          >
            {t.invoice}
          </div>
          <table className="ms-auto mt-3 text-[12px]">
            <tbody>
              {meta.map(([label, value]) => (
                <tr key={label}>
                  <td className={cn("pe-4 py-0.5", modern ? "text-white/75" : "text-slate-500")}>{label}</td>
                  <td className="py-0.5 font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </header>

      {/* Parties */}
      <section className={cn("flex items-stretch justify-between gap-8 px-12", modern ? "pt-8" : minimal ? "border-t border-slate-200 pt-8" : "pt-2")}>
        <div className="min-w-0">
          <div className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{t.billTo}</div>
          <div className="text-[15px] font-semibold" data-bidi="">{invoice.customerSnapshot.name || "—"}</div>
          <div className="text-[12px] text-slate-600">
            {invoice.customerSnapshot.phone && <div data-bidi="">{invoice.customerSnapshot.phone}</div>}
          </div>
        </div>
        <div
          className={cn("flex shrink-0 flex-col justify-center rounded-lg px-6 py-4 text-end", minimal ? "border border-slate-200" : "")}
          style={minimal ? undefined : { background: `color-mix(in oklab, ${accent} 8%, white)` }}
        >
          <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{t.balanceDue}</div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: minimal ? undefined : accent }}>
            {money(balance)}
          </div>
          <div className="text-[11px] text-slate-500">
            {t.dueDate}: {date(invoice.dueDate)}
          </div>
        </div>
      </section>

      {/* Lines */}
      <section className="px-12 pt-8">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr
              className={cn("text-[11px] tracking-wider uppercase", modern ? "text-white" : "text-slate-500", minimal ? "border-y border-slate-300" : "")}
              style={modern ? { background: accent } : !minimal ? { borderBottom: `2px solid ${accent}` } : undefined}
            >
              <th className="w-8 px-2 py-2.5 text-start font-semibold">#</th>
              <th className="px-2 py-2.5 text-start font-semibold">{t.item}</th>
              <th className="px-2 py-2.5 text-end font-semibold">{t.qty}</th>
              <th className="px-2 py-2.5 text-end font-semibold">{t.unitPrice}</th>
              {hasDiscount && <th className="px-2 py-2.5 text-end font-semibold">{t.discount}</th>}
              {showTax && <th className="px-2 py-2.5 text-end font-semibold">{t.tax}</th>}
              <th className="px-2 py-2.5 text-end font-semibold">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, i) => (
              <tr key={line.id} className="border-b border-slate-100 align-top">
                <td className="px-2 py-3 text-slate-400 tabular-nums">{formatNumber(i + 1, locale)}</td>
                <td className="px-2 py-3">
                  <div className="font-medium text-slate-900" data-bidi="">
                    {line.name || "—"}
                    {line.variant && <span className="font-normal text-slate-500"> — {line.variant}</span>}
                  </div>
                  {line.description && <div className="text-[11.5px] whitespace-pre-line text-slate-500" data-bidi="">{line.description}</div>}
                  {template.showSku && line.sku && (
                    <div className="font-mono text-[10.5px] text-slate-400">
                      {t.sku}: {line.sku}
                    </div>
                  )}
                </td>
                <td className="px-2 py-3 text-end whitespace-nowrap tabular-nums">
                  {formatNumber(line.quantity, locale)} <span className="text-slate-400">{line.unit}</span>
                </td>
                <td className="px-2 py-3 text-end tabular-nums">{money(line.unitPrice)}</td>
                {hasDiscount && (
                  <td className="px-2 py-3 text-end text-slate-500 tabular-nums">
                    {line.discountValue > 0
                      ? line.discountType === "percent"
                        ? `${formatNumber(line.discountValue, locale)}%`
                        : money(line.discountValue)
                      : "—"}
                  </td>
                )}
                {showTax && <td className="px-2 py-3 text-end text-slate-500 tabular-nums">{line.taxRate ? `${formatNumber(line.taxRate, locale)}%` : "—"}</td>}
                <td className="px-2 py-3 text-end font-medium tabular-nums">{money(totals.lines[i]?.net ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <table className="w-[280px] text-[12.5px]">
            <tbody>
              <tr>
                <td className="py-1 text-slate-500">{t.subtotal}</td>
                <td className="py-1 text-end tabular-nums">{money(totals.subtotal - totals.lineDiscountTotal)}</td>
              </tr>
              {totals.invoiceDiscountTotal > 0 && (
                <tr>
                  <td className="py-1 text-slate-500">
                    {t.discount}
                    {invoice.discountType === "percent" ? ` (${formatNumber(invoice.discountValue, locale)}%)` : ""}
                  </td>
                  <td className="py-1 text-end tabular-nums">−{money(totals.invoiceDiscountTotal)}</td>
                </tr>
              )}
              {totals.taxes.map((tax) => (
                <tr key={tax.name + tax.rate}>
                  <td className="py-1 text-slate-500">
                    {tax.name} {formatNumber(tax.rate, locale)}%{invoice.pricesIncludeTax ? ` (${t.taxIncluded})` : ""}
                  </td>
                  <td className="py-1 text-end tabular-nums">{money(tax.tax)}</td>
                </tr>
              ))}
              <tr className="border-t-2" style={{ borderColor: minimal ? "#cbd5e1" : accent }}>
                <td className="pt-2 pb-1 text-[14px] font-semibold">{t.total}</td>
                <td className="pt-2 pb-1 text-end text-[14px] font-semibold tabular-nums">{money(totals.total)}</td>
              </tr>
              {invoice.amountPaid > 0 && (
                <>
                  <tr>
                    <td className="py-1 text-slate-500">{t.amountPaid}</td>
                    <td className="py-1 text-end tabular-nums">−{money(invoice.amountPaid)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">{t.balanceDue}</td>
                    <td className="py-1 text-end font-semibold tabular-nums" style={{ color: minimal ? undefined : accent }}>
                      {money(balance)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Notes */}
      <section className="mt-auto grid grid-cols-2 gap-8 px-12 pt-10 pb-8 text-[11.5px] text-slate-600">
        <div className="space-y-4">
          {invoice.notes && (
            <div>
              <div className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{t.notes}</div>
              <p className="whitespace-pre-line" data-bidi="">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <div className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{t.terms}</div>
              <p className="whitespace-pre-line" data-bidi="">{invoice.terms}</p>
            </div>
          )}
        </div>
        {template.showPaymentInstructions && settings.invoice.paymentInstructions && (
          <div>
            <div className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{t.paymentInstructions}</div>
            <p className="whitespace-pre-line" data-bidi="">
              {settings.invoice.paymentInstructions}
            </p>
          </div>
        )}
      </section>

      {settings.invoice.footer && (
        <footer
          className={cn("px-12 py-4 text-center text-[11px]", modern ? "text-white/90" : "border-t border-slate-100 text-slate-400")}
          style={modern ? { background: accent } : undefined}
        >
          {settings.invoice.footer}
        </footer>
      )}
    </div>
  )
})

/** Scales the A4 document down to fit its container (for on-screen previews). */
export function ScaledPaper({ children, className }: { children: React.ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number>()

  useLayoutEffect(() => {
    const el = outer.current
    const content = inner.current
    if (!el || !content) return
    const update = () => {
      // Hidden (display: none) previews measure 0; skip until visible.
      if (!el.clientWidth || !content.offsetWidth) return
      const s = Math.min(1, el.clientWidth / content.offsetWidth)
      setScale(s)
      setHeight(content.offsetHeight * s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    ro.observe(content)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={outer} className={cn("w-full overflow-hidden", className)} style={{ height }}>
      <div ref={inner} className="w-fit origin-top-left overflow-hidden rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,.08),0_8px_30px_rgba(0,0,0,.08)] ring-1 ring-black/5 rtl:origin-top-right" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}
