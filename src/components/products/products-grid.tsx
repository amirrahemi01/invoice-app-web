"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Copy, Trash2, Package } from "lucide-react"

const products = [
  {
    id: "1",
    name: "Web Design",
    description: "Professional website design services",
    price: 1500,
    category: "Services",
    usageCount: 45,
  },
  {
    id: "2",
    name: "Development",
    description: "Custom web and mobile development",
    price: 2500,
    category: "Services",
    usageCount: 32,
  },
  {
    id: "3",
    name: "Consulting",
    description: "Hourly consulting and advisory",
    price: 150,
    category: "Services",
    usageCount: 128,
  },
  {
    id: "4",
    name: "Maintenance",
    description: "Monthly maintenance package",
    price: 500,
    category: "Services",
    usageCount: 67,
  },
  {
    id: "5",
    name: "Logo Design",
    description: "Brand identity and logo design",
    price: 800,
    category: "Services",
    usageCount: 23,
  },
  {
    id: "6",
    name: "SEO Package",
    description: "Search engine optimization services",
    price: 1200,
    category: "Services",
    usageCount: 18,
  },
]

export function ProductsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">{product.name}</CardTitle>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {product.category}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/products/${product.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <span className="text-lg font-semibold">${product.price.toLocaleString("en-US")}</span>
            <span className="text-sm text-muted-foreground">Used in {product.usageCount} invoices</span>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
