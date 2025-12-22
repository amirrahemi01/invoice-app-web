// Path: src/app/invoices/new/page.tsx

import InvoiceForm from "@/components/invoice/invoice-form"

export default function NewInvoicePage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Invoice</h1>
        <p className="text-muted-foreground mb-6">Fill in the details to create a new invoice</p>
        <InvoiceForm />
      </div>
    </div>
  )
}
