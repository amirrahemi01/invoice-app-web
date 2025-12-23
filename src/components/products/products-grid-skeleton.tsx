import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function ProductsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader className="flex flex-row items-start gap-3 pb-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-28" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
