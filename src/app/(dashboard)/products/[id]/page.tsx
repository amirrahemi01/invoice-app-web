import { ProductForm } from "@/components/products/products-form"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Mock product data - in real app, fetch from database
  const product = {
    id,
    name: "Web Design",
    description: "Professional website design services",
    price: 1500,
    category: "Services",
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ProductForm product={product} />
    </div>
  )
}
