import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

/** Product photo with a neutral placeholder. Plain <img>: photos live in /public or are data URLs. */
export function ProductImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <ImageOff className="size-1/3 text-muted-foreground/50" aria-hidden />
      )}
    </div>
  )
}

/** Downscale an uploaded photo to a JPEG data URL (max 900px). */
export async function readProductPhoto(file: File, max = 900): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas")
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}
