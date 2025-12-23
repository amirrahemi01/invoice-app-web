import { Suspense } from "react"
import { ProductsGrid } from "@/components/products/products-grid"
import { ProductsFilters } from "@/components/products/products-filters"
import { ProductsGridSkeleton } from "@/components/products/products-grid-skeleton"

export default function ProductsPage() {
  return (
    <div className="space-y-4">
      <ProductsFilters />
      <Suspense fallback={<ProductsGridSkeleton />}>
        <ProductsGrid />
      </Suspense>
    </div>
  )
}
