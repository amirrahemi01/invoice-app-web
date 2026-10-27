"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Building2,
  Check,
  Crop,
  Database as DatabaseIcon,
  Download,
  FileText,
  Globe,
  ImageUp,
  Palette,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TabBar } from "@/components/ui/tabs"
import { Field, FormSection } from "@/components/shared/field"
import { PageHeader } from "@/components/shared/page-header"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { InvoiceDocument, ScaledPaper } from "@/components/invoices/invoice-document"
import { LogoEditor, readFileAsDataURL } from "./logo-editor"
import { useT } from "@/lib/i18n"
import { useData } from "@/lib/hooks"
import { clearAllData, deleteTaxRate, resetDemoData, saveTaxRate, updateSettings } from "@/lib/store"
import { CURRENCIES, todayISO, addDays, formatDate, formatMoney } from "@/lib/format"
import { formatInvoiceNumber } from "@/lib/invoice-helpers"
import { LANGUAGE_NAMES } from "@/lib/doc-i18n"
import { downloadBlob } from "@/lib/export"
import type { BusinessProfile, CalendarType, Database, DocLanguage, InvoiceSettings, LocaleSettings, TaxRate, TemplateId, TemplateSettings } from "@/lib/types"
import { cn, uid } from "@/lib/utils"

type Section = "business" | "invoice" | "taxes" | "template" | "locale" | "data"

const SECTIONS: { value: Section; label: string; icon: typeof Building2 }[] = [
  { value: "business", label: "Business", icon: Building2 },
  { value: "invoice", label: "Invoices", icon: FileText },
  { value: "taxes", label: "Taxes", icon: Percent },
  { value: "template", label: "Template", icon: Palette },
  { value: "locale", label: "Language & region", icon: Globe },
  { value: "data", label: "Data", icon: DatabaseIcon },
]

function SaveBar({ dirty, onSave, onReset }: { dirty: boolean; onSave: () => void; onReset: () => void }) {
  const { t } = useT()
  return (
    <div className={cn("sticky bottom-20 z-10 flex items-center justify-end gap-2 md:bottom-4", !dirty && "pointer-events-none opacity-0")} aria-hidden={!dirty}>
      <div className="flex items-center gap-2 rounded-xl border bg-card/95 p-2 shadow-lg backdrop-blur">
        <span className="px-2 text-sm text-muted-foreground">{t("Unsaved changes")}</span>
        <Button variant="ghost" size="sm" onClick={onReset}>
          {t("Discard")}
        </Button>
        <Button size="sm" onClick={onSave}>
          <Check /> {t("Save")}
        </Button>
      </div>
    </div>
  )
}

/** Generic "edit a copy, then save" state for one settings section. */
function useSectionState<T>(source: T) {
  const [value, setValue] = useState<T>(source)
  const [base, setBase] = useState(source)
  if (base !== source) {
    setBase(source)
    setValue(source)
  }
  const dirty = JSON.stringify(value) !== JSON.stringify(source)
  return { value, setValue, dirty, reset: () => setValue(source) }
}

// ---------- Business ----------

