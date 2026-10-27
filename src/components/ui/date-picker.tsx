"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover } from "@/components/ui/popover"
import { useData } from "@/lib/hooks"
import { formatDate, parseISODate, todayISO, toISODate } from "@/lib/format"
import { isJalaliLeap, jalaliMonthLength, toGregorian, toJalali } from "@/lib/jalali"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

// A date picker that follows the calendar chosen in Settings: it shows and lets
// you pick dates in Solar Hijri (default) or Gregorian. Values are ISO strings.

type Cal = "persian" | "gregorian"
interface Ymd {
  y: number
  m: number
  d: number
}

const fromISO = (iso: string, cal: Cal): Ymd => {
  const [gy, gm, gd] = iso.split("-").map(Number)
  if (cal === "gregorian") return { y: gy, m: gm, d: gd }
  const j = toJalali(gy, gm, gd)
  return { y: j.jy, m: j.jm, d: j.jd }
}

const toISO = ({ y, m, d }: Ymd, cal: Cal) => {
  if (cal === "gregorian") return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  const g = toGregorian(y, m, d)
  return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`
}

const monthLength = (y: number, m: number, cal: Cal) =>
  cal === "persian" ? jalaliMonthLength(y, m) : new Date(y, m, 0).getDate()

/** Column of the 1st of the month: Saturday-first for Solar Hijri, Sunday-first for Gregorian. */
const startOffset = (y: number, m: number, cal: Cal) => {
  const day = parseISODate(toISO({ y, m, d: 1 }, cal)).getDay()
  return cal === "persian" ? (day + 1) % 7 : day
}

const WEEK_PERSIAN = ["ش", "ی", "د", "س", "چ", "پ", "ج"]
const WEEK_GREGORIAN = ["ی", "د", "س", "چ", "پ", "ج", "ش"]

const faNum = new Intl.NumberFormat("fa-IR", { useGrouping: false })

function monthName(y: number, m: number, cal: Cal) {
  const iso = toISO({ y, m, d: 1 }, cal)
  const loc = cal === "persian" ? "fa-IR-u-ca-persian" : "fa-IR-u-ca-gregory"
  return new Intl.DateTimeFormat(loc, { month: "long" }).format(parseISODate(iso))
}

interface DatePickerProps {
  value: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  id?: string
  invalid?: boolean
  /** Render the calendar in the page flow instead of a floating panel (use inside dialogs). */
  inline?: boolean
  className?: string
}

export function DatePicker({ value, onChange, min, max, id, invalid, inline, className }: DatePickerProps) {
  const { settings } = useData()
  const cal: Cal = settings.locale.calendar
  const { t } = useT()
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const shown = fromISO(value || todayISO(), cal)
  const [view, setView] = React.useState({ y: shown.y, m: shown.m })
  const [mode, setMode] = React.useState<"days" | "months" | "years">("days")

  const toggle = () => {
    if (!open) {
      setView({ y: shown.y, m: shown.m })
      setMode("days")
    }
    setOpen((o) => !o)
  }
  // Arrows step a month (days), a year (months) or a block of 12 years (years).
  const move = (delta: number) => {
    if (mode === "months") return setView(({ y, m }) => ({ y: y + delta, m }))
    if (mode === "years") return setView(({ y, m }) => ({ y: y + delta * 12, m }))
    setView(({ y, m }) => {
      let nm = m + delta
      let ny = y
      if (nm < 1) {
        nm = 12
        ny -= 1
      } else if (nm > 12) {
        nm = 1
        ny += 1
      }
      return { y: ny, m: nm }
    })
  }
  const yearStart = view.y - (((view.y % 12) + 12) % 12)

  const pick = (iso: string) => {
    onChange(iso)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const today = todayISO()
  const days = monthLength(view.y, view.m, cal)
  const offset = startOffset(view.y, view.m, cal)
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]

  const panel = (
    <div className="w-[19.5rem] max-w-full p-3" role="dialog" aria-label={t("Choose date")}>
      <div className="mb-2 flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(1)} aria-label={t("Next month")}>
          <ChevronLeft className="rtl:rotate-0" />
        </Button>
        <div className="flex items-center gap-1 text-sm font-semibold">
          {mode === "years" ? (
            <span className="tabular px-2 py-1">
              {faNum.format(yearStart)} – {faNum.format(yearStart + 11)}
            </span>
          ) : (
            <>
              <button type="button" onClick={() => setMode(mode === "months" ? "days" : "months")} className="rounded-md px-2 py-1 hover:bg-accent" aria-label={t("Choose month")}>
                {monthName(view.y, view.m, cal)}
              </button>
              <button type="button" onClick={() => setMode("years")} className="tabular rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={t("Choose year")}>
                {faNum.format(view.y)}
              </button>
            </>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(-1)} aria-label={t("Previous month")}>
          <ChevronRight className="rtl:rotate-0" />
        </Button>
      </div>
      {mode === "months" && (
        <div className="grid grid-cols-3 gap-2 py-1" role="grid">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setView((v) => ({ ...v, m }))
                setMode("days")
              }}
              className={cn(
                "rounded-lg py-3 text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                m === view.m && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                m !== view.m && m === shown.m && view.y === shown.y && "ring-1 ring-primary/60",
              )}
            >
              {monthName(view.y, m, cal)}
            </button>
          ))}
        </div>
      )}
      {mode === "years" && (
        <div className="grid grid-cols-3 gap-2 py-1" role="grid">
          {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setView((v) => ({ ...v, y }))
                setMode("months")
              }}
              className={cn(
                "tabular rounded-lg py-3 text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                y === view.y && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                y !== view.y && y === shown.y && "ring-1 ring-primary/60",
              )}
            >
              {faNum.format(y)}
            </button>
          ))}
        </div>
      )}
      {mode === "days" && (
        <>
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {(cal === "persian" ? WEEK_PERSIAN : WEEK_GREGORIAN).map((w, i) => (
          <span key={i} className={cn("py-1.5", ((cal === "persian" && i === 6) || (cal === "gregorian" && i === 5)) && "text-destructive/80")}>
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1" role="grid">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />
          const iso = toISO({ y: view.y, m: view.m, d }, cal)
          const selected = iso === value
          const disabled = (!!min && iso < min) || (!!max && iso > max)
          const col = i % 7
          const holiday = (cal === "persian" && col === 6) || (cal === "gregorian" && col === 5)
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              aria-selected={selected}
              disabled={disabled}
              onClick={() => pick(iso)}
              className={cn(
                "tabular mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors",
                "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                holiday && "text-destructive/80",
                iso === today && !selected && "ring-1 ring-primary/60 font-semibold",
                selected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                disabled && "pointer-events-none opacity-30",
              )}
            >
              {faNum.format(d)}
            </button>
          )
        })}
      </div>
        </>
      )}
      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <Button type="button" variant="ghost" size="sm" disabled={(!!min && today < min) || (!!max && today > max)} onClick={() => pick(today)}>
          {t("Today")}
        </Button>
        <span className="text-xs text-muted-foreground">{cal === "persian" ? t("Solar Hijri (Jalali)") : t("Gregorian")}</span>
      </div>
    </div>
  )

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-start text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30",
          className,
        )}
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value ? formatDate(value, { locale: "fa-IR", calendar: cal, style: "long" }) : t("Choose date")}
        </span>
        <CalendarDays className="size-4 shrink-0 opacity-60" />
      </button>
      {inline ? (
        open && <div className="mt-2 w-fit rounded-lg border bg-popover shadow-sm">{panel}</div>
      ) : (
        <Popover open={open} onOpenChange={setOpen} anchorRef={triggerRef} minWidth={312}>
          {panel}
        </Popover>
      )}
    </>
  )
}
