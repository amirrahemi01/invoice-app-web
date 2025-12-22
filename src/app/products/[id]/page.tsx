// path: src/app/invoices/[id]/page.tsx

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit2 } from "lucide-react"
import Link from "next/link"

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = {
    id: Number.parseInt(params.id),
    name: "Web Design Service",
    price: 500,
    sku: "WEB-001",
    description: "Professional web design service for small to medium businesses",
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
              <p className="text-muted-foreground mt-1">SKU: {product.sku}</p>
            </div>
          </div>
          <Link href={`/products/${product.id}/edit`}>
            <Button className="flex items-center gap-2">
              <Edit2 size={18} />
              Edit
            </Button>
          </Link>
        </div>

        {/* Product Details */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">PRODUCT INFO</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Product Name</p>
                    <p className="font-medium text-foreground">{product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-medium text-foreground">{product.sku}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">PRICING</h3>
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Base price</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">DESCRIPTION</h3>
              <p className="text-foreground">{product.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
