"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

export default function CustomerForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <Input
            label="Customer Name"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={handleChange}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Address</label>
            <textarea
              name="address"
              placeholder="123 Business St, City, State 12345"
              value={formData.address}
              onChange={handleChange}
              className="px-3 py-2 text-sm bg-input-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-20 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline">Cancel</Button>
        <Button>Save Customer</Button>
      </div>
    </form>
  )
}
