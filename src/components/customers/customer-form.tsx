"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FormSection } from "@/components/shared/field"
import { PageHeader } from "@/components/shared/page-header"
import { saveCustomer } from "@/lib/store"
import type { Customer } from "@/lib/types"
import { useT } from "@/lib/i18n"

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || /^[+\d\s()\-.۰-۹]{6,}$/.test(v), "Enter a valid phone number"),
})

type FormValues = z.infer<typeof schema>

/** Customers only need a name and a phone number. */
export function CustomerForm({
  customer,
  variant = "page",
  initialName,
  onSaved,
  onCancel,
}: {
  customer?: Customer
  variant?: "page" | "dialog"
  initialName?: string
  onSaved?: (id: string) => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const { t } = useT()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName ?? customer?.name ?? "", phone: customer?.phone ?? "" },
  })
  const { register, handleSubmit, formState } = form
  const errors = Object.fromEntries(
    Object.entries(formState.errors).map(([k, v]) => [k, v?.message ? { message: t(String(v.message)) } : v]),
  ) as typeof formState.errors

  const onSubmit = (v: FormValues) => {
    const id = saveCustomer({ id: customer?.id, name: v.name, phone: v.phone || undefined, archived: customer?.archived ?? false })
    toast.success(customer ? t("Customer updated") : t("Customer created"))
    if (onSaved) onSaved(id)
    else router.push(`/customers/${id}`)
  }

  const fields = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("Full name")} htmlFor="name" error={errors.name?.message} required>
        <Input id="name" {...register("name")} aria-invalid={!!errors.name} autoFocus={variant === "dialog"} />
      </Field>
      <Field label={t("Phone")} htmlFor="phone" error={errors.phone?.message}>
        <Input id="phone" type="tel" inputMode="tel" dir="ltr" className="text-end" {...register("phone")} aria-invalid={!!errors.phone} />
      </Field>
    </div>
  )

  if (variant === "dialog") {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        {fields}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("Cancel")}
          </Button>
          <Button type="submit">
            <Save /> {t("Save customer")}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-5" noValidate>
      <PageHeader
        backHref={customer ? `/customers/${customer.id}` : "/customers"}
        title={customer ? t("Edit {name}", { name: customer.name }) : t("New customer")}
        description={customer ? undefined : t("Add someone you'll send invoices to.")}
        actions={
          <Button type="submit">
            <Save /> {customer ? t("Save changes") : t("Create customer")}
          </Button>
        }
      />
      <FormSection title={t("Customer")}>{fields}</FormSection>
    </form>
  )
}
