"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Field } from "@/components/shared/field"
import { useFormat } from "@/lib/hooks"
import { useT } from "@/lib/i18n"
import { balanceDue, PAYMENT_METHOD_LABELS } from "@/lib/invoice-helpers"
import { recordPayment } from "@/lib/store"
import { todayISO } from "@/lib/format"
import { roundMoney } from "@/lib/calc"
import type { Invoice, PaymentMethod } from "@/lib/types"

export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{invoice && <PaymentForm key={invoice.id + invoice.amountPaid} invoice={invoice} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  )
}

function PaymentForm({ invoice, onDone }: { invoice: Invoice; onDone: () => void }) {
  const fmt = useFormat()
  const { t } = useT()
  const due = balanceDue(invoice)
  const [amount, setAmount] = useState(String(due))
  const [date, setDate] = useState(todayISO())
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string>()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = roundMoney(Number(amount), invoice.currency)
    if (!Number.isFinite(value) || value <= 0) return setError(t("Enter an amount greater than zero"))
    if (value > due + 0.000001) return setError(t("Amount can't exceed the balance of {amount}", { amount: fmt.money(due, invoice.currency) }))
    if (!date) return setError(t("Choose a payment date"))
    recordPayment({ invoiceId: invoice.id, amount: value, date, method, reference: reference || undefined, note: note || undefined })
    toast.success(value >= due ? t("{number} is fully paid", { number: invoice.number ?? "" }) : t("Payment of {amount} recorded", { amount: fmt.money(value, invoice.currency) }))
    onDone()
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{t("Record payment")}</DialogTitle>
        <DialogDescription>
          {invoice.number} · {invoice.customerSnapshot.name} · {t("Balance")} {fmt.money(due, invoice.currency)}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Amount ({currency})", { currency: invoice.currency })} htmlFor="pay-amount" error={error} required>
          <Input
            id="pay-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError(undefined)
            }}
            aria-invalid={!!error}
            autoFocus
          />
        </Field>
        <Field label={t("Payment date")} htmlFor="pay-date" required>
          <DatePicker id="pay-date" inline value={date} max={todayISO()} onChange={setDate} />
        </Field>
        <Field label={t("Method")} htmlFor="pay-method">
          <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <SelectTrigger id="pay-method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {t(PAYMENT_METHOD_LABELS[m])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("Reference")} htmlFor="pay-ref" hint={t("Transaction or cheque number")}>
          <Input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <Field label={t("Note")} htmlFor="pay-note" className="sm:col-span-2">
          <Textarea id="pay-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {[0.25, 0.5, 1].map((part) => (
          <Button key={part} type="button" variant="outline" size="sm" onClick={() => setAmount(String(roundMoney(due * part, invoice.currency)))}>
            {part === 1 ? t("Full balance") : `${part * 100}%`}
          </Button>
        ))}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t("Cancel")}
        </Button>
        <Button type="submit">{t("Record payment")}</Button>
      </DialogFooter>
    </form>
  )
}
