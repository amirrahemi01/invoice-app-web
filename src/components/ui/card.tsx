import type React from "react"
interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = "" }: CardProps) {
  return <div className={`bg-white rounded-lg border border-border p-6 shadow-sm ${className}`}>{children}</div>
}

export function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`mb-4 pb-4 border-b border-border ${className}`}>{children}</div>
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={className}>{children}</div>
}

export function CardTitle({ children, className = "" }: CardProps) {
  return <h3 className={`text-lg font-semibold text-foreground ${className}`}>{children}</h3>
}
