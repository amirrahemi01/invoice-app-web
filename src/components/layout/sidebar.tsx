import Link from "next/link"
import { FileText, Users, Package, LayoutDashboard } from "lucide-react"

export default function Sidebar() {
  const navigation = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invoices", label: "Invoices", icon: FileText },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/products", label: "Products", icon: Package },
  ]

  return (
    <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">Invoice Hub</h1>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-primary/10 transition-colors active:bg-primary/20"
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        <p className="px-3 py-2">© 2025 Invoice Hub</p>
      </div>
    </aside>
  )
}
