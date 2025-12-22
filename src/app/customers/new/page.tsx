// Path: src/app/customers/new/page.tsx

import CustomerForm from "@/components/customer/customer-form"

export default function NewCustomerPage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Add New Customer</h1>
        <p className="text-muted-foreground mb-6">Enter customer details below</p>
        <CustomerForm />
      </div>
    </div>
  )
}
