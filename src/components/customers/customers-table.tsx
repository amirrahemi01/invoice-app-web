"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Eye, Pencil, FileText, Trash2 } from "lucide-react"

const customers = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    totalInvoices: 12,
    totalSpent: 15680.0,
    lastInvoice: "2025-12-20",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 (555) 234-5678",
    totalInvoices: 8,
    totalSpent: 9450.0,
    lastInvoice: "2025-12-18",
  },
  {
    id: "3",
    name: "Mike Brown",
    email: "mike@example.com",
    phone: "+1 (555) 345-6789",
    totalInvoices: 5,
    totalSpent: 4200.0,
    lastInvoice: "2025-12-15",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "+1 (555) 456-7890",
    totalInvoices: 15,
    totalSpent: 23450.0,
    lastInvoice: "2025-12-19",
  },
  {
    id: "5",
    name: "Alex Wilson",
    email: "alex@example.com",
    phone: "+1 (555) 567-8901",
    totalInvoices: 3,
    totalSpent: 2100.0,
    lastInvoice: "2025-12-10",
  },
  {
    id: "6",
    name: "Lisa Chen",
    email: "lisa@example.com",
    phone: "+1 (555) 678-9012",
    totalInvoices: 7,
    totalSpent: 8900.0,
    lastInvoice: "2025-12-17",
  },
]

export function CustomersTable() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Total Invoices</TableHead>
            <TableHead>Total Spent</TableHead>
            <TableHead>Last Invoice</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                      {customer.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
              <TableCell>{customer.totalInvoices}</TableCell>
              <TableCell className="font-medium">
                ${customer.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(customer.lastInvoice).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
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
                      <Link href={`/customers/${customer.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/customers/${customer.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/invoices/new?customer=${customer.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Create Invoice
                      </Link>
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
