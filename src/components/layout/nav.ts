import { BarChart3, CreditCard, FileText, LayoutDashboard, Package, Settings, Users } from "lucide-react"

export const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: BarChart3 },
]

export const secondaryNav = [{ name: "Settings", href: "/settings", icon: Settings }]

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/")
}
