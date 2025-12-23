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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

interface ProductFormProps {
  product?: {
    id: string
    name: string
    description: string
    price: number
    category: string
  }
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(product?.name || "")
  const [description, setDescription] = useState(product?.description || "")
  const [price, setPrice] = useState(product?.price?.toString() || "")
  const [category, setCategory] = useState(product?.category || "")

  const isEditing = !!product

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !price || !category) {
      toast.error("Please fill in required fields")
      return
    }

    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSaving(false)

    toast.success(isEditing ? "Product updated successfully" : "Product created successfully")
    router.push("/products")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to products</span>
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{isEditing ? "Edit Product" : "New Product"}</h2>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update product details" : "Add a new product or service"}
          </p>
        </div>
        <div className="ml-auto">
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-1.5 h-4 w-4" />
            {isSaving ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">
              Price <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Services">Services</SelectItem>
                <SelectItem value="Physical">Physical</SelectItem>
                <SelectItem value="Digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this product or service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
