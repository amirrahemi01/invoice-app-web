"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function AppHeader() {
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname.startsWith("/invoices")) return "Invoices"
    if (pathname.startsWith("/customers")) return "Customers"
    if (pathname.startsWith("/products")) return "Products"
    if (pathname === "/settings") return "Settings"
    return "Dashboard"
  }

  const getNewButton = () => {
    if (pathname === "/invoices") return { href: "/invoices/new", label: "New Invoice" }
    if (pathname === "/customers") return { href: "/customers/new", label: "New Customer" }
    if (pathname === "/products") return { href: "/products/new", label: "New Product" }
    return null
  }

  const newButton = getNewButton()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-lg font-medium">{getPageTitle()}</h1>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="w-64 bg-background pl-8" />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        {newButton && (
          <Button asChild size="sm">
            <Link href={newButton.href}>
              <Plus className="mr-1 h-4 w-4" />
              {newButton.label}
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}
