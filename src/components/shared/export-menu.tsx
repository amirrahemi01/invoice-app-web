"use client"

import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useT } from "@/lib/i18n"
import { downloadCSV, downloadXLSX, type Cell } from "@/lib/export"

export function ExportMenu({
  filename,
  sheetName,
  getRows,
  label = "Export",
  size = "default",
}: {
  filename: string
  sheetName: string
  getRows: () => Cell[][]
  label?: string
  size?: "default" | "sm"
}) {
  const { t } = useT()
  const run = (kind: "csv" | "xlsx") => {
    const rows = getRows()
    if (kind === "csv") downloadCSV(rows, `${filename}.csv`)
    else downloadXLSX([{ name: sheetName, rows, boldRows: [0] }], `${filename}.xlsx`)
    toast.success(t("Exported {n} rows", { n: rows.length - 1 }))
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size}>
          <Download />
          <span className="hidden sm:inline">{t(label)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => run("xlsx")}>
          <FileSpreadsheet /> {t("Excel (.xlsx)")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("csv")}>
          <FileText /> {t("CSV (.csv)")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
