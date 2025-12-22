// Path: src/app/products/page.tsx

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit2, Trash2, Eye } from "lucide-react"
import Link from "next/link"

export default function ProductsPage() {
  // Mock data for demonstration
  const products = [
    { id: 1, name: "Web Design Service", price: 500, sku: "WEB-001" },
    { id: 2, name: "Consulting Hours", price: 150, sku: "CONS-001" },
    { id: 3, name: "Development Services", price: 1200, sku: "DEV-001" },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products & Services</h1>
          <p className="text-muted-foreground mt-1">Manage your product and service catalog</p>
        </div>
        <Link href="/products/new">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus size={18} />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input placeholder="Search by product name or SKU..." className="pl-10" />
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Link href="/products/new">
                <Button variant="outline">Add Your First Product</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Product Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">SKU</th>
                    <th className="text-right py-4 px-6 font-semibold text-foreground">Price</th>
                    <th className="text-right py-4 px-6 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-foreground">{product.name}</td>
                      <td className="py-4 px-6 text-muted-foreground">{product.sku}</td>
                      <td className="py-4 px-6 text-right font-semibold">${product.price.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                          <Link href={`/products/${product.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye size={16} />
                            </Button>
                          </Link>
                          <Link href={`/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit2 size={16} />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
