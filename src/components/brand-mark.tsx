import { cn } from "@/lib/utils"

/** Logo mark: stacked concrete blocks, for the brand tile in the sidebar and sign-in pages. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("size-5", className)} aria-hidden>
      <path d="M12 2.5 20 7v5l-8 4.5L4 12V7l8-4.5Z" fill="currentColor" fillOpacity=".95" />
      <path d="M4 12v5l8 4.5V16.5L4 12Z" fill="currentColor" fillOpacity=".55" />
      <path d="M20 12v5l-8 4.5V16.5L20 12Z" fill="currentColor" fillOpacity=".3" />
      <path d="M12 2.5 20 7l-8 4.5L4 7l8-4.5Z" fill="#fff" fillOpacity=".28" />
    </svg>
  )
}
