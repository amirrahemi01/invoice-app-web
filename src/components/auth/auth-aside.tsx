"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { useT } from "@/lib/i18n"

const points = [
  "Invoices from your saved products in seconds",
  "Automatic tax, discounts and numbering",
  "Track payments and overdue balances",
  "PDF, image, Excel and CSV exports",
]

export function AuthAside() {
  const { t, n } = useT()
  return (
    <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
      <div className="absolute -end-24 -top-24 size-96 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <div className="absolute -bottom-32 -start-16 size-96 rounded-full bg-black/10 blur-2xl" aria-hidden />
      <Link href="/" className="relative flex items-center gap-2.5 text-lg font-semibold">
        <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
          <BrandMark className="size-5" />
        </span>
        {t("Belami Invoice")}
      </Link>
      <div className="relative mt-auto max-w-md">
        <h2 className="text-3xl font-semibold tracking-tight">{t("Get paid faster, with less paperwork.")}</h2>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 text-primary-foreground/90">
              <CheckCircle2 className="size-5 shrink-0" /> {t(p)}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative mt-10 text-sm text-primary-foreground/70">© {n(new Date().getFullYear()).replace(/[,٬]/g, "")} {t("Belami Studio")}</p>
    </aside>
  )
}

export function AuthBrand() {
  const { t } = useT()
  return (
    <Link href="/" className="mb-8 flex items-center gap-2 font-semibold lg:hidden">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BrandMark className="size-4" />
      </span>
      {t("Belami Invoice")}
    </Link>
  )
}
