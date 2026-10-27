import Link from "next/link"
import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "./empty-state"
import { useT } from "@/lib/i18n"

export function NotFoundCard({ what, backHref }: { what: string; backHref: string }) {
  const { t } = useT()
  return (
    <div className="rounded-xl border bg-card">
      <EmptyState
        icon={SearchX}
        title={t("{what} not found", { what: t(what) })}
        description={t("It may have been deleted, or the link is wrong.")}
        action={
          <Button asChild variant="outline">
            <Link href={backHref}>{t("Go back")}</Link>
          </Button>
        }
      />
    </div>
  )
}
