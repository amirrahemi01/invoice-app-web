"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, Pencil, Save, Send, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TabBar } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FormSection } from "@/components/shared/field"
import { PageHeader } from "@/components/shared/page-header"
import { CustomerForm } from "@/components/customers/customer-form"
import { useData, useFormat } from "@/lib/hooks"
import { calculateInvoice } from "@/lib/calc"
import { addDays, CURRENCIES, daysBetween, todayISO } from "@/lib/format"
import { customerSnapshot, formatInvoiceNumber, lineFromProduct } from "@/lib/invoice-helpers"
import { LANGUAGE_NAMES } from "@/lib/doc-i18n"
import { issueInvoice, saveDraft, type InvoiceDraft } from "@/lib/store"
import type { DiscountType, DocLanguage, Invoice } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { InvoiceDocument, ScaledPaper } from "./invoice-document"
import { LineItemsEditor } from "./line-items-editor"

const DUE_PRESETS = [
  { label: "On receipt", days: 0 },
  { label: "{n} days", days: 7 },
  { label: "{n} days", days: 14 },
  { label: "{n} days", days: 30 },
  { label: "{n} days", days: 60 },
]

export function InvoiceEditor({
  invoice,
  initialCustomerId,
  initialProductId,
}: {
  invoice?: Invoice
  initialCustomerId?: string
  initialProductId?: string
}) {
  const db = useData()
  const fmt = useFormat()
  const { t } = useT()
  const router = useRouter()
  const { settings } = db

  const [draft, setDraft] = useState<InvoiceDraft>(() => {
    if (invoice) {
      const { id, customerId, issueDate, dueDate, reference, currency, language, lines, discountType, discountValue, pricesIncludeTax, notes, terms } = invoice
      return { id, customerId, issueDate, dueDate, reference, currency, language, lines, discountType, discountValue, pricesIncludeTax, notes, terms }
    }
    const today = todayISO()
    const customer = db.customers.find((c) => c.id === initialCustomerId && !c.archived)
    const product = db.products.find((p) => p.id === initialProductId)
    return {
      customerId: customer?.id ?? "",
      issueDate: today,
      dueDate: addDays(today, settings.invoice.dueDays),
      reference: "",
      currency: settings.locale.currency,
      language: "fa" as DocLanguage,
      lines: product ? [lineFromProduct(product, db.taxRates)] : [],
      discountType: "percent",
      discountValue: 0,
      pricesIncludeTax: settings.invoice.pricesIncludeTax,
      notes: settings.invoice.notes,
      terms: settings.invoice.terms,
    }
  })
  const [showErrors, setShowErrors] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit")
  const savingRef = useRef(false)

  const set = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setDirty(true)
  }

  const totals = useMemo(() => calculateInvoice(draft), [draft])
  const customer = db.customers.find((c) => c.id === draft.customerId)
  const dueOffset = daysBetween(draft.issueDate, draft.dueDate)

  const errors = {
    customer: !draft.customerId ? t("Choose a customer") : undefined,
    lines: draft.lines.length === 0 || draft.lines.some((l) => !l.name.trim() || !(l.quantity > 0)) ? t("Check your items") : undefined,
    dueDate: draft.dueDate < draft.issueDate ? t("Due date can't be before the issue date") : undefined,
  }
  const valid = !errors.customer && !errors.lines && !errors.dueDate

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (savingRef.current) return
      e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  // After a failed submit, bring the first problem into view and focus it.
  const focusFirstProblem = (needCustomer: boolean, needLines: boolean, needDue: boolean) => {
    setTimeout(() => {
      const target: HTMLElement | null = needCustomer
        ? document.getElementById("customer")
        : needDue
          ? document.getElementById("dueDate")
          : needLines
            ? (document.querySelector('[data-line-invalid="true"]') as HTMLElement | null) ?? document.getElementById("items-add")
            : null
      if (!target) return
      target.scrollIntoView({ behavior: "smooth", block: "center" })
      const focusable = target.matches("input,button,textarea,select") ? target : target.querySelector<HTMLElement>("input,button")
      focusable?.focus({ preventScroll: true })
    }, 120)
  }

  const save = (issue: boolean) => {
    if (issue && !valid) {
      setShowErrors(true)
      toast.error(t("Please fix the highlighted fields before issuing"))
      // The items tab on phones can hide the form; switch back to it first.
      setMobileTab("edit")
      focusFirstProblem(!!errors.customer, !!errors.lines, !!errors.dueDate)
      return
    }
    if (!draft.customerId) {
      setShowErrors(true)
      toast.error(t("Choose a customer to save this draft"))
      setMobileTab("edit")
      focusFirstProblem(true, false, false)
      return
    }
    savingRef.current = true
    const id = saveDraft({ ...draft, lines: draft.lines.filter((l) => l.name.trim() || l.unitPrice) })
    setDirty(false)
    if (issue) {
      issueInvoice(id)
      toast.success(t("Invoice issued"), { description: t("It's numbered, locked and ready to share.") })
      router.push(`/invoices/${id}`)
    } else {
      toast.success(t("Draft saved"))
      if (!invoice) router.replace(`/invoices/${id}/edit`)
      setDraft((d) => ({ ...d, id }))
    }
    savingRef.current = false
  }

  // ⌘S / Ctrl+S saves the draft.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        saveRef.current(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const previewInvoice = {
    ...draft,
    number: null,
    status: "draft" as const,
    amountPaid: 0,
    customerSnapshot: customer ? customerSnapshot(customer) : { name: "" },
  }
  const nextNumber = formatInvoiceNumber(settings.invoice.numberFormat, settings.invoice.nextNumber, draft.issueDate)

  const customerOptions = db.customers
    .filter((c) => !c.archived)
    .map((c) => ({ value: c.id, label: c.name, keywords: [c.phone ?? ""], description: c.phone }))

  const form = (
    <div className="space-y-5">
      <FormSection title={t("Customer")}>
        <Field label={t("Bill to")} htmlFor="customer" error={showErrors ? errors.customer : undefined} required>
          <Combobox
            id="customer"
            options={customerOptions}
            value={draft.customerId || null}
            onChange={(id) => {
              set("customerId", id)
            }}
            placeholder={t("Choose a customer…")}
            searchPlaceholder={t("Search customers…")}
            invalid={showErrors && !!errors.customer}
            footer={(search, close) => (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  close()
                  setNewCustomerName(search)
                  setNewCustomerOpen(true)
                }}
              >
                <UserPlus /> {search ? t("Create “{name}”", { name: search }) : t("New customer")}
              </Button>
            )}
          />
        </Field>
        {customer && (
          <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
            <p className="font-medium">{customer.name}</p>
            {customer.phone && (
              <p className="text-muted-foreground" dir="ltr" style={{ textAlign: "end" }}>
                {customer.phone}
              </p>
            )}
          </div>
        )}
      </FormSection>

      <FormSection title={t("Details")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Issue date")} htmlFor="issueDate" required>
            <DatePicker
              id="issueDate"
              value={draft.issueDate}
              onChange={(issueDate) => {
                setDraft((d) => ({ ...d, issueDate, dueDate: addDays(issueDate, Math.max(0, dueOffset)) }))
                setDirty(true)
              }}
            />
          </Field>
          <Field label={t("Due date")} htmlFor="dueDate" error={showErrors ? errors.dueDate : undefined} required>
            <DatePicker id="dueDate" value={draft.dueDate} min={draft.issueDate} onChange={(v) => set("dueDate", v)} invalid={showErrors && !!errors.dueDate} />
          </Field>
          <div className="flex flex-wrap gap-1.5 sm:col-span-2">
            {DUE_PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => set("dueDate", addDays(draft.issueDate, p.days))}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  dueOffset === p.days ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {p.days === 0 ? t(p.label) : t(p.label, { n: p.days })}
              </button>
            ))}
          </div>
          <Field label={t("Reference / PO number")} htmlFor="reference">
            <Input id="reference" value={draft.reference ?? ""} onChange={(e) => set("reference", e.target.value)} placeholder={t("Optional")} />
          </Field>
          <Field label={t("Invoice number")} htmlFor="number" hint={t("Assigned automatically when issued")}>
            <Input id="number" value={invoice?.number ?? nextNumber} disabled className="font-mono" />
          </Field>
          <Field label={t("Currency")} htmlFor="currency">
            <Select value={draft.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger id="currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection title={t("Items")}>
        <LineItemsEditor lines={draft.lines} onChange={(lines) => set("lines", lines)} totals={totals} currency={draft.currency} showErrors={showErrors} />
      </FormSection>

      <FormSection title={t("Discount & tax")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Invoice discount")} htmlFor="discount" hint={t("Applied before tax, spread across all items")}>
            <div className="flex gap-2">
              <Input
                id="discount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="tabular"
                value={draft.discountValue || ""}
                placeholder="0"
                onChange={(e) => set("discountValue", Math.max(0, Number(e.target.value) || 0))}
              />
              <Select value={draft.discountType} onValueChange={(v) => set("discountType", v as DiscountType)}>
                <SelectTrigger className="w-24" aria-label={t("Discount type")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">%</SelectItem>
                  <SelectItem value="fixed">{draft.currency}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Field>
          <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5 sm:self-end">
            <span>
              <span className="block text-sm font-medium">{t("Prices include tax")}</span>
              <span className="block text-xs text-muted-foreground">{t("Tax is extracted from item prices")}</span>
            </span>
            <Switch checked={draft.pricesIncludeTax} onCheckedChange={(v) => set("pricesIncludeTax", v)} />
          </label>
        </div>
      </FormSection>

      <FormSection title={t("Notes & terms")}>
        <Field label={t("Notes")} htmlFor="notes" hint={t("Visible to the customer")}>
          <Textarea id="notes" rows={3} value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
        <Field label={t("Terms")} htmlFor="terms">
          <Textarea id="terms" rows={3} value={draft.terms ?? ""} onChange={(e) => set("terms", e.target.value)} />
        </Field>
      </FormSection>
    </div>
  )

  const summary = (
    <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <h2 className="text-sm font-medium text-muted-foreground">{t("Summary")}</h2>
      <dl className="tabular mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("Subtotal")}</dt>
          <dd>{fmt.money(totals.subtotal, draft.currency)}</dd>
        </div>
        {totals.discountTotal > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("Discounts")}</dt>
            <dd>−{fmt.money(totals.discountTotal, draft.currency)}</dd>
          </div>
        )}
        {totals.taxes.map((tax) => (
          <div key={tax.name + tax.rate} className="flex justify-between">
            <dt className="text-muted-foreground">
              {tax.name} {tax.rate}%{draft.pricesIncludeTax ? ` ${t("(incl.)")}` : ""}
            </dt>
            <dd>{fmt.money(tax.tax, draft.currency)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t pt-3 text-base font-semibold">
          <dt>{t("Total")}</dt>
          <dd>{fmt.money(totals.total, draft.currency)}</dd>
        </div>
      </dl>
    </section>
  )

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader
        backHref={invoice ? `/invoices/${invoice.id}` : "/invoices"}
        title={invoice ? t("Edit draft") : t("New invoice")}
        description={dirty ? t("Unsaved changes · ⌘S to save") : invoice ? t("Drafts can be edited until they're issued.") : t("Fill in the details. The preview updates as you type.")}
        actions={
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="outline" onClick={() => save(false)}>
              <Save /> {t("Save draft")}
            </Button>
            <Button onClick={() => save(true)}>
              <Send /> {t("Save & issue")}
            </Button>
          </div>
        }
      />

      <TabBar
        className="xl:hidden"
        value={mobileTab}
        onChange={setMobileTab}
        items={[
          { value: "edit", label: (<span className="flex items-center gap-1.5"><Pencil className="size-3.5" /> {t("Edit")}</span>) },
          { value: "preview", label: (<span className="flex items-center gap-1.5"><Eye className="size-3.5" /> {t("Preview")}</span>) },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <div className={cn("space-y-5", mobileTab === "preview" && "hidden xl:block")}>
          {form}
          <div className="xl:hidden">{summary}</div>
        </div>
        <aside className={cn("space-y-4 xl:sticky xl:top-20 xl:self-start", mobileTab === "edit" && "hidden xl:block")}>
          <div className="hidden xl:block">{summary}</div>
          <div className="rounded-xl border bg-muted/40 p-3 sm:p-4">
            <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("Live preview")}</p>
            {/* Remount on tab switch so it measures as soon as it becomes visible. */}
            <ScaledPaper key={mobileTab}>
              <InvoiceDocument invoice={previewInvoice} settings={settings} />
            </ScaledPaper>
          </div>
        </aside>
      </div>

      {/* Mobile action bar */}
      <div className="no-print fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t bg-background/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur md:hidden">
        <div className="me-auto">
          <p className="text-xs text-muted-foreground">{t("Total")}</p>
          <p className="tabular font-semibold">{fmt.money(totals.total, draft.currency)}</p>
        </div>
        <Button variant="outline" onClick={() => save(false)}>
          <Save /> {t("Draft")}
        </Button>
        <Button onClick={() => save(true)}>
          <Send /> {t("Issue")}
        </Button>
      </div>

      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("New customer")}</DialogTitle>
            <DialogDescription>{t("They'll be selected on this invoice once saved.")}</DialogDescription>
          </DialogHeader>
          <CustomerForm
            variant="dialog"
            initialName={newCustomerName}
            onCancel={() => setNewCustomerOpen(false)}
            onSaved={(id) => {
              setNewCustomerOpen(false)
              set("customerId", id)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