function BusinessSection({ db }: { db: Database }) {
  const { t } = useT()
  const { value, setValue, dirty, reset } = useSectionState<BusinessProfile>(db.settings.business)
  const fileRef = useRef<HTMLInputElement>(null)
  // Original upload, kept so "Edit" can re-crop without losing what was cropped away.
  const [original, setOriginal] = useState<string | null>(null)
  const [editorSrc, setEditorSrc] = useState<string | null>(null)
  const set = <K extends keyof BusinessProfile>(k: K, v: BusinessProfile[K]) => setValue((b) => ({ ...b, [k]: v }))
  const setAddr = (k: keyof BusinessProfile["address"], v: string) => setValue((b) => ({ ...b, address: { ...b.address, [k]: v } }))
  const invalid = !value.name.trim() || !value.address.line1.trim() || !value.address.city.trim() || !value.address.country.trim()

  return (
    <div className="space-y-5">
      <FormSection title={t("Logo")} description={t("A square (1:1) image shown on invoices and in the sidebar. PNG, JPG, WebP or SVG.")}>
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex size-20 items-center justify-center overflow-hidden rounded-xl border"
            style={{ background: "repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 12px 12px" }}
          >
            {value.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.logo} alt="Logo" className="size-full object-contain" />
            ) : (
              <ImageUp className="size-6 text-slate-400" />
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload /> {value.logo ? t("Replace") : t("Upload logo")}
            </Button>
            {value.logo && (
              <>
                <Button variant="outline" onClick={() => setEditorSrc(original ?? value.logo ?? null)}>
                  <Crop /> {t("Edit")}
                </Button>
                <Button variant="ghost" onClick={() => set("logo", undefined)}>
                  {t("Remove")}
                </Button>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ""
              if (!file) return
              if (!file.type.startsWith("image/")) return toast.error(t("Please choose an image file"))
              if (file.size > 5_000_000) return toast.error(t("Please choose an image under 5 MB"))
              try {
                const dataUrl = await readFileAsDataURL(file)
                setOriginal(dataUrl)
                setEditorSrc(dataUrl)
              } catch {
                toast.error(t("Couldn't read that image"))
              }
            }}
          />
        </div>
        <LogoEditor
          src={editorSrc}
          open={editorSrc !== null}
          onOpenChange={(open) => !open && setEditorSrc(null)}
          onSave={(logo) => {
            set("logo", logo)
            setEditorSrc(null)
            toast.success(t("Logo ready. Save your changes to apply it."))
          }}
        />
      </FormSection>

      <FormSection title={t("Business details")} description={t("Printed in the “From” section of every invoice.")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Business name")} htmlFor="b-name" required error={!value.name.trim() ? t("Required") : undefined}>
            <Input id="b-name" value={value.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label={t("Legal name")} htmlFor="b-legal">
            <Input id="b-legal" value={value.legalName ?? ""} onChange={(e) => set("legalName", e.target.value)} />
          </Field>
          <Field label={t("Email")} htmlFor="b-email">
            <Input id="b-email" type="email" value={value.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label={t("Phone")} htmlFor="b-phone">
            <Input id="b-phone" type="tel" value={value.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label={t("Website")} htmlFor="b-web">
            <Input id="b-web" value={value.website ?? ""} onChange={(e) => set("website", e.target.value)} />
          </Field>
          <Field label={t("Tax ID / VAT number")} htmlFor="b-tax">
            <Input id="b-tax" value={value.taxId ?? ""} onChange={(e) => set("taxId", e.target.value)} />
          </Field>
          <Field label={t("Street address")} htmlFor="b-line1" required className="sm:col-span-2">
            <Input id="b-line1" value={value.address.line1} onChange={(e) => setAddr("line1", e.target.value)} />
          </Field>
          <Field label={t("City")} htmlFor="b-city" required>
            <Input id="b-city" value={value.address.city} onChange={(e) => setAddr("city", e.target.value)} />
          </Field>
          <Field label={t("State / region")} htmlFor="b-region">
            <Input id="b-region" value={value.address.region ?? ""} onChange={(e) => setAddr("region", e.target.value)} />
          </Field>
          <Field label={t("Postal code")} htmlFor="b-postal">
            <Input id="b-postal" value={value.address.postalCode ?? ""} onChange={(e) => setAddr("postalCode", e.target.value)} />
          </Field>
          <Field label={t("Country")} htmlFor="b-country" required>
            <Input id="b-country" value={value.address.country} onChange={(e) => setAddr("country", e.target.value)} />
          </Field>
        </div>
      </FormSection>
      <SaveBar
        dirty={dirty}
        onReset={reset}
        onSave={() => {
          if (invalid) return toast.error(t("Business name and full address are required"))
          updateSettings({ business: value })
          toast.success(t("Business details saved"))
        }}
      />
    </div>
  )
}

// ---------- Invoice defaults ----------

function InvoiceSection({ db }: { db: Database }) {
  const { t } = useT()
  const { value, setValue, dirty, reset } = useSectionState<InvoiceSettings>(db.settings.invoice)
  const set = <K extends keyof InvoiceSettings>(k: K, v: InvoiceSettings[K]) => setValue((s) => ({ ...s, [k]: v }))
  const example = formatInvoiceNumber(value.numberFormat || "{####}", value.nextNumber || 1)
  const usedNumbers = new Set(db.invoices.map((i) => i.number).filter(Boolean))
  const clash = usedNumbers.has(example)

  return (
    <div className="space-y-5">
      <FormSection title={t("Numbering")} description={t("Numbers are assigned when an invoice is issued, so there are never gaps from deleted drafts.")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Number format")} htmlFor="i-format" hint={t("Tokens: {YYYY} year, {YY}, {MM} month, {####} counter (number of # = digits)")}>
            <Input id="i-format" className="font-mono" value={value.numberFormat} onChange={(e) => set("numberFormat", e.target.value)} />
          </Field>
          <Field label={t("Next number")} htmlFor="i-next" error={clash ? t("{example} already exists", { example }) : undefined}>
            <Input id="i-next" type="number" min={1} value={value.nextNumber} onChange={(e) => set("nextNumber", Math.max(1, Number(e.target.value) || 1))} />
          </Field>
        </div>
        <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
          {t("Next invoice will be")} <span className="font-mono font-semibold" dir="ltr">{example}</span>
        </div>
      </FormSection>

      <FormSection title={t("Defaults for new invoices")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Payment due after (days)")} htmlFor="i-due">
            <Input id="i-due" type="number" min={0} value={value.dueDays} onChange={(e) => set("dueDays", Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5 sm:self-end">
            <span className="text-sm font-medium">{t("Prices include tax")}</span>
            <Switch checked={value.pricesIncludeTax} onCheckedChange={(v) => set("pricesIncludeTax", v)} />
          </label>
          <Field label={t("Default notes")} htmlFor="i-notes" className="sm:col-span-2">
            <Textarea id="i-notes" rows={2} value={value.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
          <Field label={t("Default terms")} htmlFor="i-terms" className="sm:col-span-2">
            <Textarea id="i-terms" rows={3} value={value.terms} onChange={(e) => set("terms", e.target.value)} />
          </Field>
          <Field label={t("Payment instructions")} htmlFor="i-pay" hint={t("Bank details or how to pay. Shown on every invoice.")} className="sm:col-span-2">
            <Textarea id="i-pay" rows={4} value={value.paymentInstructions} onChange={(e) => set("paymentInstructions", e.target.value)} />
          </Field>
          <Field label={t("Footer")} htmlFor="i-footer" className="sm:col-span-2">
            <Input id="i-footer" value={value.footer} onChange={(e) => set("footer", e.target.value)} />
          </Field>
        </div>
      </FormSection>
      <SaveBar
        dirty={dirty}
        onReset={reset}
        onSave={() => {
          if (!/\{#+\}/.test(value.numberFormat)) return toast.error(t("The number format needs a counter, e.g. {####}"))
          if (clash) return toast.error(t("{example} is already used. Choose a higher next number.", { example }))
          updateSettings({ invoice: value })
          toast.success(t("Invoice settings saved"))
        }}
      />
    </div>
  )
}

// ---------- Taxes ----------

function TaxesSection({ db }: { db: Database }) {
  const { t } = useT()
  const [editing, setEditing] = useState<TaxRate | null>(null)
  const [deleting, setDeleting] = useState<TaxRate | null>(null)
  const usage = (id: string) => db.products.filter((p) => p.taxRateId === id).length

  return (
    <FormSection title={t("Tax rates")} description={t("Assign a rate to each product. Invoices keep the rate they were issued with, even if you change it later.")}>
      <ul className="divide-y rounded-lg border">
        {db.taxRates.map((tax) => (
          <li key={tax.id} className="flex items-center gap-3 px-3 py-3">
            <span className="tabular flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold">{tax.rate}%</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {t(tax.name)}
                {tax.isDefault && <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{t("Default")}</span>}
              </p>
              <p className="text-xs text-muted-foreground">{t("{n} products", { n: usage(tax.id) })}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(tax)} aria-label={`${t("Edit")} ${tax.name}`}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleting(tax)} aria-label={`${t("Delete")} ${tax.name}`}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="outline" className="justify-self-start" onClick={() => setEditing({ id: uid("tax_"), name: "", rate: 0, isDefault: false })}>
        <Plus /> {t("Add tax rate")}
      </Button>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">{editing && <TaxForm tax={editing} onDone={() => setEditing(null)} />}</DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("Delete {name}?", { name: deleting?.name ?? "" })}
        description={deleting && usage(deleting.id) ? t("{n} products use this rate and will be set to “No tax”. Existing invoices are not affected.", { n: usage(deleting.id) }) : t("Existing invoices are not affected.")}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deleting) return
          deleteTaxRate(deleting.id)
          toast.success(t("Tax rate deleted"))
        }}
      />
    </FormSection>
  )
}

function TaxForm({ tax, onDone }: { tax: TaxRate; onDone: () => void }) {
  const { t } = useT()
  const [name, setName] = useState(tax.name)
  const [rate, setRate] = useState(String(tax.rate))
  const [isDefault, setIsDefault] = useState(tax.isDefault)
  const rateNum = Number(rate)
  const error = !name.trim() ? t("Name is required") : !Number.isFinite(rateNum) || rateNum < 0 || rateNum > 100 ? t("Rate must be between 0 and 100") : undefined
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (error) return toast.error(error)
        saveTaxRate({ id: tax.id, name: name.trim(), rate: rateNum, isDefault })
        toast.success(t("Tax rate saved"))
        onDone()
      }}
    >
      <DialogHeader>
        <DialogTitle>{tax.name ? t("Edit tax rate") : t("New tax rate")}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Name")} htmlFor="t-name" required>
          <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("e.g. VAT")} autoFocus />
        </Field>
        <Field label={t("Rate (%)")} htmlFor="t-rate" required>
          <Input id="t-rate" type="number" inputMode="decimal" step="any" min={0} max={100} value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center justify-between rounded-lg border px-3 py-2.5">
        <span className="text-sm font-medium">{t("Default for new products")}</span>
        <Switch checked={isDefault} onCheckedChange={setIsDefault} />
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t("Cancel")}
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}

// ---------- Template ----------

const ACCENTS = ["#4f46e5", "#0f766e", "#0369a1", "#b91c1c", "#c2410c", "#7c3aed", "#be185d", "#1f2937"]
const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "classic", name: "Classic", description: "Accent title and table rules" },
  { id: "modern", name: "Modern", description: "Bold colored header band" },
  { id: "minimal", name: "Minimal", description: "Quiet, typographic, no color blocks" },
]

function TemplateSection({ db }: { db: Database }) {
  const { t } = useT()
  const { value, setValue, dirty, reset } = useSectionState<TemplateSettings>(db.settings.template)
  
  const set = <K extends keyof TemplateSettings>(k: K, v: TemplateSettings[K]) => setValue((prev) => ({ ...prev, [k]: v }))

  const sample = useMemo(() => {
    const source = [...db.invoices].filter((i) => i.status === "partial" || i.status === "sent").sort((a, b) => b.issueDate.localeCompare(a.issueDate))[0] ?? db.invoices[0]
    if (source) return { ...source, language: "fa" as const }
    const today = todayISO()
    return {
      number: "INV-0001",
      status: "sent" as const,
      issueDate: today,
      dueDate: addDays(today, 14),
      currency: db.settings.locale.currency,
      language: "fa" as const,
      lines: [],
      discountType: "percent" as const,
      discountValue: 0,
      pricesIncludeTax: false,
      amountPaid: 0,
      customerSnapshot: { name: "Sample customer", address: { line1: "1 Example St", city: "Springfield", country: "United States" } },
    }
  }, [db.invoices, db.settings.locale.currency])

  const toggles: { key: "showLogo" | "showSku" | "showTaxColumn" | "showPaymentInstructions"; label: string }[] = [
    { key: "showLogo", label: "Show logo" },
    { key: "showSku", label: "Show SKU under item names" },
    { key: "showTaxColumn", label: "Show tax column" },
    { key: "showPaymentInstructions", label: "Show payment instructions" },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-5">
        <FormSection title={t("Layout")}>
          <div className="grid gap-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => set("id", tpl.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-start transition-colors",
                  value.id === tpl.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
                )}
              >
                <span
                  className={cn("flex h-12 w-10 shrink-0 flex-col overflow-hidden rounded border bg-white")}
                  aria-hidden
                >
                  <span className="h-3" style={{ background: tpl.id === "modern" ? value.accent : "transparent" }} />
                  <span className="mx-1 mt-1 h-0.5" style={{ background: tpl.id === "minimal" ? "#cbd5e1" : value.accent }} />
                  <span className="mx-1 mt-1 h-0.5 bg-slate-200" />
                  <span className="mx-1 mt-0.5 h-0.5 bg-slate-200" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{t(tpl.name)}</span>
                  <span className="block text-xs text-muted-foreground">{t(tpl.description)}</span>
                </span>
                {value.id === tpl.id && <Check className="size-4 text-primary" />}
              </button>
            ))}
          </div>
        </FormSection>
        <FormSection title={t("Brand color")}>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("accent", c)}
                className={cn("size-8 rounded-full ring-offset-2 ring-offset-card transition", value.accent === c && "ring-2 ring-foreground")}
                style={{ background: c }}
                aria-label={`${t("Use color")} ${c}`}
              />
            ))}
            <label className="relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed" title={t("Custom color")}>
              <Plus className="size-4 text-muted-foreground" />
              <input type="color" value={value.accent} onChange={(e) => set("accent", e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={t("Custom color")} />
            </label>
          </div>
        </FormSection>
        <FormSection title={t("Show on invoice")}>
          {toggles.map((tg) => (
            <label key={tg.key} className="flex items-center justify-between gap-4">
              <span className="text-sm">{t(tg.label)}</span>
              <Switch checked={value[tg.key]} onCheckedChange={(v) => set(tg.key, v)} />
            </label>
          ))}
        </FormSection>
      </div>
      <div className="min-w-0 rounded-xl border bg-muted/40 p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("Preview")}</p>

        </div>
        <ScaledPaper>
          <InvoiceDocument invoice={sample} settings={db.settings} template={value} />
        </ScaledPaper>
      </div>
      <div className="xl:col-span-2">
        <SaveBar
          dirty={dirty}
          onReset={reset}
          onSave={() => {
            updateSettings({ template: value })
            toast.success(t("Template saved"))
          }}
        />
      </div>
    </div>
  )
}

