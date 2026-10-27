"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Archive,
  ArchiveRestore,
  FilePlus2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Trash2,
  ImageOff,
  Tags,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { ExportMenu } from "@/components/shared/export-menu"
import { StatCard } from "@/components/shared/stat-card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useData, useDebounced, useFormat } from "@/lib/hooks"
import { deleteProducts, setProductsArchived } from "@/lib/store"
import { productRows } from "@/lib/invoice-export"
import type { Product } from "@/lib/types"
import { cn, sumBy } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { CategoryBadge } from "./category"
import { ProductImage } from "./product-image"

type StatusFilter = "active" | "archived" | "all"
type SortKey = "catalog" | "category" | "code" | "price-asc" | "price-desc" | "newest"

const PAGE_SIZE = 24
const VIEW_KEY = "belami-products-view"

export function ProductsView({ page = 1 }: { page?: number }) {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState<StatusFilter>("active")
  const [sort, setSort] = useState<SortKey>("catalog")
  // Remember the chosen layout (grid or list) between visits.
  const [view, setViewState] = useState<"grid" | "table">(() => {
    try {
      return window.localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "table"
    } catch {
      return "table"
    }
  })
  const setView = (v: "grid" | "table") => {
    setViewState(v)
    try {
      window.localStorage.setItem(VIEW_KEY, v)
    } catch {}
  }
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const search = useDebounced(query)

  const categories = useMemo(() => [...new Set(db.products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, "fa")), [db.products])
  const taxName = (id: string | null) => db.taxRates.find((x) => x.id === id)?.name ?? "No tax"
  const taxRate = (id: string | null) => db.taxRates.find((x) => x.id === id)?.rate ?? 0

  const filtered = useMemo(() => {
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean)
    const list = db.products.filter((p) => {
      if (status === "archived" ? !p.archived : status !== "all" && p.archived) return false
      if (category !== "all" && p.category !== category) return false
      const hay = `${p.name} ${p.sku} ${p.category} ${p.description ?? ""} ${p.variants.map((v) => v.label).join(" ")}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
    const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
      catalog: () => 0, // keep the catalog (PDF) order
      category: (a, b) => a.category.localeCompare(b.category, "fa") || a.sku.localeCompare(b.sku, undefined, { numeric: true }),
      code: (a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true }),
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    }
    return list.sort(sorters[sort])
  }, [db.products, search, status, category, sort])

  // The page number lives in the URL: /products/2
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(Math.max(1, page), pageCount)
  const pager = {
    page: current,
    pageCount,
    total: filtered.length,
    items: filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    from: filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1,
    to: Math.min(current * PAGE_SIZE, filtered.length),
  }
  const goToPage = (p: number) => router.push(`/products/${p}`)
  // Changing a filter returns to the first page.
  const firstPage = () => {
    if (page > 1) router.push("/products/1")
  }

  const active = db.products.filter((p) => !p.archived)
  const avgPrice = active.length ? sumBy(active, (p) => p.price) / active.length : 0
  const withoutPhoto = active.filter((p) => !p.image).length

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const pageIds = pager.items.map((p) => p.id)
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id))

  const archive = (ids: string[], archived: boolean) => {
    setProductsArchived(ids, archived)
    setSelected(new Set())
    toast.success(t(archived ? "{n} products archived" : "{n} products restored", { n: ids.length }))
  }

  const rowActions = (p: Product) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`${t("Actions")} ${p.name}`} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link href={`/products/${p.id}`}>
            <Pencil /> {t("Edit")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/invoices/new?product=${p.id}`}>
            <FilePlus2 /> {t("Create invoice")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => archive([p.id], !p.archived)}>
          {p.archived ? <ArchiveRestore /> : <Archive />} {p.archived ? t("Restore") : t("Archive")}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete([p.id])}>
          <Trash2 /> {t("Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("Products")}
        description={t("Your catalog of products and services. Prices here are used when you add items to invoices.")}
        actions={
          <>
            <ExportMenu
              filename="products"
              sheetName={t("Products")}
              getRows={() => productRows(selected.size ? db.products.filter((p) => selected.has(p.id)) : filtered, taxName)}
            />
            <Button asChild>
              <Link href="/products/new">
                <Plus /> {t("New product")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("Active products")} value={n(active.length)} icon={Package} />
        <StatCard label={t("Categories")} value={n(categories.length)} icon={Tags} />
        <StatCard label={t("Average price")} value={fmt.compact(avgPrice)} icon={Wallet} tone="success" />
        <StatCard label={t("Without photo")} value={n(withoutPhoto)} icon={ImageOff} tone={withoutPhoto ? "warning" : "default"} />
      </div>

      <div className="rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center">
          <SearchInput value={query} onChange={(v) => { setQuery(v); firstPage() }} placeholder={t("Search name, code, category…")} className="xl:max-w-xs xl:flex-1" />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Select value={category} onValueChange={(v) => { setCategory(v); firstPage() }}>
              <SelectTrigger className="w-full sm:w-40" aria-label={t("Category")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All categories")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); firstPage() }}>
              <SelectTrigger className="w-full sm:w-36" aria-label={t("Status")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("Active")}</SelectItem>
                <SelectItem value="archived">{t("Archived")}</SelectItem>
                <SelectItem value="all">{t("All")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => { setSort(v as SortKey); firstPage() }}>
              <SelectTrigger className="w-full sm:w-40" aria-label={t("Sort")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="catalog">{t("Catalog order")}</SelectItem>
                <SelectItem value="category">{t("Category")}</SelectItem>
                <SelectItem value="code">{t("Product code")}</SelectItem>
                <SelectItem value="price-asc">{t("Price: low to high")}</SelectItem>
                <SelectItem value="price-desc">{t("Price: high to low")}</SelectItem>
                <SelectItem value="newest">{t("Newest")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-md border p-0.5">
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon-sm"
                className="flex-1 sm:flex-none"
                onClick={() => setView("table")}
                aria-label={t("Table view")}
                aria-pressed={view === "table"}
              >
                <List />
              </Button>
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                className="flex-1 sm:flex-none"
                onClick={() => setView("grid")}
                aria-label={t("Grid view")}
                aria-pressed={view === "grid"}
              >
                <LayoutGrid />
              </Button>
            </div>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-accent/50 px-4 py-2 text-sm">
            <span className="font-medium">{t("{n} selected", { n: selected.size })}</span>
            <Button size="sm" variant="outline" onClick={() => archive([...selected], true)}>
              <Archive /> {t("Archive")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => archive([...selected], false)}>
              <ArchiveRestore /> {t("Restore")}
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setConfirmDelete([...selected])}>
              <Trash2 /> {t("Delete")}
            </Button>
            <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setSelected(new Set())}>
              {t("Clear")}
            </Button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t("No products found")}
            description={db.products.length ? t("Try a different search or filter.") : t("Add your first product or service to start invoicing.")}
            action={
              <Button asChild>
                <Link href="/products/new">
                  <Plus /> {t("New product")}
                </Link>
              </Button>
            }
          />
        ) : view === "grid" ? (
          <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 xl:grid-cols-4">
            {pager.items.map((p) => (
              <div
                key={p.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/products/${p.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/products/${p.id}`)}
                className={cn(
                  "group relative flex cursor-pointer flex-col rounded-lg border bg-background p-3 transition-all hover:border-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  p.archived && "opacity-60",
                )}
              >
                <div className="relative">
                  <ProductImage src={p.image} alt={p.name} className="aspect-square w-full" />
                  <div className="absolute end-1 top-1 rounded-md bg-background/85 backdrop-blur">{rowActions(p)}</div>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 font-medium">{p.name}</h3>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground" dir="ltr">{p.sku}</span>
                </div>
                <CategoryBadge category={p.category} className="mt-1.5 self-start" />
                <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
                  {p.variants.slice(0, 3).map((v) => (
                    <li key={v.label} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{v.label}</span>
                      <span className="tabular font-medium">{fmt.money(v.price)}</span>
                    </li>
                  ))}
                  {p.variants.length > 3 && <li className="text-xs text-muted-foreground">{t("+{n} more", { n: p.variants.length - 3 })}</li>}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <ul className="divide-y xl:hidden">
              {pager.items.map((p) => (
                <li key={p.id} className={cn("flex items-start gap-3 px-3 py-3", p.archived && "opacity-60")}>
                  <Checkbox className="mt-1" checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} aria-label={`${t("Select")} ${p.name}`} />
                  <Link href={`/products/${p.id}`} className="flex min-w-0 flex-1 gap-3">
                    <ProductImage src={p.image} alt={p.name} className="size-14" />
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="line-clamp-2 block text-sm leading-snug font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        <span className="font-mono" dir="ltr">{p.sku}</span> · {p.category}
                      </span>
                      <span className="tabular block text-sm font-medium">
                        {fmt.money(p.price)}
                        {p.variants.length > 1 && <span className="text-xs font-normal text-muted-foreground"> · {t("{n} prices", { n: p.variants.length })}</span>}
                      </span>
                    </span>
                  </Link>
                  {rowActions(p)}
                </li>
              ))}
            </ul>
            {/* Desktop table */}
            <Table className="hidden xl:table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 ps-5 pe-2">
                    <Checkbox
                      checked={allOnPage}
                      onCheckedChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev)
                          pageIds.forEach((id) => (allOnPage ? next.delete(id) : next.add(id)))
                          return next
                        })
                      }
                      aria-label={t("Select page")}
                    />
                  </TableHead>
                  <TableHead>{t("Product")}</TableHead>
                  <TableHead>{t("Category")}</TableHead>
                  <TableHead className="text-end">{t("Prices")}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pager.items.map((p) => {
                  return (
                    <TableRow
                      key={p.id}
                      data-state={selected.has(p.id) ? "selected" : undefined}
                      className={cn("cursor-pointer", p.archived && "opacity-60")}
                      onClick={() => router.push(`/products/${p.id}`)}
                    >
                      <TableCell className="ps-5 pe-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} aria-label={`${t("Select")} ${p.name}`} />
                      </TableCell>
                      <TableCell className="max-w-80">
                        <div className="flex items-center gap-3">
                          <ProductImage src={p.image} alt={p.name} className="size-11" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="font-mono text-xs text-muted-foreground" dir="ltr" style={{ textAlign: "end" }}>{p.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={p.category} />
                      </TableCell>
                      <TableCell className="tabular text-end">
                        <div className="flex flex-col items-end gap-0.5 text-xs">
                          {p.variants.slice(0, 3).map((v) => (
                            <span key={v.label} className="whitespace-nowrap">
                              <span className="text-muted-foreground">{v.label} </span>
                              <span className="text-sm font-medium">{fmt.money(v.price)}</span>
                            </span>
                          ))}
                          {p.variants.length > 3 && <span className="text-muted-foreground">{t("+{n} more", { n: p.variants.length - 3 })}</span>}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>{rowActions(p)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </>
        )}
        <div className="border-t px-3 py-3 sm:px-4">
          <Pagination {...pager} onPage={goToPage} noun="products" />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={t("Delete {n} products?", { n: confirmDelete?.length ?? 0 })}
        description={t("Products that already appear on invoices are archived instead, so past invoices stay intact.")}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!confirmDelete) return
          deleteProducts(confirmDelete)
          setSelected(new Set())
          toast.success(t("Products removed"))
        }}
      />
    </div>
  )
}
