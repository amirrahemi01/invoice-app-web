"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Pencil, Copy, Send, Printer, Trash2 } from "lucide-react"

const invoices = [
  {
    id: "INV-001",
    customer: "John Smith",
    email: "john@example.com",
    amount: 1250.0,
    status: "paid",
    date: "2025-12-20",
    dueDate: "2025-12-30",
  },
  {
    id: "INV-002",
    customer: "Sarah Johnson",
    email: "sarah@example.com",
    amount: 850.0,
    status: "pending",
    date: "2025-12-19",
    dueDate: "2025-12-29",
  },
  {
    id: "INV-003",
    customer: "Mike Brown",
    email: "mike@example.com",
    amount: 2340.0,
    status: "overdue",
    date: "2025-12-10",
    dueDate: "2025-12-15",
  },
  {
    id: "INV-004",
    customer: "Emily Davis",
    email: "emily@example.com",
    amount: 490.0,
    status: "paid",
    date: "2025-12-14",
    dueDate: "2025-12-24",
  },
  {
    id: "INV-005",
    customer: "Alex Wilson",
    email: "alex@example.com",
    amount: 1890.0,
    status: "draft",
    date: "2025-12-13",
    dueDate: "2025-12-23",
  },
  {
    id: "INV-006",
    customer: "Lisa Chen",
    email: "lisa@example.com",
    amount: 3200.0,
    status: "pending",
    date: "2025-12-12",
    dueDate: "2025-12-22",
  },
  {
    id: "INV-007",
    customer: "David Kim",
    email: "david@example.com",
    amount: 750.0,
    status: "paid",
    date: "2025-12-11",
    dueDate: "2025-12-21",
  },
  {
    id: "INV-008",
    customer: "Maria Garcia",
    email: "maria@example.com",
    amount: 1650.0,
    status: "pending",
    date: "2025-12-10",
    dueDate: "2025-12-20",
  },
]

const statusStyles = {
  paid: "bg-secondary/10 text-secondary border-secondary/20",
  pending: "bg-warning/10 text-warning-foreground border-warning/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  draft: "bg-muted text-muted-foreground border-border",
}

export function InvoicesTable() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(invoices.map((i) => i.id))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === invoices.length}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(invoice.id)}
                  onCheckedChange={() => toggleOne(invoice.id)}
                  aria-label={`Select ${invoice.id}`}
                />
              </TableCell>
              <TableCell>
                <Link href={`/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                  {invoice.id}
                </Link>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{invoice.customer}</p>
                  <p className="text-sm text-muted-foreground">{invoice.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={statusStyles[invoice.status as keyof typeof statusStyles]}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(invoice.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(invoice.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right font-medium">
                ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/invoices/${invoice.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/invoices/${invoice.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
