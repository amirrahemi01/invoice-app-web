"use client"

import { useData } from "@/lib/hooks"
import { NotFoundCard } from "@/components/shared/not-found-card"
import { ProductForm } from "./product-form"

export function ProductEdit({ id }: { id: string }) {
  const product = useData().products.find((p) => p.id === id)
  if (!product) return <NotFoundCard what="Product" backHref="/products" />
  return <ProductForm key={product.id + product.updatedAt} product={product} />
}
