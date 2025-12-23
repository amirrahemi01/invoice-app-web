"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

interface CustomerFormProps {
  customer?: {
    id: string
    name: string
    email: string
    phone: string
    address: string
    notes: string
  }
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(customer?.name || "")
  const [email, setEmail] = useState(customer?.email || "")
  const [phone, setPhone] = useState(customer?.phone || "")
  const [address, setAddress] = useState(customer?.address || "")
  const [notes, setNotes] = useState(customer?.notes || "")

  const isEditing = !!customer

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email) {
      toast.error("Please fill in required fields")
      return
    }

    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSaving(false)

    toast.success(isEditing ? "Customer updated successfully" : "Customer created successfully")
    router.push("/customers")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to customers</span>
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{isEditing ? "Edit Customer" : "New Customer"}</h2>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update customer information" : "Add a new customer to your list"}
          </p>
        </div>
        <div className="ml-auto">
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-1.5 h-4 w-4" />
            {isSaving ? "Saving..." : isEditing ? "Update Customer" : "Create Customer"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Enter full address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any notes about this customer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
    </form>
  )
}
