"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, LayoutDashboard, Package, Plus, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { isActive } from "./nav"

const items = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "New", href: "/invoices/new", icon: Plus, primary: true },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Goods", href: "/products", icon: Package },
]

/** Bottom tab bar for phones. Hidden on the invoice editor, which has its own action bar. */
export function MobileNav() {
  const pathname = usePathname()
  const { t } = useT()
  if (/^\/invoices\/(new|[^/]+\/edit)$/.test(pathname)) return null
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = !item.primary && isActive(pathname, item.href) && !(item.href === "/invoices" && pathname === "/invoices/new")
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.primary ? (
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <item.icon className="size-5" />
                  </span>
                ) : (
                  <>
                    <item.icon className="size-5" />
                    {t(item.name)}
                  </>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
