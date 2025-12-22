import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-foreground">{label}</label>}
        <input
          ref={ref}
          className={`px-3 py-2 text-sm bg-input-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className} ${error ? "border-destructive" : ""}`}
          {...props}
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    )
  },
)

Input.displayName = "Input"
