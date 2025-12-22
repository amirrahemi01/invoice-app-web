// path: src/app/invoices/page.tsx

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Eye, Edit2, Trash2 } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage all your invoices in one place</p>
        </div>
        <Link href="/invoices/new">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus size={18} />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
          size={18}
        />
        <Input placeholder="Search by invoice ID or customer name..." className="pl-10 w-full" />
      </div>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground mb-4">No invoices found</p>
              <Link href="/invoices/new">
                <Button variant="outline">Create Your First Invoice</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border sticky top-0">
                  <tr>
                    <th className="text-left py-4 px-4 md:px-6 font-semibold text-foreground">Invoice #</th>
                    <th className="text-left py-4 px-4 md:px-6 font-semibold text-foreground hidden sm:table-cell">
                      Customer
                    </th>
                    <th className="text-left py-4 px-4 md:px-6 font-semibold text-foreground hidden md:table-cell">
                      Date
                    </th>
                    <th className="text-right py-4 px-4 md:px-6 font-semibold text-foreground">Amount</th>
                    <th className="text-right py-4 px-4 md:px-6 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 md:px-6">
                        <span className="font-medium text-primary">#{invoice.id.toString().padStart(4, "0")}</span>
                      </td>
                      <td className="py-4 px-4 md:px-6 hidden sm:table-cell text-sm">{invoice.customer.name}</td>
                      <td className="py-4 px-4 md:px-6 text-muted-foreground hidden md:table-cell text-sm">
                        {invoice.createdAt.toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 md:px-6 text-right font-semibold text-sm md:text-base">
                        ${invoice.total.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                              <Eye size={16} />
                            </Button>
                          </Link>
                          <Link href={`/invoices/${invoice.id}/edit`}>
                            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                              <Edit2 size={16} />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
