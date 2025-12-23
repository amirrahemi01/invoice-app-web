import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import { RevenueChart } from "@/components/dashboard/revenue-chart"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardStats />
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base font-medium">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentInvoices />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
