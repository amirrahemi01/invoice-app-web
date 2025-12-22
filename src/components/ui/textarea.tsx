import React from "react"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-foreground">{label}</label>}
        <textarea
          ref={ref}
          className={`px-3 py-2 text-sm bg-input-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${className} ${error ? "border-destructive" : ""}`}
          {...props}
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
        {helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
      </div>
    )
  },
)

Textarea.displayName = "Textarea"
