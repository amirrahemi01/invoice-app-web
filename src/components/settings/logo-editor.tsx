"use client"

import { useEffect, useRef, useState } from "react"
import type React from "react"
import { Maximize, Minimize, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

// Square (1:1) logo editor: drag to position, zoom, rotate, pick a background,
// then export a 512×512 PNG. Pure canvas, no dependencies.

const FRAME = 280
const OUTPUT = 512

type Background = "transparent" | "white" | "black"

interface View {
  scale: number
  x: number
  y: number
  rotation: 0 | 90 | 180 | 270
}

export function readFileAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function LogoEditor({
  src,
  open,
  onOpenChange,
  onSave,
}: {
  src: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dataUrl: string) => void
}) {
  const { t } = useT()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t("Edit logo")}</DialogTitle>
          <DialogDescription>{t("Drag to position and zoom to fit. Your logo is saved as a square image.")}</DialogDescription>
        </DialogHeader>
        {src && <Editor key={src} src={src} onCancel={() => onOpenChange(false)} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function Editor({ src, onCancel, onSave }: { src: string; onCancel: () => void; onSave: (dataUrl: string) => void }) {
  const { t } = useT()
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState(false)
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0, rotation: 0 })
  const [background, setBackground] = useState<Background>("transparent")
  const [padding, setPadding] = useState(8)
  const drag = useRef<{ id: number; startX: number; startY: number; x: number; y: number } | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<(factor: number) => void>(() => {})

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
      // Start with the whole logo visible ("fit").
      setView({ scale: fitScale(img, 0), x: 0, y: 0, rotation: 0 })
    }
    img.onerror = () => setError(true)
    img.src = src
  }, [src])

  const rotated = (rotation: number) => rotation === 90 || rotation === 270
  const dims = (img: HTMLImageElement, rotation: number) =>
    rotated(rotation) ? { w: img.naturalHeight || 1, h: img.naturalWidth || 1 } : { w: img.naturalWidth || 1, h: img.naturalHeight || 1 }
  function fitScale(img: HTMLImageElement, rotation: number) {
    const { w, h } = dims(img, rotation)
    return FRAME / Math.max(w, h)
  }
  function fillScale(img: HTMLImageElement, rotation: number) {
    const { w, h } = dims(img, rotation)
    return FRAME / Math.min(w, h)
  }

  const minScale = image ? fitScale(image, view.rotation) * 0.25 : 0.01
  const maxScale = image ? fillScale(image, view.rotation) * 4 : 10

  const clampOffset = (v: View): View => {
    if (!image) return v
    const { w, h } = dims(image, v.rotation)
    // Keep at least a sliver of the image inside the frame.
    const limitX = (w * v.scale + FRAME) / 2 - 16
    const limitY = (h * v.scale + FRAME) / 2 - 16
    return { ...v, x: Math.max(-limitX, Math.min(limitX, v.x)), y: Math.max(-limitY, Math.min(limitY, v.y)) }
  }

  // Zoom around the frame center: scale the offset too, so whatever is centered stays centered.
  const setScale = (scale: number) =>
    setView((v) => {
      const next = Math.max(minScale, Math.min(maxScale, scale))
      const f = next / v.scale
      return clampOffset({ ...v, scale: next, x: v.x * f, y: v.y * f })
    })
  const zoomBy = (factor: number) => setScale(view.scale * factor)
  const rotate = (delta: 90 | -90) =>
    setView((v) => {
      const rotation = (((v.rotation + delta) % 360) + 360) % 360 as View["rotation"]
      return clampOffset({ ...v, rotation, x: v.y * (delta === 90 ? -1 : 1), y: v.x * (delta === 90 ? 1 : -1) })
    })
  const fit = () => image && setView((v) => ({ ...v, scale: fitScale(image, v.rotation) * (1 - padding / 50), x: 0, y: 0 }))
  const fill = () => image && setView((v) => ({ ...v, scale: fillScale(image, v.rotation), x: 0, y: 0 }))

  const onPointerDown = (e: React.PointerEvent) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Some synthetic/legacy pointers can't be captured; dragging still works inside the frame.
    }
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, x: view.x, y: view.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    setView((v) => clampOffset({ ...v, x: d.x + e.clientX - d.startX, y: d.y + e.clientY - d.startY }))
  }
  const onPointerUp = () => {
    drag.current = null
  }
  useEffect(() => {
    zoomRef.current = zoomBy
  })
  // Native non-passive listener so wheel-zooming doesn't also scroll the dialog.
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomRef.current(e.deltaY < 0 ? 1.08 : 1 / 1.08)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [error])
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (moves[e.key]) {
      e.preventDefault()
      const [dx, dy] = moves[e.key]
      setView((v) => clampOffset({ ...v, x: v.x + dx, y: v.y + dy }))
    } else if (e.key === "+" || e.key === "=") zoomBy(1.1)
    else if (e.key === "-") zoomBy(1 / 1.1)
  }

  const render = (size: number) => {
    if (!image) return ""
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return ""
    if (background !== "transparent") {
      ctx.fillStyle = background === "white" ? "#ffffff" : "#000000"
      ctx.fillRect(0, 0, size, size)
    }
    const k = size / FRAME
    ctx.imageSmoothingQuality = "high"
    ctx.translate(size / 2 + view.x * k, size / 2 + view.y * k)
    ctx.rotate((view.rotation * Math.PI) / 180)
    ctx.scale(view.scale * k, view.scale * k)
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
    return canvas.toDataURL("image/png")
  }

  const frameBackground =
    background === "white"
      ? "#ffffff"
      : background === "black"
        ? "#000000"
        : "repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 50% / 16px 16px"

  if (error) {
    return <p className="py-8 text-center text-sm text-destructive">{t("This image couldn't be opened. Try a PNG, JPG or SVG file.")}</p>
  }

  const zoomPct = image ? Math.round((view.scale / fitScale(image, view.rotation)) * 100) : 100

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="mx-auto">
          <div
            role="application"
            aria-label={t("Logo crop area. Drag or use arrow keys to move, plus and minus to zoom.")}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            ref={frameRef}
            onKeyDown={onKeyDown}
            className="relative cursor-grab touch-none overflow-hidden rounded-lg ring-1 ring-border select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
            style={{ width: FRAME, height: FRAME, background: frameBackground }}
          >
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
                style={{
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                  transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) rotate(${view.rotation}deg) scale(${view.scale})`,
                }}
              />
            )}
            {/* Thirds grid as a positioning aid */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40" aria-hidden>
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="border-[0.5px] border-dashed border-slate-400/70" />
              ))}
            </div>
          </div>
          <p className="mt-1.5 text-center text-xs text-muted-foreground">{t("Square 1:1 · saved at {size}×{size}px", { size: OUTPUT })}</p>
        </div>

        <div className="grid content-start gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">{t("Zoom")}</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon-sm" onClick={() => zoomBy(1 / 1.15)} aria-label={t("Zoom out")}>
                <ZoomOut />
              </Button>
              <input
                type="range"
                aria-label={t("Zoom")}
                className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary"
                min={Math.log(minScale)}
                max={Math.log(maxScale)}
                step={0.01}
                value={Math.log(view.scale)}
                onChange={(e) => setScale(Math.exp(Number(e.target.value)))}
              />
              <Button type="button" variant="outline" size="icon-sm" onClick={() => zoomBy(1.15)} aria-label={t("Zoom in")}>
                <ZoomIn />
              </Button>
            </div>
            <p className="tabular mt-1 text-xs text-muted-foreground">{t("{pct}% of fit", { pct: zoomPct })}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={fit}>
              <Minimize /> {t("Fit")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={fill}>
              <Maximize /> {t("Fill")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => rotate(-90)}>
              <RotateCcw /> {t("Left")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => rotate(90)}>
              <RotateCw /> {t("Right")}
            </Button>
          </div>

          <div>
            <label htmlFor="logo-padding" className="mb-2 block text-sm font-medium">
              {t("Padding for “Fit”")}
            </label>
            <input
              id="logo-padding"
              type="range"
              className="h-1.5 w-full cursor-pointer accent-primary"
              min={0}
              max={25}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              onPointerUp={fit}
              onKeyUp={fit}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t("Background")}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Background")}>
              {(["transparent", "white", "black"] as Background[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={background === b}
                  onClick={() => setBackground(b)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize",
                    background === b ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "hover:bg-muted",
                  )}
                >
                  <span
                    className="size-3.5 rounded-sm ring-1 ring-border"
                    style={{
                      background:
                        b === "white" ? "#fff" : b === "black" ? "#000" : "repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 50% / 6px 6px",
                    }}
                  />
                  {t(b === "transparent" ? "None" : b === "white" ? "White" : "Black")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t("Preview")}</p>
            <div className="flex items-end gap-3">
              {[56, 32, 24].map((size) => (
                <div
                  key={size}
                  className="overflow-hidden rounded-md bg-white ring-1 ring-border"
                  style={{ width: size, height: size }}
                  title={`${size}px`}
                >
                  <div
                    className="relative"
                    style={{ width: FRAME, height: FRAME, transform: `scale(${size / FRAME})`, transformOrigin: "0 0", background: background === "black" ? "#000" : undefined }}
                  >
                    {image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt=""
                        className="absolute top-1/2 left-1/2 max-w-none"
                        style={{
                          width: image.naturalWidth,
                          height: image.naturalHeight,
                          transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) rotate(${view.rotation}deg) scale(${view.scale})`,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Cancel")}
        </Button>
        <Button
          type="button"
          disabled={!image}
          onClick={() => {
            const url = render(OUTPUT)
            if (url) onSave(url)
          }}
        >
          {t("Use this logo")}
        </Button>
      </DialogFooter>
    </div>
  )
}
