import React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
  size?: "sm" | "md"
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = "default", size = "sm", className = "", children, ...props }, ref) => {
    const variants = {
      default: "bg-primary text-white",
      secondary: "bg-secondary text-white",
      destructive: "bg-destructive text-white",
      outline: "border border-border text-foreground",
    }

    const sizes = {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1.5 text-sm",
    }

    return (
      <div
        ref={ref}
        className={`inline-block rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Badge.displayName = "Badge"
