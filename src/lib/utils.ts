// path: src/lib/utils.ts

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ")
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export const validationRules = {
  customerName: {
    required: "Customer name is required",
    minLength: { value: 2, message: "Name must be at least 2 characters" },
    maxLength: { value: 100, message: "Name must not exceed 100 characters" },
  },
  email: {
    required: "Email is required",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
  },
  phone: {
    pattern: {
      value: /^[\d\s\-+$$$$]*$/,
      message: "Please enter a valid phone number",
    },
  },
  productName: {
    required: "Product name is required",
    minLength: { value: 2, message: "Name must be at least 2 characters" },
  },
  price: {
    required: "Price is required",
    min: { value: 0, message: "Price must be greater than 0" },
  },
  quantity: {
    required: "Quantity is required",
    min: { value: 1, message: "Quantity must be at least 1" },
  },
}