// ---------- Localization ----------

const LOCALES = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "tr-TR", label: "Türkçe (Türkiye)" },
  { value: "fa-IR", label: "فارسی (ایران)" },
  { value: "ar-AE", label: "العربية (الإمارات)" },
]

function LocaleSection({ db }: { db: Database }) {
  const { t } = useT()
  const { value, setValue, dirty, reset } = useSectionState<LocaleSettings>(db.settings.locale)
  const set = <K extends keyof LocaleSettings>(k: K, v: LocaleSettings[K]) => setValue((s) => ({ ...s, [k]: v }))
  const today = todayISO()
  return (
    <div className="space-y-5">
      <FormSection title={t("Formatting")} description={t("How amounts and dates appear across the app.")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Default currency")} htmlFor="l-cur" hint={t("New invoices use this. Each invoice can override it.")}>
            <Select value={value.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger id="l-cur" className="w-full">
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
          <Field label={t("Calendar")} htmlFor="l-cal" hint={t("Persian invoices always use the Solar Hijri calendar.")}>
            <Select value={value.calendar} onValueChange={(v) => set("calendar", v as CalendarType)}>
              <SelectTrigger id="l-cal" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gregorian">{t("Gregorian")}</SelectItem>
                <SelectItem value="persian">{t("Solar Hijri (Jalali)")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          </div>
        <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
          {t("Example:")} <span className="tabular font-medium">{formatMoney(12345.67, value.currency, value.locale)}</span> · <span className="font-medium">{formatDate(today, { locale: value.locale, calendar: value.calendar, style: "long" })}</span>
        </div>
      </FormSection>
      <SaveBar
        dirty={dirty}
        onReset={reset}
        onSave={() => {
          updateSettings({ locale: value })
          toast.success(t("Language & region saved"))
        }}
      />
    </div>
  )
}

// ---------- Data ----------

function DataSection({ db }: { db: Database }) {
  const { t } = useT()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirm, setConfirm] = useState<"reset" | "clear" | null>(null)
  return (
    <div className="space-y-5">
      <FormSection title={t("Demo data")} description={t("Everything is saved in this browser only until the backend is connected.")}>
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          {[
            ["Products", db.products.length],
            ["Customers", db.customers.length],
            ["Invoices", db.invoices.length],
            ["Payments", db.payments.length],
          ].map(([label, n]) => (
            <div key={label} className="rounded-lg bg-muted/60 px-3 py-2">
              <p className="tabular text-lg font-semibold">{n}</p>
              <p className="text-muted-foreground">{t(String(label))}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              downloadBlob(new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }), `belami-backup-${todayISO()}.json`)
              toast.success(t("Backup downloaded"))
            }}
          >
            <Download /> {t("Download backup")}
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload /> {t("Restore from backup")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ""
              if (!file) return
              try {
                const data = JSON.parse(await file.text()) as Database
                if (!Array.isArray(data.invoices) || !Array.isArray(data.products) || !data.settings) throw new Error("bad file")
                window.localStorage.setItem("belami-invoice-demo", JSON.stringify({ ...data, version: db.version }))
                toast.success(t("Backup restored"))
                window.location.reload()
              } catch {
                toast.error(t("That file isn't a valid backup"))
              }
            }}
          />
        </div>
      </FormSection>
      <FormSection title={t("Danger zone")}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => setConfirm("reset")}>
            <RotateCcw /> {t("Reset demo data")}
          </Button>
          <Button variant="outline" className="text-destructive" onClick={() => setConfirm("clear")}>
            <Trash2 /> {t("Start empty")}
          </Button>
        </div>
      </FormSection>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm === "reset" ? t("Reset all demo data?") : t("Remove all data?")}
        description={
          confirm === "reset"
            ? t("Your changes are replaced with fresh sample products, customers and invoices.")
            : t("All products, customers, invoices and payments are removed. Settings and tax rates are kept.")
        }
        confirmLabel={confirm === "reset" ? "Reset" : "Remove everything"}
        destructive
        onConfirm={() => {
          if (confirm === "reset") resetDemoData()
          else clearAllData()
          toast.success(confirm === "reset" ? t("Demo data restored") : t("All data removed"))
          router.push("/dashboard")
        }}
      />
    </div>
  )
}

