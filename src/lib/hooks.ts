"use client"

import { useEffect, useMemo, useState } from "react"
import { formatDate, formatMoney, formatMoneyCompact, formatNumber } from "./format"
import { useDB } from "./store"
import type { Database, ISODate } from "./types"

/** Database for components rendered inside <DataGate>. */
export function useData(): Database {
  const db = useDB()
  if (!db) throw new Error("useData must be used inside <DataGate>")
  return db
}

export function useFormat() {
  const { settings } = useData()
  // Persian digits; the calendar (Solar Hijri or Gregorian) follows Settings.
  const locale = "fa-IR"
  const calendar = settings.locale.calendar
  const currency = settings.locale.currency
  return useMemo(
    () => ({
      currency,
      locale,
      money: (amount: number, cur = currency) => formatMoney(amount, cur, locale),
      compact: (amount: number, cur = currency) => formatMoneyCompact(amount, cur, locale),
      date: (iso: ISODate | undefined | null, style: "short" | "medium" | "long" = "medium") =>
        formatDate(iso, { locale, calendar, style }),
      number: (n: number) => formatNumber(n, locale),
    }),
    [locale, currency, calendar],
  )
}

export function useDebounced<T>(value: T, delay = 200) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function usePagination<T>(items: T[], pageSize: number, resetKey: unknown) {
  const [page, setPage] = useState(1)
  const [lastKey, setLastKey] = useState(resetKey)
  if (lastKey !== resetKey) {
    setLastKey(resetKey)
    setPage(1)
  }
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount)
  return {
    page: current,
    pageCount,
    setPage,
    items: items.slice((current - 1) * pageSize, current * pageSize),
    total: items.length,
    from: items.length === 0 ? 0 : (current - 1) * pageSize + 1,
    to: Math.min(current * pageSize, items.length),
  }
}
