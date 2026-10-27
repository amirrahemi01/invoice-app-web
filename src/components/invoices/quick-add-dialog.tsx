"use client"

import { useMemo, useState } from "react"
import { Minus, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ProductImage } from "@/components/products/product-image"
import { useData, useFormat } from "@/lib/hooks"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export interface QuickPick {
  productId: string
  variant: string
  quantity: number
}

interface Pick {
  variant: string
  qty: number
}

/** Pick many products in one go: search, filter by category, set price type and quantity, then add. */
export function QuickAddDialog({
  open,
  onOpenChange,
  onAdd,
  currency,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (picks: QuickPick[]) => void
  currency: string
}) {
  const db = useData()
  const fmt = useFormat()
  const { t, n } = useT()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [picks, setPicks] = useState<Record<string, Pick>>({})

  const products = useMemo(() => db.products.filter((p) => !p.archived), [db.products])
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
    return [...counts.entries()]
  }, [products])

  const visible = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false
      const hay = `${p.name} ${p.sku} ${p.category}`.toLowerCase()
      return terms.every((x) => hay.includes(x))
    })
  }, [products, query, category])

  const set = (id: string, patch: Partial<Pick>, defaultVariant: string) =>
    setPicks((prev) => {
      const cur = prev[id] ?? { variant: defaultVariant, qty: 0 }
      const next = { ...cur, ...patch }
      if (next.qty <= 0) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })

  const chosen = Object.entries(picks)
  const total = chosen.reduce((sum, [id, p]) => {
    const prod = db.products.find((x) => x.id === id)
    const price = prod?.variants.find((v) => v.label === p.variant)?.price ?? prod?.price ?? 0
    return sum + price * p.qty
  }, 0)

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setPicks({})
      setQuery("")
      setCategory("all")
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex h-[88dvh] max-h-[760px] flex-col gap-0 p-0 sm:max-w-3xl" hideClose>
        <div className="border-b p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>{t("Quick add products")}</DialogTitle>
              <DialogDescription className="mt-1">{t("Set the quantity for every product you need, then add them all at once.")}</DialogDescription>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => close(false)} aria-label={t("Close")}>
              <X />
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search name, code, category…")}
              className="h-9 w-full rounded-md border border-input bg-transparent ps-8 pe-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm"
            />
          </div>
          <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {[["all", products.length] as const, ...categories].map(([name, count]) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                  category === name ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {name === "all" ? t("All") : name} <span className="tabular opacity-70">{n(count)}</span>
              </button>
            ))}
          </div>
        </div>

        <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
          {visible.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">{t("No products found")}</li>}
          {visible.map((p) => {
            const pick = picks[p.id]
            const variant = pick?.variant ?? p.variants[0]?.label ?? ""
            const price = p.variants.find((v) => v.label === variant)?.price ?? p.price
            return (
              <li key={p.id} className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5", pick && "bg-primary/5")}>
                <ProductImage src={p.image} alt="" className="size-12" />
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.category}</p>
                  <p className="tabular text-xs font-medium sm:hidden">{fmt.money(price, currency)}</p>
                </div>
                <div className="flex basis-full items-center justify-between gap-2 sm:contents">
                {p.variants.length > 1 && (
                  <div className="flex gap-1" role="group" aria-label={t("Type")}>
                    {p.variants.map((v) => (
                      <button
                        key={v.label}
                        type="button"
                        onClick={() => set(p.id, { variant: v.label, qty: pick?.qty ?? 1 }, v.label)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs transition-colors",
                          variant === v.label ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="ms-auto flex items-center justify-end gap-2">
                <span className="tabular hidden text-sm sm:block sm:w-28 sm:text-end">{fmt.money(price, currency)}</span>
                <div className="flex items-center gap-1">
                  {pick ? (
                    <>
                      <Button type="button" variant="outline" size="icon-sm" onClick={() => set(p.id, { qty: pick.qty - 1 }, variant)} aria-label={t("Decrease")}>
                        <Minus />
                      </Button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={pick.qty}
                        onChange={(e) => set(p.id, { qty: Math.max(0, Number(e.target.value) || 0) }, variant)}
                        aria-label={t("Qty")}
                        className="tabular h-8 w-12 rounded-md border border-input bg-transparent text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Button type="button" variant="outline" size="icon-sm" onClick={() => set(p.id, { qty: pick.qty + 1 }, variant)} aria-label={t("Increase")}>
                        <Plus />
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => set(p.id, { qty: 1 }, variant)}>
                      <Plus /> {t("Add")}
                    </Button>
                  )}
                </div>
                </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-3 border-t bg-card p-3 sm:px-4">
          <div className="me-auto text-sm">
            <p className="font-medium">{t("{n} products selected", { n: chosen.length })}</p>
            <p className="tabular text-xs text-muted-foreground">{fmt.money(total, currency)}</p>
          </div>
          {chosen.length > 0 && (
            <Button type="button" variant="ghost" onClick={() => setPicks({})}>
              {t("Clear")}
            </Button>
          )}
          <Button
            type="button"
            disabled={chosen.length === 0}
            onClick={() => {
              onAdd(chosen.map(([productId, p]) => ({ productId, variant: p.variant, quantity: p.qty })))
              close(false)
            }}
          >
            {t("Add to invoice")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
