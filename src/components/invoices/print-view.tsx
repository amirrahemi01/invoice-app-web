"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDB } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { InvoiceDocument } from "./invoice-document"

/** Bare A4 page for printing or "Save as PDF". */
export function PrintView({ id, autoPrint }: { id: string; autoPrint: boolean }) {
  const db = useDB()
  const invoice = db?.invoices.find((i) => i.id === id)
  const { t } = useT()

  useEffect(() => {
    if (!invoice) return
    document.title = invoice.number ?? t("Draft invoice")
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [invoice, autoPrint, t])

  if (!db) return null
  if (!invoice) return <p className="p-10 text-center text-muted-foreground">{t("Invoice not found.")}</p>

  return (
    <div className="min-h-dvh bg-muted/60 print:bg-white">
      <div className="no-print sticky top-0 z-10 flex items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <Button variant="ghost" asChild>
          <Link href={`/invoices/${invoice.id}`}>
            <ArrowLeft className="rtl:rotate-180" /> {t("Back")}
          </Link>
        </Button>
        <p className="hidden text-sm text-muted-foreground sm:block">{t("Tip: choose “Save as PDF” as the destination and turn off headers and footers.")}</p>
        <Button className="ms-auto" onClick={() => window.print()}>
          <Printer /> {t("Print / Save PDF")}
        </Button>
      </div>
      <div className="overflow-x-auto py-8 print:p-0">
        <InvoiceDocument invoice={invoice} settings={db.settings} className="mx-auto shadow-xl print:shadow-none" />
      </div>
    </div>
  )
}
