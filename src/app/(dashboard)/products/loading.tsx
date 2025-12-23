import { ProductsGridSkeleton } from "@/components/products/products-grid-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="ml-auto h-9 w-20" />
      </div>
      <ProductsGridSkeleton />
    </div>
  )
}
