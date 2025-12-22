// Path: src/app/customers/[id]/page.tsx

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit2 } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: Number.parseInt(params.id) },
    include: { invoices: true },
  })

  if (!customer) notFound()

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/customers">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
              <p className="text-muted-foreground mt-1">{customer.invoices.length} invoice(s)</p>
            </div>
          </div>
          <Link href={`/customers/${customer.id}/edit`}>
            <Button className="flex items-center gap-2">
              <Edit2 size={18} />
              Edit
            </Button>
          </Link>
        </div>

        {/* Customer Details */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">CONTACT INFO</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{customer.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium text-foreground">{customer.address || "Not provided"}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">INVOICES</h3>
                <p className="text-3xl font-bold text-primary">{customer.invoices.length}</p>
                <p className="text-sm text-muted-foreground mt-2">Total invoices issued</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        {customer.invoices.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Recent Invoices</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Invoice</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                      <th className="text-right py-3 px-4 font-medium text-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customer.invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline font-medium">
                            #{invoice.id.toString().padStart(4, "0")}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{invoice.createdAt.toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-foreground">
                          ${invoice.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