// ---------- Page ----------

export function SettingsView() {
  const { t } = useT()
  const db = useData()
  const params = useSearchParams()
  const router = useRouter()
  const initial = (params.get("tab") as Section) || "business"
  const [section, setSection] = useState<Section>(SECTIONS.some((s) => s.value === initial) ? initial : "business")
  const go = (s: Section) => {
    setSection(s)
    router.replace(`/settings?tab=${s}`, { scroll: false })
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("Settings")} description={t("Your business profile, invoice defaults and preferences.")} />
      <TabBar className="lg:hidden" value={section} onChange={go} items={SECTIONS.map((s) => ({ value: s.value, label: t(s.label) }))} />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="hidden lg:block" aria-label={t("Settings sections")}>
          <ul className="sticky top-20 space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.value}>
                <button
                  type="button"
                  onClick={() => go(s.value)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    section === s.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <s.icon className="size-4" /> {t(s.label)}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          {section === "business" && <BusinessSection db={db} />}
          {section === "invoice" && <InvoiceSection db={db} />}
          {section === "taxes" && <TaxesSection db={db} />}
          {section === "template" && <TemplateSection db={db} />}
          {section === "locale" && <LocaleSection db={db} />}
          {section === "data" && <DataSection db={db} />}
        </div>
      </div>
    </div>
  )
}
