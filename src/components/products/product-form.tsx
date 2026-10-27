"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Archive, ArchiveRestore, FilePlus2, ImageUp, Plus, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FormSection } from "@/components/shared/field"
import { PageHeader } from "@/components/shared/page-header"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { useData, useFormat } from "@/lib/hooks"
import { deleteProducts, productIsUsed, saveProduct, setProductsArchived } from "@/lib/store"
import { calculateInvoice } from "@/lib/calc"
import { displayStatus } from "@/lib/invoice-helpers"
import { useT } from "@/lib/i18n"
import type { Product, ProductVariant } from "@/lib/types"
import { CategoryBadge } from "./category"
import { ProductImage, readProductPhoto } from "./product-image"

const SUGGESTED_VARIANTS = ["خام", "رنگی", "چوبی"]

interface VariantRow {
  label: string
  price: string
}

export function ProductForm({ product }: { product?: Product }) {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const categories = useMemo(() => [...new Set(db.products.map((p) => p.category))].sort(), [db.products])

  const [name, setName] = useState(product?.name ?? "")
  const [code, setCode] = useState(product?.sku ?? "")
  const [category, setCategory] = useState(product?.category ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [image, setImage] = useState<string | undefined>(product?.image)
  const [taxRateId, setTaxRateId] = useState(product ? (product.taxRateId ?? "none") : "none")
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.length ? product.variants.map((v) => ({ label: v.label, price: String(v.price) })) : [{ label: "خام", price: "" }],
  )
  const [showErrors, setShowErrors] = useState(false)

  const parsed: ProductVariant[] = variants.map((v) => ({ label: v.label.trim(), price: Number(v.price) }))
  const errors = {
    name: name.trim().length < 2 ? t("Name must be at least 2 characters") : undefined,
    code: !code.trim() ? t("SKU is required") : undefined,
    category: !category.trim() ? t("Category is required") : undefined,
    variants: parsed.length === 0 || parsed.some((v) => !v.label || !Number.isFinite(v.price) || v.price < 0 || String(v.price) === "") ? t("Enter a price") : undefined,
  }
  const valid = !errors.name && !errors.code && !errors.category && !errors.variants

  const tax = db.taxRates.find((x) => x.id === taxRateId)
  const firstPrice = parsed[0]?.price && Number.isFinite(parsed[0].price) ? parsed[0].price : 0

  const history = useMemo(() => {
    if (!product) return null
    const rows = db.invoices
      .filter((inv) => inv.status !== "void" && inv.status !== "draft")
      .flatMap((inv) => {
        const totals = calculateInvoice(inv)
        return inv.lines.map((line, i) => ({ inv, line, total: totals.lines[i].taxable })).filter((x) => x.line.productId === product.id)
      })
    return {
      units: rows.reduce((s, r) => s + r.line.quantity, 0),
      revenue: rows.reduce((s, r) => s + r.total, 0),
      recent: rows.sort((a, b) => b.inv.issueDate.localeCompare(a.inv.issueDate)).slice(0, 6),
    }
  }, [db.invoices, product])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (!valid) return toast.error(t("Please fix the highlighted fields before issuing"))
    const duplicate = db.products.find((p) => p.sku.toLowerCase() === code.trim().toLowerCase() && p.id !== product?.id)
    if (duplicate) return toast.error(t("SKU already used by “{name}”", { name: duplicate.name }))
    const id = saveProduct({
      id: product?.id,
      name: name.trim(),
      sku: code.trim().toUpperCase(),
      category: category.trim(),
      unit: product?.unit ?? "عدد",
      price: parsed[0].price,
      variants: parsed,
      image,
      taxRateId: taxRateId === "none" ? null : taxRateId,
      description: description.trim() || undefined,
      trackStock: false,
      stock: 0,
      lowStockAt: 0,
      archived: product?.archived ?? false,
    })
    toast.success(product ? t("Product updated") : t("Product created"))
    router.push(product ? "/products" : `/products/${id}`)
  }

  const setVariant = (i: number, patch: Partial<VariantRow>) => setVariants((rows) => rows.map((r, k) => (k === i ? { ...r, ...patch } : r)))
  const used = product ? productIsUsed(db, product.id) : false

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <PageHeader
        backHref="/products"
        title={product ? product.name : t("New product")}
        badge={product?.archived ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t("Archived")}</span> : undefined}
        description={product ? <span className="font-mono">{product.sku}</span> : t("Add a product or service to your catalog.")}
        actions={
          <>
            {product && (
              <Button type="button" variant="outline" asChild>
                <Link href={`/invoices/new?product=${product.id}`}>
                  <FilePlus2 /> <span className="hidden sm:inline">{t("Invoice this")}</span>
                </Link>
              </Button>
            )}
            <Button type="submit">
              <Save /> {product ? t("Save changes") : t("Create product")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <FormSection title={t("Details")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Name")} htmlFor="name" error={showErrors ? errors.name : undefined} required className="sm:col-span-2">
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={showErrors && !!errors.name} />
              </Field>
              <Field label={t("Product code")} htmlFor="code" error={showErrors ? errors.code : undefined} required hint={t("Unique product code")}>
                <Input id="code" dir="ltr" className="text-end font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={showErrors && !!errors.code} />
              </Field>
              <Field label={t("Category")} htmlFor="category" error={showErrors ? errors.category : undefined} required>
                <Input id="category" list="categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("Choose or type new")} aria-invalid={showErrors && !!errors.category} />
                <datalist id="categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label={t("Specifications")} htmlFor="description" className="sm:col-span-2" hint={t("One per line, e.g. “Base size: 10*10”. Shown under the item name on invoices")}>
                <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection title={t("Prices")} description={t("Add one price per type, e.g. raw, colored and wood. You choose the type when adding the product to an invoice.")}>
            <ul className="grid gap-2">
              {variants.map((v, i) => (
                <li key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                  <Input aria-label={t("Type")} list="variant-names" value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} placeholder={t("Type")} />
                  <Input
                    aria-label={t("Price")}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    className="tabular"
                    value={v.price}
                    onChange={(e) => setVariant(i, { price: e.target.value })}
                    placeholder={t("Price")}
                    aria-invalid={showErrors && (v.price === "" || Number(v.price) < 0)}
                  />
                  <Button type="button" variant="ghost" size="icon-sm" disabled={variants.length === 1} onClick={() => setVariants((rows) => rows.filter((_, k) => k !== i))} aria-label={t("Remove")} className="text-muted-foreground hover:text-destructive">
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            <datalist id="variant-names">
              {SUGGESTED_VARIANTS.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
            {showErrors && errors.variants && <p className="text-xs text-destructive">{errors.variants}</p>}
            <Button type="button" variant="outline" className="justify-self-start" onClick={() => setVariants((rows) => [...rows, { label: "", price: "" }])}>
              <Plus /> {t("Add price type")}
            </Button>
            <Field label={t("Tax")} htmlFor="tax" className="max-w-xs">
              <Select value={taxRateId} onValueChange={setTaxRateId}>
                <SelectTrigger id="tax" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("No tax")}</SelectItem>
                  {db.taxRates.map((tx) => (
                    <SelectItem key={tx.id} value={tx.id}>
                      {t(tx.name)} ({n(tx.rate)}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FormSection>
        </div>

        <aside className="min-w-0 space-y-5">
          <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
            <h2 className="text-sm font-medium text-muted-foreground">{t("Photo")}</h2>
            <ProductImage src={image} alt={name} className="mt-3 aspect-square w-full" />
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <ImageUp /> {image ? t("Replace") : t("Upload photo")}
              </Button>
              {image && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImage(undefined)}>
                  {t("Remove")}
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                if (!file) return
                try {
                  setImage(await readProductPhoto(file))
                } catch {
                  toast.error(t("Couldn't read that image"))
                }
              }}
            />
          </section>

          <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
            <h2 className="text-sm font-medium text-muted-foreground">{t("Summary")}</h2>
            <div className="mt-3 flex items-center gap-2">{category && <CategoryBadge category={category} />}</div>
            <p className="tabular mt-3 text-3xl font-semibold tracking-tight">{fmt.money(firstPrice)}</p>
            <ul className="mt-3 space-y-1.5 border-t pt-3 text-sm">
              {parsed.map((v, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{v.label || "—"}</span>
                  <span className="tabular font-medium">{Number.isFinite(v.price) ? fmt.money(v.price) : "—"}</span>
                </li>
              ))}
            </ul>
            {tax && tax.rate > 0 && (
              <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                {t("With tax ({rate}%)", { rate: tax.rate })}: {fmt.money(firstPrice * (1 + tax.rate / 100))}
              </p>
            )}
          </section>

          {history && (
            <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
              <h2 className="text-sm font-medium text-muted-foreground">{t("Sales history")}</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="tabular text-xl font-semibold">{fmt.number(history.units)}</p>
                  <p className="text-xs text-muted-foreground">{t("Units sold")}</p>
                </div>
                <div>
                  <p className="tabular text-xl font-semibold">{fmt.compact(history.revenue)}</p>
                  <p className="text-xs text-muted-foreground">{t("Revenue (excl. tax)")}</p>
                </div>
              </div>
              {history.recent.length > 0 && (
                <ul className="mt-4 divide-y border-t text-sm">
                  {history.recent.map(({ inv, line }) => (
                    <li key={inv.id + line.id}>
                      <Link href={`/invoices/${inv.id}`} className="flex items-center justify-between gap-2 py-2 hover:text-primary">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{inv.number}</span>
                          <span className="block truncate text-xs text-muted-foreground">{inv.customerSnapshot.name}</span>
                        </span>
                        <span className="text-end">
                          <span className="tabular block text-xs">×{fmt.number(line.quantity)}</span>
                          <StatusBadge status={displayStatus(inv)} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {product && (
            <section className="space-y-2 rounded-xl border bg-card p-4 shadow-xs sm:p-5">
              <h2 className="text-sm font-medium text-muted-foreground">{t("Manage")}</h2>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setProductsArchived([product.id], !product.archived)
                  toast.success(product.archived ? t("Product restored") : t("Product archived"))
                }}
              >
                {product.archived ? <ArchiveRestore /> : <Archive />}
                {product.archived ? t("Restore product") : t("Archive product")}
              </Button>
              <Button type="button" variant="outline" className="w-full justify-start text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 /> {t("Delete product")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {used ? t("This product appears on invoices, so deleting will archive it instead.") : t("Archived products are hidden from the invoice editor.")}
              </p>
            </section>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={used ? t("Archive this product?") : t("Delete this product?")}
        description={used ? t("It's used on existing invoices, so it will be archived to keep those invoices accurate.") : t("This can't be undone.")}
        confirmLabel={used ? "Archive" : "Delete"}
        destructive
        onConfirm={() => {
          if (!product) return
          deleteProducts([product.id])
          toast.success(used ? t("Product archived") : t("Product deleted"))
          router.push("/products")
        }}
      />
    </form>
  )
}
