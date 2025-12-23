import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Pencil, FileText, Mail, Phone, MapPin } from "lucide-react"

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Mock customer data
  const customer = {
    id,
    name: "John Smith",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, New York, NY 10001",
    totalInvoices: 12,
    totalSpent: 15680.0,
    notes: "Prefers email communication. VIP customer since 2023.",
  }

  const recentInvoices = [
    { id: "INV-001", amount: 1250.0, status: "paid", date: "2025-12-20" },
    { id: "INV-002", amount: 850.0, status: "pending", date: "2025-12-15" },
    { id: "INV-003", amount: 2340.0, status: "paid", date: "2025-12-10" },
  ]

  const statusStyles = {
    paid: "bg-secondary/10 text-secondary border-secondary/20",
    pending: "bg-warning/10 text-warning-foreground border-warning/20",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to customers</span>
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {customer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{customer.name}</h2>
            <p className="text-sm text-muted-foreground">Customer ID: {customer.id}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/customers/${id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/invoices/new?customer=${id}`}>
              <FileText className="mr-1.5 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                  {customer.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{customer.address}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-primary">{invoice.id}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <Badge variant="outline" className={statusStyles[invoice.status as keyof typeof statusStyles]}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
              <Separator className="my-4" />
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href={`/invoices?customer=${id}`}>View All Invoices</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Invoices</span>
                <span className="font-medium">{customer.totalInvoices}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Spent</span>
                <span className="font-semibold">
                  ${customer.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
