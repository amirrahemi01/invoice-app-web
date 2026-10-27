"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

// Minimal portal popover anchored to a trigger element. Rendered in a portal
// with fixed positioning so it is never clipped by scrolling tables or cards.

interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
  className?: string
  minWidth?: number
  align?: "start" | "end"
}

export function Popover({ open, onOpenChange, anchorRef, children, className, minWidth = 280, align = "start" }: PopoverProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [style, setStyle] = React.useState<React.CSSProperties>({ visibility: "hidden" })

  React.useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = anchorRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const width = Math.min(Math.max(rect.width, minWidth), window.innerWidth - 16)
      const panelHeight = panelRef.current?.offsetHeight ?? 300
      const below = window.innerHeight - rect.bottom
      const top = below < panelHeight + 12 && rect.top > below ? rect.top - panelHeight - 4 : rect.bottom + 4
      let left = align === "end" ? rect.right - width : rect.left
      left = Math.min(Math.max(8, left), window.innerWidth - width - 8)
      setStyle({ position: "fixed", top, left, width, visibility: "visible" })
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open, anchorRef, minWidth, align])

  React.useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onOpenChange(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        onOpenChange(false)
        anchorRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open, onOpenChange, anchorRef])

  if (!open || typeof document === "undefined") return null
  return createPortal(
    <div
      ref={panelRef}
      style={style}
      className={cn(
        "z-50 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  )
}
