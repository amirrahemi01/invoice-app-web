"use client"

// The app is Persian-only. Source strings stay English (they are the lookup
// keys); everything shown to the user is translated through t().
// Placeholders: t("{n} selected", { n: 3 }). Number values get Persian digits.

import { useCallback, useEffect } from "react"
import { fa, faPatterns } from "./fa"

export type UiLang = "fa"

export type Vars = Record<string, string | number>
export type TFunction = (key: string, vars?: Vars) => string

const numberFormat = new Intl.NumberFormat("fa-IR")

function interpolate(text: string, vars?: Vars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const v = vars[name]
    if (v === undefined) return match
    return typeof v === "number" ? numberFormat.format(v) : String(v)
  })
}

export function translate(key: string, vars?: Vars) {
  return interpolate(fa[key] ?? key, vars)
}

/** Translates stored English activity messages like "INV-2026-0001 issued to Acme". */
export function translateMessage(message: string) {
  for (const [re, make] of faPatterns) {
    const m = message.match(re)
    if (m) return make(m)
  }
  return message
}

export function useT() {
  const t = useCallback<TFunction>((key, vars) => translate(key, vars), [])
  const n = useCallback((value: number) => numberFormat.format(value), [])
  return { t, n, lang: "fa" as const, dir: "rtl" as const }
}

/** Keeps <html lang dir> Persian and right-to-left. */
export function I18nSync() {
  useEffect(() => {
    document.documentElement.lang = "fa"
    document.documentElement.dir = "rtl"
  }, [])
  return null
}
