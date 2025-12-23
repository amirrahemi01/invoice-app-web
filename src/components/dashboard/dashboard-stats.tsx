import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, DollarSign, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1% from last month",
    icon: DollarSign,
  },
  {
    title: "Invoices",
    value: "2,350",
    change: "+180 this month",
    icon: FileText,
  },
  {
    title: "Active Customers",
    value: "573",
    change: "+12 new this week",
    icon: Users,
  },
  {
    title: "Pending Amount",
    value: "$12,234.00",
    change: "23 invoices pending",
    icon: TrendingUp,
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
