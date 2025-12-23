"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Upload } from "lucide-react"

export function CustomersFilters() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder="Search customers..." className="pl-8" />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Upload className="mr-1.5 h-4 w-4" />
          Import CSV
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-1.5 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  )
}
