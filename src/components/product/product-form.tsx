"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

export default function ProductForm() {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    description: "",
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
            label="Product Name"
            name="name"
            placeholder="e.g., Web Design Service"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input label="SKU" name="sku" placeholder="e.g., WEB-001" value={formData.sku} onChange={handleChange} />

          <Input
            label="Price"
            name="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.price}
            onChange={handleChange}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              name="description"
              placeholder="Enter product or service description..."
              value={formData.description}
              onChange={handleChange}
              className="px-3 py-2 text-sm bg-input-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-24 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline">Cancel</Button>
        <Button>Save Product</Button>
      </div>
    </form>
  )
}
