"use client"

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const data = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 3000 },
  { month: "Mar", revenue: 5000 },
  { month: "Apr", revenue: 4500 },
  { month: "May", revenue: 6000 },
  { month: "Jun", revenue: 5500 },
  { month: "Jul", revenue: 7000 },
  { month: "Aug", revenue: 6500 },
  { month: "Sep", revenue: 8000 },
  { month: "Oct", revenue: 7500 },
  { month: "Nov", revenue: 9000 },
  { month: "Dec", revenue: 8500 },
]

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value / 1000}k`}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
