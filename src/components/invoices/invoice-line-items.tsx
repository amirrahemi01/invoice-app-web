"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import type { LineItem } from "./invoice-form"

const products = [
  { id: "1", name: "Web Design", price: 1500 },
  { id: "2", name: "Development", price: 2500 },
  { id: "3", name: "Consulting", price: 150 },
  { id: "4", name: "Maintenance", price: 500 },
]

interface InvoiceLineItemsProps {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

export function InvoiceLineItems({ items, onChange }: InvoiceLineItemsProps) {
  const addItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
    }
    onChange([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      onChange(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const selectProduct = (id: string, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      onChange(
        items.map((item) => (item.id === id ? { ...item, description: product.name, unitPrice: product.price } : item)),
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="hidden sm:grid sm:grid-cols-12 sm:gap-4 text-sm font-medium text-muted-foreground">
        <div className="col-span-5">Description</div>
        <div className="col-span-2">Qty</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1"></div>
      </div>

      {items.map((item) => (
        <div key={item.id} className="grid gap-4 sm:grid-cols-12 sm:items-center">
          <div className="sm:col-span-5">
            <Select onValueChange={(value) => selectProduct(item.id, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select product or type..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - ${product.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {item.description && (
              <Input
                className="mt-2"
                value={item.description}
                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                placeholder="Description"
              />
            )}
          </div>
          <div className="sm:col-span-2">
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => updateItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="sm:col-span-2 text-right font-medium">
            $
            {(item.quantity * item.unitPrice).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="sm:col-span-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(item.id)}
              disabled={items.length === 1}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove item</span>
            </Button>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addItem} className="w-full bg-transparent">
        <Plus className="mr-1.5 h-4 w-4" />
        Add Line Item
      </Button>
    </div>
  )
}
