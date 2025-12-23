import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Pencil, Send, Printer, Download, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Mock invoice data
  const invoice = {
    id,
    customer: {
      name: "John Smith",
      email: "john@example.com",
      address: "123 Main Street, New York, NY 10001",
    },
    status: "pending",
    issueDate: "2025-12-20",
    dueDate: "2025-12-30",
    items: [
      { description: "Web Design", quantity: 1, unitPrice: 1500 },
      { description: "Development", quantity: 2, unitPrice: 2500 },
      { description: "Consulting", quantity: 5, unitPrice: 150 },
    ],
    notes: "Thank you for your business. Payment is due within 10 days.",
  }

  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const statusStyles = {
    paid: "bg-secondary/10 text-secondary border-secondary/20",
    pending: "bg-warning/10 text-warning-foreground border-warning/20",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
    draft: "bg-muted text-muted-foreground border-border",
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to invoices</span>
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{invoice.id}</h2>
          <Badge variant="outline" className={statusStyles[invoice.status as keyof typeof statusStyles]}>
            {invoice.status}
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/invoices/${id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button>
            <Send className="mr-1.5 h-4 w-4" />
            Send
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">Delete Invoice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Bill To</h3>
                <p className="mt-1 font-medium">{invoice.customer.name}</p>
                <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
                <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Number</span>
                  <span className="font-medium">{invoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue Date</span>
                  <span>
                    {new Date(invoice.issueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>
                    {new Date(invoice.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="pb-3 text-left font-medium">Description</th>
                  <th className="pb-3 text-right font-medium">Qty</th>
                  <th className="pb-3 text-right font-medium">Price</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">
                      $
                      {item.unitPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 text-right font-medium">
                      $
                      {(item.quantity * item.unitPrice).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Separator className="my-6" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>${tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {invoice.notes && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="mt-1 text-sm">{invoice.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Due</span>
                  <span className="font-semibold">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <Button className="w-full">Record Payment</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
                  <div>
                    <p>Invoice created</p>
                    <p className="text-xs text-muted-foreground">Dec 20, 2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
