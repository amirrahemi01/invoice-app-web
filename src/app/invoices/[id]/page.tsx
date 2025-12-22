// path: src/app/invoices/[id]/page.tsx

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number.parseInt(params.id) },
    include: { customer: true, items: true },
  })

  if (!invoice) notFound()

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Invoice #{invoice.id.toString().padStart(4, "0")}</h1>
              <p className="text-muted-foreground mt-1">{invoice.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <Download size={18} />
              Download
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <Printer size={18} />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <Card>
          <CardContent className="p-8">
            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-border">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">FROM</h3>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Your Company Name</p>
                  <p className="text-sm text-muted-foreground">123 Business St</p>
                  <p className="text-sm text-muted-foreground">City, State 12345</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">BILL TO</h3>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{invoice.customer.name}</p>
                  {invoice.customer.address && (
                    <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>
                  )}
                  {invoice.customer.phone && <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full text-sm mb-4">
                <thead className="border-b-2 border-border">
                  <tr>
                    <th className="text-left py-3 font-semibold text-foreground">Description</th>
                    <th className="text-center py-3 font-semibold text-foreground">Qty</th>
                    <th className="text-right py-3 font-semibold text-foreground">Unit Price</th>
                    <th className="text-right py-3 font-semibold text-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-foreground">{item.title}</td>
                      <td className="py-3 text-center text-foreground">{item.qty}</td>
                      <td className="py-3 text-right text-foreground">${item.price.toFixed(2)}</td>
                      <td className="py-3 text-right text-foreground font-medium">
                        ${(item.qty * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 border-t-2 border-foreground pt-4">
                  <div className="flex justify-between">
                    <span className="text-foreground font-semibold">Subtotal:</span>
                    <span className="text-foreground">${invoice.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-foreground">Total:</span>
                    <span className="text-primary">${invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-8 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground">Thank you for your business!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
