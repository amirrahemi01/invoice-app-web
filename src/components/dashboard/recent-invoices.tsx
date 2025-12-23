import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const recentInvoices = [
  {
    id: "INV-001",
    customer: "John Smith",
    amount: "$1,250.00",
    status: "paid",
    date: "Dec 20, 2025",
  },
  {
    id: "INV-002",
    customer: "Sarah Johnson",
    amount: "$850.00",
    status: "pending",
    date: "Dec 19, 2025",
  },
  {
    id: "INV-003",
    customer: "Mike Brown",
    amount: "$2,340.00",
    status: "overdue",
    date: "Dec 15, 2025",
  },
  {
    id: "INV-004",
    customer: "Emily Davis",
    amount: "$490.00",
    status: "paid",
    date: "Dec 14, 2025",
  },
  {
    id: "INV-005",
    customer: "Alex Wilson",
    amount: "$1,890.00",
    status: "draft",
    date: "Dec 13, 2025",
  },
]

const statusStyles = {
  paid: "bg-secondary/10 text-secondary hover:bg-secondary/20",
  pending: "bg-warning/10 text-warning-foreground hover:bg-warning/20",
  overdue: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  draft: "bg-muted text-muted-foreground hover:bg-muted/80",
}

export function RecentInvoices() {
  return (
    <div className="space-y-4">
      {recentInvoices.map((invoice) => (
        <Link
          key={invoice.id}
          href={`/invoices/${invoice.id}`}
          className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{invoice.customer}</p>
            <p className="text-xs text-muted-foreground">
              {invoice.id} • {invoice.date}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{invoice.amount}</span>
            <Badge variant="secondary" className={statusStyles[invoice.status as keyof typeof statusStyles]}>
              {invoice.status}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  )
}
