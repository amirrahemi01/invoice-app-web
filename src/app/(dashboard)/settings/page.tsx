import { Suspense } from "react"
import type { Metadata } from "next"
import { SettingsView } from "@/components/settings/settings-view"

export const metadata: Metadata = { title: "تنظیمات" }

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsView />
    </Suspense>
  )
}
