"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, LayoutGrid, List } from "lucide-react"
import { useState } from "react"

export function ProductsFilters() {
  const [view, setView] = useState<"grid" | "list">("grid")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search products..." className="pl-8" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="services">Services</SelectItem>
            <SelectItem value="physical">Physical</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
        <Button
          variant={view === "grid" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setView("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="sr-only">Grid view</span>
        </Button>
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setView("list")}
        >
          <List className="h-4 w-4" />
          <span className="sr-only">List view</span>
        </Button>
      </div>
    </div>
  )
}
