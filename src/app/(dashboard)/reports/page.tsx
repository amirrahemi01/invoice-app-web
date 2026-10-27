import { Suspense } from "react"
import type { Metadata } from "next"
import { ReportsView } from "@/components/reports/reports-view"

export const metadata: Metadata = { title: "گزارش‌ها" }

export default function ReportsPage() {
  return (
    <Suspense>
      <ReportsView />
    </Suspense>
  )
}
