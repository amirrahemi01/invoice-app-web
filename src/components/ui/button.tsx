import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    const baseStyles =
      "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap"

    const variants = {
      primary: "bg-primary text-white hover:bg-indigo-600 focus:ring-primary active:bg-indigo-700",
      secondary: "bg-secondary text-white hover:bg-emerald-600 focus:ring-secondary active:bg-emerald-700",
      destructive: "bg-destructive text-white hover:bg-red-500 focus:ring-destructive active:bg-red-700",
      outline: "border border-border text-foreground hover:bg-gray-50 focus:ring-primary active:bg-gray-100",
      ghost: "text-foreground hover:bg-gray-100 focus:ring-primary active:bg-gray-200",
    }

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    }

    return <button ref={ref} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  },
)

Button.displayName = "Button"
