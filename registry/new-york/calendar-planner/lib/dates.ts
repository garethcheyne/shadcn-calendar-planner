/**
 * Date arithmetic utilities for the calendar.
 * Pure TypeScript — no external date-arithmetic dependency.
 * All operations use native Date and are timezone-aware.
 */

const MILLI = {
  seconds: 1000,
  minutes: 1000 * 60,
  hours: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24,
} as const

// ─── Start/End of unit ────────────────────────────────────────────────
export function startOf(date: Date, unit: string, firstOfWeek?: number): Date {
  const d = new Date(date)
  switch (unit) {
    case "year":
      d.setMonth(0, 1)
      d.setHours(0, 0, 0, 0)
      return d
    case "month":
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
      return d
    case "week": {
      const day = d.getDay()
      const fow = firstOfWeek ?? 0
      const diff = (day - fow + 7) % 7
      d.setDate(d.getDate() - diff)
      d.setHours(0, 0, 0, 0)
      return d
    }
    case "day":
    case "date":
      d.setHours(0, 0, 0, 0)
      return d
    case "hours":
      d.setMinutes(0, 0, 0)
      return d
    case "minutes":
      d.setSeconds(0, 0)
      return d
    case "seconds":
      d.setMilliseconds(0)
      return d
    default:
      return d
  }
}

export function endOf(date: Date, unit: string, firstOfWeek?: number): Date {
  const d = new Date(date)
  switch (unit) {
    case "year":
      d.setMonth(11, 31)
      d.setHours(23, 59, 59, 999)
      return d
    case "month":
      d.setMonth(d.getMonth() + 1, 0)
      d.setHours(23, 59, 59, 999)
      return d
    case "week": {
      const s = startOf(d, "week", firstOfWeek)
      s.setDate(s.getDate() + 6)
      s.setHours(23, 59, 59, 999)
      return s
    }
    case "day":
    case "date":
      d.setHours(23, 59, 59, 999)
      return d
    case "hours":
      d.setMinutes(59, 59, 999)
      return d
    case "minutes":
      d.setSeconds(59, 999)
      return d
    case "seconds":
      d.setMilliseconds(999)
      return d
    default:
      return d
  }
}

// ─── Add ──────────────────────────────────────────────────────────────
export function add(date: Date, amount: number, unit: string): Date {
  const d = new Date(date)
  switch (unit) {
    case "year":
      d.setFullYear(d.getFullYear() + amount)
      return d
    case "month":
      d.setMonth(d.getMonth() + amount)
      return d
    case "week":
      d.setDate(d.getDate() + 7 * amount)
      return d
    case "day":
    case "date":
      d.setDate(d.getDate() + amount)
      return d
    case "hours":
      d.setHours(d.getHours() + amount)
      return d
    case "minutes":
      d.setMinutes(d.getMinutes() + amount)
      return d
    case "seconds":
      d.setSeconds(d.getSeconds() + amount)
      return d
    case "milliseconds":
      d.setMilliseconds(d.getMilliseconds() + amount)
      return d
    default:
      return d
  }
}

// ─── Comparison ───────────────────────────────────────────────────────
export function eq(a: Date, b: Date, unit?: string): boolean {
  if (!unit) return +a === +b
  return +startOf(a, unit) === +startOf(b, unit)
}

export function neq(a: Date, b: Date, unit?: string): boolean {
  return !eq(a, b, unit)
}

export function gt(a: Date, b: Date, unit?: string): boolean {
  if (!unit) return +a > +b
  return +startOf(a, unit) > +startOf(b, unit)
}

export function gte(a: Date, b: Date, unit?: string): boolean {
  if (!unit) return +a >= +b
  return +startOf(a, unit) >= +startOf(b, unit)
}

export function lt(a: Date, b: Date, unit?: string): boolean {
  if (!unit) return +a < +b
  return +startOf(a, unit) < +startOf(b, unit)
}

