"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Trash2 } from "lucide-react"
import { useState } from "react"

export function InvoicesFilters() {
  const [selectedCount, setSelectedCount] = useState(0)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search invoices..." className="pl-8" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
          <Filter className="h-4 w-4" />
          <span className="sr-only">More filters</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive bg-transparent">
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
