"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, ListPlus, Minus, PackagePlus, Plus, Rows2, Rows3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { emptyLine, lineFromProduct } from "@/lib/invoice-helpers"
import { useData, useFormat } from "@/lib/hooks"
import type { InvoiceLine, InvoiceTotals } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { QuickAddDialog, type QuickPick } from "./quick-add-dialog"
import { ProductImage } from "@/components/products/product-image"

const toNumber = (value: string) => (value === "" ? 0 : Number(value))

export function LineItemsEditor({
  lines,
  onChange,
  totals,
  currency,
  showErrors,
}: {
  lines: InvoiceLine[]
  onChange: (lines: InvoiceLine[]) => void
  totals: InvoiceTotals
  currency: string
  showErrors: boolean
}) {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [quickOpen, setQuickOpen] = useState(false)
  // In the titles view, a row opens its full details in a dialog.
  const [detailId, setDetailId] = useState<string | null>(null)
  const detailLine = lines.find((l) => l.id === detailId)
  const detailIndex = lines.findIndex((l) => l.id === detailId)
  // Titles only (compact) or full details; remembered between visits.
  const [mode, setModeState] = useState<"compact" | "full">(() => {
    try {
      return window.localStorage.getItem("belami-items-view") === "full" ? "full" : "compact"
    } catch {
      return "compact"
    }
  })
  const setMode = (m: "compact" | "full") => {
    setModeState(m)
    try {
      window.localStorage.setItem("belami-items-view", m)
    } catch {}
  }
  const defaultTax = db.taxRates.find((t) => t.isDefault)

  const productOptions = db.products
    .filter((p) => !p.archived)
    .map((p) => ({
      value: p.id,
      label: p.name,
      keywords: [p.sku, p.category, ...p.variants.map((v) => v.label)],
      description: <span className="font-mono">{p.sku}</span>,
      trailing: fmt.money(p.price, currency),
      leading: <ProductImage src={p.image} alt="" className="size-9 rounded-md" />,
      group: p.category,
    }))

  const update = (id: string, patch: Partial<InvoiceLine>) => onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id: string) => onChange(lines.filter((l) => l.id !== id))
  const move = (index: number, delta: number) => {
    const next = [...lines]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }
  const addProduct = (productId: string) => {
    const product = db.products.find((p) => p.id === productId)
    if (!product) return
    const existing = lines.find((l) => l.productId === productId && l.variant === product.variants[0]?.label)
    if (existing) update(existing.id, { quantity: existing.quantity + 1 })
    else onChange([...lines.filter((l) => l.name || l.unitPrice), lineFromProduct(product, db.taxRates)])
  }
  const addMany = (picks: QuickPick[]) => {
    let next = lines.filter((l) => l.name.trim() || l.unitPrice)
    for (const pick of picks) {
      const product = db.products.find((p) => p.id === pick.productId)
      if (!product) continue
      const idx = next.findIndex((l) => l.productId === pick.productId && l.variant === pick.variant)
      if (idx >= 0) next = next.map((l, i) => (i === idx ? { ...l, quantity: l.quantity + pick.quantity } : l))
      else next = [...next, { ...lineFromProduct(product, db.taxRates, pick.variant), quantity: pick.quantity }]
    }
    onChange(next)
  }
  const setVariant = (line: InvoiceLine, label: string) => {
    const product = db.products.find((p) => p.id === line.productId)
    const variant = product?.variants.find((v) => v.label === label)
    if (variant) update(line.id, { variant: variant.label, unitPrice: variant.price })
  }
  const setTax = (id: string, taxId: string) => {
    const tax = db.taxRates.find((t) => t.id === taxId)
    update(id, { taxRateId: tax?.id ?? null, taxName: tax?.name ?? "", taxRate: tax?.rate ?? 0 })
  }
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="@container space-y-3">
      {lines.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{t("{n} items", { n: lines.length })}</p>
          <div className="inline-flex rounded-lg bg-muted p-1" role="group" aria-label={t("Items view")}>
            {(["compact", "full"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "compact" ? <Rows3 className="size-3.5" /> : <Rows2 className="size-3.5" />}
                {m === "compact" ? t("Titles") : t("Details")}
              </button>
            ))}
          </div>
        </div>
      )}
      {lines.length > 0 && mode === "full" && (
        <div className="hidden grid-cols-[minmax(0,1fr)_80px_110px_90px_120px_110px_100px] gap-2 px-1 text-xs font-medium text-muted-foreground @4xl:grid">
          <span>{t("Item")}</span>
          <span className="text-end">{t("Qty")}</span>
          <span className="text-end">{t("Price")}</span>
          <span className="text-end">{t("Disc. %")}</span>
          <span>{t("Tax")}</span>
          <span className="text-end">{t("Amount")}</span>
          <span />
        </div>
      )}

      {mode === "compact" && (
        <ol className="divide-y rounded-lg border">
          {lines.map((line, index) => (
            <li key={line.id} data-line-invalid={(showErrors && (!line.name.trim() || !(line.quantity > 0))) || undefined} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 data-[line-invalid=true]:bg-destructive/5">
              <span className="tabular w-5 shrink-0 text-xs text-muted-foreground">{n(index + 1)}</span>
              <button
                type="button"
                onClick={() => setDetailId(line.id)}
                className="min-w-0 flex-1 basis-44 rounded-md px-1 py-0.5 text-start transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`${t("Details")}: ${line.name}`}
              >
                <p className="truncate text-sm font-medium">
                  {line.name || <span className="text-destructive">{t("Item name")}</span>}
                  {line.variant && <span className="font-normal text-muted-foreground"> — {line.variant}</span>}
                </p>
                <p className="tabular flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {line.sku && <bdi className="font-mono">{line.sku}</bdi>}
                  <span>{fmt.money(line.unitPrice, currency)}</span>
                  {line.discountValue > 0 ? <span>{t("Disc. %")} {n(line.discountValue)}</span> : null}
                </p>
              </button>
              <div className="flex basis-full items-center gap-2 sm:basis-auto">
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon-sm" onClick={() => update(line.id, { quantity: Math.max(1, (line.quantity || 0) - 1) })} aria-label={t("Decrease")}>
                  <Minus />
                </Button>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  aria-label={`${t("Qty")} ${n(index + 1)}`}
                  className="tabular h-8 w-14 px-1 text-center"
                  value={Number.isFinite(line.quantity) ? line.quantity : ""}
                  onChange={(e) => update(line.id, { quantity: toNumber(e.target.value) })}
                  aria-invalid={(showErrors && !(line.quantity > 0)) || undefined}
                />
                <Button type="button" variant="outline" size="icon-sm" onClick={() => update(line.id, { quantity: (line.quantity || 0) + 1 })} aria-label={t("Increase")}>
                  <Plus />
                </Button>
              </div>
              <span className="tabular ms-auto min-w-0 truncate text-end text-sm font-medium sm:w-28">{fmt.money(totals.lines[index]?.net ?? 0, currency)}</span>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(line.id)} aria-label={`${t("Remove")} ${n(index + 1)}`} className="text-muted-foreground hover:text-destructive">
                <Trash2 />
              </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {mode === "full" && (
      <ol className="space-y-3 @4xl:space-y-2">
        {lines.map((line, index) => {
          const nameError = showErrors && !line.name.trim()
          const qtyError = showErrors && !(line.quantity > 0)
          const product = line.productId ? db.products.find((p) => p.id === line.productId) : undefined
          const isOpen = expanded.has(line.id) || !!line.description
          return (
            <li key={line.id} data-line-invalid={(showErrors && (!line.name.trim() || !(line.quantity > 0))) || undefined} className="rounded-lg border bg-background p-3 @4xl:rounded-md @4xl:border-0 @4xl:bg-transparent @4xl:p-0">
              <div className="grid grid-cols-2 gap-2 @4xl:grid-cols-[minmax(0,1fr)_80px_110px_90px_120px_110px_100px] @4xl:items-start">
                <div className="col-span-2 @4xl:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground @4xl:hidden">{t("Item")}</label>
                  <Input
                    value={line.name}
                    onChange={(e) => update(line.id, { name: e.target.value })}
                    placeholder={t("Item name")}
                    aria-invalid={nameError || undefined}
                    aria-label={`Item ${index + 1} name`}
                  />
                  {product && product.variants.length > 1 && (
                    <Select value={line.variant ?? product.variants[0].label} onValueChange={(v) => setVariant(line, v)}>
                      <SelectTrigger className="mt-2 h-8 w-full" aria-label={t("Type")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {product.variants.map((v) => (
                          <SelectItem key={v.label} value={v.label}>
                            {v.label} · {fmt.money(v.price, currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {line.sku && <span className="font-mono">{line.sku}</span>}
                    <button type="button" onClick={() => toggleExpanded(line.id)} className="hover:text-foreground hover:underline">
                      {isOpen ? t("Hide description") : t("Add description")}
                    </button>
                  </div>
                  {isOpen && (
                    <Textarea
                      className="mt-2 min-h-14"
                      rows={2}
                      value={line.description ?? ""}
                      onChange={(e) => update(line.id, { description: e.target.value })}
                      placeholder={t("Description shown on the invoice")}
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground @4xl:hidden">{t("Qty")} ({t(line.unit)})</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    className="tabular text-end"
                    value={Number.isFinite(line.quantity) ? line.quantity : ""}
                    onChange={(e) => update(line.id, { quantity: toNumber(e.target.value) })}
                    aria-invalid={qtyError || undefined}
                    aria-label={`Item ${index + 1} quantity`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground @4xl:hidden">{t("Unit price")}</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    className="tabular text-end"
                    value={Number.isFinite(line.unitPrice) ? line.unitPrice : ""}
                    onChange={(e) => update(line.id, { unitPrice: toNumber(e.target.value) })}
                    aria-label={`Item ${index + 1} unit price`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground @4xl:hidden">{t("Discount %")}</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="any"
                    className="tabular text-end"
                    value={line.discountValue || ""}
                    placeholder="0"
                    onChange={(e) => update(line.id, { discountType: "percent", discountValue: Math.min(100, Math.max(0, toNumber(e.target.value))) })}
                    aria-label={`Item ${index + 1} discount percent`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground @4xl:hidden">{t("Tax")}</label>
                  <Select value={line.taxRateId ?? "none"} onValueChange={(v) => setTax(line.id, v)}>
                    <SelectTrigger className="w-full" aria-label={`Item ${index + 1} tax`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("No tax")}</SelectItem>
                      {db.taxRates.map((tx) => (
                        <SelectItem key={tx.id} value={tx.id}>
                          {t(tx.name)} {n(tx.rate)}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex items-center justify-between border-t pt-2 @4xl:col-span-1 @4xl:block @4xl:border-0 @4xl:pt-0">
                  <span className="text-xs font-medium text-muted-foreground @4xl:hidden">{t("Amount")}</span>
                  <p className="tabular text-end font-medium @4xl:pt-2">{fmt.money(totals.lines[index]?.net ?? 0, currency)}</p>
                </div>
                <div className="col-span-2 flex justify-end gap-0.5 @4xl:col-span-1">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => move(index, -1)} aria-label={t("Move up")}>
                    <ChevronUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={index === lines.length - 1} onClick={() => move(index, 1)} aria-label={t("Move down")}>
                    <ChevronDown />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(line.id)} aria-label={`${t("Remove")} ${n(index + 1)}`} className="text-muted-foreground hover:text-destructive">
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      )}

      <div id="items-add" className={cn("grid gap-2 sm:grid-cols-[1fr_auto_auto]", lines.length === 0 && "rounded-lg border border-dashed p-4")}>
        <Combobox
          options={productOptions}
          value={null}
          onChange={addProduct}
          placeholder={t("Add a product or service…")}
          searchPlaceholder={t("Search by name, SKU or category…")}
          emptyText={t("No products found")}
          minWidth={360}
          invalid={showErrors && lines.length === 0}
          renderValue={() => (
            <span className="flex items-center gap-2 text-muted-foreground">
              <PackagePlus className="size-4" /> {t("Add a product or service…")}
            </span>
          )}
        />
        <Button type="button" onClick={() => setQuickOpen(true)}>
          <ListPlus /> {t("Quick add")}
        </Button>
        <Button type="button" variant="outline" onClick={() => onChange([...lines, emptyLine(defaultTax)])}>
          <Plus /> {t("Custom line")}
        </Button>
      </div>
      {showErrors && lines.length === 0 && <p className="text-xs text-destructive">{t("Add at least one item.")}</p>}
      <Dialog open={detailLine !== undefined} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="sm:max-w-lg">
          {detailLine && (
            <>
              <DialogHeader>
                <DialogTitle>{t("Item {n}", { n: detailIndex + 1 })}</DialogTitle>
                <DialogDescription>{detailLine.sku ? `${t("Product code")}: ${detailLine.sku}` : t("Custom line")}</DialogDescription>
              </DialogHeader>
              {(() => {
                const line = detailLine
                const product = line.productId ? db.products.find((p) => p.id === line.productId) : undefined
                return (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label htmlFor="d-name">{t("Name")}</Label>
                      <Input id="d-name" value={line.name} onChange={(e) => update(line.id, { name: e.target.value })} aria-invalid={showErrors && !line.name.trim() ? true : undefined} />
                    </div>
                    {product && product.variants.length > 1 && (
                      <div className="grid gap-1.5 sm:col-span-2">
                        <Label>{t("Type")}</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {product.variants.map((v) => (
                            <button
                              key={v.label}
                              type="button"
                              onClick={() => setVariant(line, v.label)}
                              className={cn(
                                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                                (line.variant ?? product.variants[0].label) === v.label ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                              )}
                            >
                              {v.label} · {fmt.money(v.price, currency)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-1.5">
                      <Label htmlFor="d-qty">{t("Qty")} ({t(line.unit)})</Label>
                      <Input id="d-qty" type="number" inputMode="decimal" min="0" step="any" className="tabular" value={Number.isFinite(line.quantity) ? line.quantity : ""} onChange={(e) => update(line.id, { quantity: toNumber(e.target.value) })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="d-price">{t("Unit price")}</Label>
                      <Input id="d-price" type="number" inputMode="decimal" min="0" step="any" className="tabular" value={Number.isFinite(line.unitPrice) ? line.unitPrice : ""} onChange={(e) => update(line.id, { unitPrice: toNumber(e.target.value) })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="d-disc">{t("Discount %")}</Label>
                      <Input id="d-disc" type="number" inputMode="decimal" min="0" max="100" step="any" className="tabular" value={line.discountValue || ""} placeholder="0" onChange={(e) => update(line.id, { discountType: "percent", discountValue: Math.min(100, Math.max(0, toNumber(e.target.value))) })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>{t("Tax")}</Label>
                      <Select value={line.taxRateId ?? "none"} onValueChange={(v) => setTax(line.id, v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("No tax")}</SelectItem>
                          {db.taxRates.map((tx) => (
                            <SelectItem key={tx.id} value={tx.id}>
                              {t(tx.name)} {n(tx.rate)}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label htmlFor="d-desc">{t("Specifications")}</Label>
                      <Textarea id="d-desc" rows={3} value={line.description ?? ""} onChange={(e) => update(line.id, { description: e.target.value })} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 sm:col-span-2">
                      <span className="text-sm text-muted-foreground">{t("Amount")}</span>
                      <span className="tabular font-semibold">{fmt.money(totals.lines[detailIndex]?.net ?? 0, currency)}</span>
                    </div>
                  </div>
                )
              })()}
              <DialogFooter className="sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    remove(detailLine.id)
                    setDetailId(null)
                  }}
                >
                  <Trash2 /> {t("Remove")}
                </Button>
                <Button type="button" onClick={() => setDetailId(null)}>
                  {t("Done")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <QuickAddDialog open={quickOpen} onOpenChange={setQuickOpen} onAdd={addMany} currency={currency} />
    </div>
  )
}
