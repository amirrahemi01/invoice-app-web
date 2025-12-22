import React from "react"

interface Option {
  value: string | number
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options?: Option[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options = [], placeholder, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-foreground">{label}</label>}
        <select
          ref={ref}
          className={`px-3 py-2 text-sm bg-input-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className} ${error ? "border-destructive" : ""}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    )
  },
)

Select.displayName = "Select"
