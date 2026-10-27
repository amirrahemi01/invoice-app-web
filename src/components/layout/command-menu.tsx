"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { FilePlus2, FileText, Moon, Package, PackagePlus, Sun, User, UserPlus } from "lucide-react"
import { useTheme } from "next-themes"
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { useDB } from "@/lib/store"
import { displayStatus, STATUS_LABELS } from "@/lib/invoice-helpers"
import { formatMoney } from "@/lib/format"
import { useT } from "@/lib/i18n"
import { mainNav, secondaryNav } from "./nav"

const OPEN_EVENT = "open-command-menu"

export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const db = useDB()
  const { resolvedTheme, setTheme } = useTheme()
  const { t, lang } = useT()

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }
  const locale = lang === "fa" ? "fa-IR" : (db?.settings.locale.locale ?? "en-US")

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-x-3 top-[12vh] z-50 mx-auto max-w-xl overflow-hidden rounded-xl border bg-popover shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="sr-only">{t("Search")}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{t("Search pages, invoices, customers and products")}</DialogPrimitive.Description>
          <CommandPrimitive
            className="flex flex-col"
            loop
            // Every typed word must appear; avoids fuzzy matches like "laptop" → "Ballpoint".
            filter={(value, search) => {
              const hay = value.toLowerCase()
              return search.toLowerCase().split(/\s+/).every((term) => hay.includes(term)) ? 1 : 0
            }}
          >
            <CommandInput placeholder={t("Type a command or search…")} autoFocus />
            <CommandList className="max-h-[60vh]">
              <CommandEmpty>{t("No results found.")}</CommandEmpty>
              <CommandGroup heading={t("Quick actions")}>
                <CommandItem onSelect={() => go("/invoices/new")}>
                  <FilePlus2 /> {t("New invoice")}
                </CommandItem>
                <CommandItem onSelect={() => go("/customers/new")}>
                  <UserPlus /> {t("New customer")}
                </CommandItem>
                <CommandItem onSelect={() => go("/products/new")}>
                  <PackagePlus /> {t("New product")}
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    setOpen(false)
                  }}
                >
                  {resolvedTheme === "dark" ? <Sun /> : <Moon />} {t("Toggle theme")}
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading={t("Go to")}>
                {[...mainNav, ...secondaryNav].map((item) => (
                  <CommandItem key={item.href} value={`page ${item.name}`} onSelect={() => go(item.href)}>
                    <item.icon /> {t(item.name)}
                  </CommandItem>
                ))}
              </CommandGroup>
              {db && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={t("Invoices")}>
                    {db.invoices.slice(0, 200).map((inv) => (
                      <CommandItem
                        key={inv.id}
                        value={`invoice ${inv.number ?? "draft"} ${inv.customerSnapshot.name} ${inv.id}`}
                        onSelect={() => go(`/invoices/${inv.id}`)}
                      >
                        <FileText />
                        <span className="font-medium">{inv.number ?? t("Draft")}</span>
                        <span className="truncate text-muted-foreground">{inv.customerSnapshot.name}</span>
                        <span className="ms-auto shrink-0 text-xs text-muted-foreground tabular">
                          {formatMoney(inv.total, inv.currency, locale)} · {t(STATUS_LABELS[displayStatus(inv)])}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading={t("Customers")}>
                    {db.customers.map((c) => (
                      <CommandItem key={c.id} value={`customer ${c.name} ${c.phone ?? ""} ${c.id}`} onSelect={() => go(`/customers/${c.id}`)}>
                        <User />
                        <span className="truncate">{c.name}</span>
                        <span className="ms-auto truncate text-xs text-muted-foreground">{c.phone}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading={t("Products")}>
                    {db.products.map((p) => (
                      <CommandItem key={p.id} value={`product ${p.name} ${p.sku} ${p.id}`} onSelect={() => go(`/products/${p.id}`)}>
                        <Package />
                        <span className="truncate">{p.name}</span>
                        <span className="ms-auto shrink-0 text-xs text-muted-foreground">{p.sku}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
