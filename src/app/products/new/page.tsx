// path: src/app/invoices/new/page.tsx

import ProductForm from "@/components/product/product-form"

export default function NewProductPage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Add New Product</h1>
        <p className="text-muted-foreground mb-6">Add a new product or service to your catalog</p>
        <ProductForm />
      </div>
    </div>
  )
}
