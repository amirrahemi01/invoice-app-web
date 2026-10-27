import type { Metadata } from "next"
import { ProductEdit } from "@/components/products/product-edit"
import { ProductsView } from "@/components/products/products-view"

export const metadata: Metadata = { title: "کالاها و خدمات" }

// /products/2 is page 2 of the list; /products/prd_001 edits a product.
export default async function ProductRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (/^\d+$/.test(id)) return <ProductsView page={Number(id)} />
  return <ProductEdit id={id} />
}
