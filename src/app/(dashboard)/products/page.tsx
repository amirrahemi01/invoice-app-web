import type { Metadata } from "next"
import { ProductsView } from "@/components/products/products-view"

export const metadata: Metadata = { title: "کالاها و خدمات" }

export default function ProductsPage() {
  return <ProductsView page={1} />
}