export function lte(a: Date, b: Date, unit?: string): boolean {
  if (!unit) return +a <= +b
  return +startOf(a, unit) <= +startOf(b, unit)
}

export function inRange(day: Date, min: Date, max: Date, unit?: string): boolean {
  return gte(day, min, unit) && lte(day, max, unit)
}

export function min(a: Date, b: Date): Date {
  return +a < +b ? a : b
}

export function max(a: Date, b: Date): Date {
  return +a > +b ? a : b
}

// ─── Diff / Duration ──────────────────────────────────────────────────
export function diff(dateA: Date, dateB: Date, unit?: string): number {
  if (!unit || unit === "milliseconds") return Math.abs(+dateA - +dateB)
  const key = unit === "date" ? "day" : unit
  if (key in MILLI) {
    return Math.round(
      Math.abs(+startOf(dateA, unit) / MILLI[key as keyof typeof MILLI] - +startOf(dateB, unit) / MILLI[key as keyof typeof MILLI])
    )
  }
  if (unit === "month") {
    return Math.abs(
      (dateA.getFullYear() - dateB.getFullYear()) * 12 + dateA.getMonth() - dateB.getMonth()
    )
  }
  if (unit === "year") {
    return Math.abs(dateA.getFullYear() - dateB.getFullYear())
  }
  return Math.abs(+dateA - +dateB)
}

export function duration(start: Date, end: Date, unit: string): number {
  if (unit === "day") {
    return Math.abs(
      Math.round((+startOf(end, "day") - +startOf(start, "day")) / MILLI.day)
    )
  }
  return diff(start, end, unit)
}

// ─── Ceil ─────────────────────────────────────────────────────────────
export function ceil(date: Date, unit: string): Date {
  const floor = startOf(date, unit)
  return eq(floor, date) ? floor : add(floor, 1, unit)
}

// ─── Range ────────────────────────────────────────────────────────────
export function range(start: Date, end: Date, unit: string = "day"): Date[] {
  let current = new Date(start)
  const result: Date[] = []
  while (lte(current, end, unit)) {
    result.push(new Date(current))
    current = add(current, 1, unit)
  }
  return result
}

// ─── Merge (date part + time part) ────────────────────────────────────
export function merge(date: Date | null, time: Date | null): Date | null {
  if (time == null && date == null) return null
  const t = time ?? new Date()
  const d = date ?? new Date()
  const result = startOf(d, "day")
  result.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds())
  return result
}

// ─── Getters ──────────────────────────────────────────────────────────
export function minutes(date: Date): number {
  return date.getMinutes()
}

export function hours(date: Date): number {
  return date.getHours()
}

// ─── Visibility helpers ───────────────────────────────────────────────
export function firstVisibleDay(date: Date, startOfWeekDay: number): Date {
  const firstOfMonth = startOf(date, "month")
  return startOf(firstOfMonth, "week", startOfWeekDay)
}

export function lastVisibleDay(date: Date, startOfWeekDay: number): Date {
  const endOfMonth = endOf(date, "month")
  return endOf(endOfMonth, "week", startOfWeekDay)
}

export function visibleDays(date: Date, startOfWeekDay: number): Date[] {
  const first = firstVisibleDay(date, startOfWeekDay)
  const last = lastVisibleDay(date, startOfWeekDay)
  return range(first, last, "day")
}

// ─── Zero-time checks ────────────────────────────────────────────────
export function isJustDate(date: Date): boolean {
  return (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  )
}

export function eqTime(a: Date, b: Date): boolean {
  return a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes() && a.getSeconds() === b.getSeconds()
}

// ─── Today helpers ────────────────────────────────────────────────────
export function today(): Date {
  return startOf(new Date(), "day")
}

export function tomorrow(): Date {
  return add(today(), 1, "day")
}

export function yesterday(): Date {
  return add(today(), -1, "day")
}
