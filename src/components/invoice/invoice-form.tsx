"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

interface InvoiceItem {
  title: string
  qty: number
  price: number
}

export default function InvoiceForm() {
  const [customerId, setCustomerId] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([{ title: "", qty: 1, price: 0 }])

  const addItem = () => {
    setItems([...items, { title: "", qty: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  return (
    <form className="space-y-6">
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Choose a customer...</option>
            <option value="1">John Doe</option>
            <option value="2">Jane Smith</option>
          </select>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <Input
                placeholder="Item description"
                value={item.title}
                onChange={(e) => updateItem(index, "title", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Qty"
                min="1"
                value={item.qty}
                onChange={(e) => updateItem(index, "qty", Number.parseInt(e.target.value))}
              />
              <Input
                type="number"
                placeholder="Price"
                step="0.01"
                value={item.price}
                onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value))}
              />
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium">
                  ${(item.qty * item.price).toFixed(2)}
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-destructive"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addItem} className="w-full gap-2 bg-transparent">
            <Plus size={18} />
            Add Item
          </Button>

          {/* Totals */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex justify-end gap-8">
              <span className="text-foreground font-semibold">Total:</span>
              <span className="text-2xl font-bold text-primary w-32 text-right">${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline">Save as Draft</Button>
        <Button>Create Invoice</Button>
      </div>
    </form>
  )
}
