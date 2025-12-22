// path: src/app/customers/page.tsx

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit2, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { invoices: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your business clients and contacts</p>
        </div>
        <Link href="/customers/new">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus size={18} />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
          size={18}
        />
        <Input placeholder="Search by customer name..." className="pl-10 w-full" />
      </div>

      {/* Customers Grid */}
      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center px-4">
            <p className="text-muted-foreground mb-4">No customers yet</p>
            <Link href="/customers/new">
              <Button variant="outline">Add Your First Customer</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
          {customers.map((customer) => (
            <Card key={customer.id} className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg truncate">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{customer.invoices.length} invoices</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {customer.phone && <p className="text-sm text-muted-foreground mb-2 truncate">{customer.phone}</p>}
                {customer.address && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{customer.address}</p>
                )}

                <div className="flex gap-2 pt-4 border-t border-border mt-auto">
                  <Link href={`/customers/${customer.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full gap-2">
                      <Eye size={16} />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </Link>
                  <Link href={`/customers/${customer.id}/edit`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full gap-2">
                      <Edit2 size={16} />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
