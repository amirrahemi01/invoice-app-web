"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { InvoiceLineItems } from "./invoice-line-items"
import { Save, Send, Eye, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const customers = [
  { id: "1", name: "John Smith", email: "john@example.com" },
  { id: "2", name: "Sarah Johnson", email: "sarah@example.com" },
  { id: "3", name: "Mike Brown", email: "mike@example.com" },
  { id: "4", name: "Emily Davis", email: "emily@example.com" },
]

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export function InvoiceForm() {
  const router = useRouter()
  const [customerId, setCustomerId] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([{ id: "1", description: "", quantity: 1, unitPrice: 0 }])
  const [isSaving, setIsSaving] = useState(false)

  // Auto-save draft
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (customerId || lineItems.some((item) => item.description)) {
        // Auto-save logic here
        console.log("Auto-saving draft...")
      }
    }, 2000)

    return () => clearTimeout(saveTimer)
  }, [customerId, lineItems])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSaveDraft()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault()
        router.push("/invoices/preview")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const handleSaveDraft = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSaving(false)
    toast.success("Draft saved successfully")
  }

  const handleSend = async () => {
    if (!customerId) {
      toast.error("Please select a customer")
      return
    }
    toast.success("Invoice sent successfully")
    router.push("/invoices")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to invoices</span>
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-semibold">New Invoice</h2>
          <p className="text-sm text-muted-foreground">Create a new invoice for your customer</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/invoices/preview">
              <Eye className="mr-1.5 h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            <Save className="mr-1.5 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={handleSend}>
            <Send className="mr-1.5 h-4 w-4" />
            Send Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice-number">Invoice Number</Label>
                <Input
                  id="invoice-number"
                  placeholder="INV-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-date">Issue Date</Label>
                <Input id="issue-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceLineItems items={lineItems} onChange={setLineItems} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any notes or payment instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>${tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
