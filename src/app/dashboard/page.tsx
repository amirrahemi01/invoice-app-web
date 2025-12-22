// path: src/app/dashboard/page.tsx

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, FileText, Users } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"

export default async function DashboardPage() {
  // Fetch dashboard data
  const [invoices, customers, totalRevenue] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true, items: true },
    }),
    prisma.customer.count(),
    prisma.invoice.aggregate({
      _sum: { total: true },
    }),
  ])

  const stats = [
    {
      label: "Total Revenue",
      value: `$${(totalRevenue._sum.total || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-indigo-50",
    },
    {
      label: "Total Invoices",
      value: String(invoices.length),
      icon: FileText,
      color: "bg-emerald-50",
    },
    {
      label: "Total Customers",
      value: String(customers),
      icon: Users,
      color: "bg-blue-50",
    },
    {
      label: "Growth",
      value: "+12%",
      icon: TrendingUp,
      color: "bg-orange-50",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your business.</p>
        </div>
        <Link href="/invoices/new">
          <Button>Create Invoice</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon size={24} className="text-gray-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No invoices yet. Create your first invoice to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Invoice ID</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline font-medium">
                          #{invoice.id.toString().padStart(4, "0")}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{invoice.customer.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{invoice.createdAt.toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        ${invoice.total.toFixed(2)}
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
