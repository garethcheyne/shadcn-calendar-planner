import { createElement, type ReactNode } from "react"
import type { Accessor, CalendarEvent, CalendarMessages } from "./types"

// ─── Accessor resolution ──────────────────────────────────────────────
export function accessor<TEvent, TValue>(
  data: TEvent,
  field: Accessor<TEvent, TValue>,
): TValue {
  if (typeof field === "function") {
    return (field as (event: TEvent) => TValue)(data)
  }
  if (typeof field === "string" && data != null && typeof data === "object") {
    return (data as Record<string, unknown>)[field] as TValue
  }
  return data as unknown as TValue
}

export function wrapAccessor<TEvent, TValue>(
  acc: Accessor<TEvent, TValue>,
): (data: TEvent) => TValue {
  return (data: TEvent) => accessor(data, acc)
}

// ─── Notify ───────────────────────────────────────────────────────────
export function notify<T extends unknown[]>(
  handler: ((...args: T) => void) | undefined,
  args: T,
): void {
  handler?.(...args)
}

// ─── Unique ID ────────────────────────────────────────────────────────
let idCounter = 0
export function uniqueId(prefix = ""): string {
  return `${prefix}${++idCounter}`
}

// ─── Default Messages ─────────────────────────────────────────────────
const defaultMessages: Required<CalendarMessages> = {
  date: "Date",
  time: "Time",
  event: "Event",
  allDay: "All Day",
  week: "Week",
  work_week: "Work Week",
  day: "Day",
  month: "Month",
  previous: "Back",
  next: "Next",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
  today: "Today",
  agenda: "Agenda",
  noEventsInRange: "There are no events in this range.",
  showMore: (count: number) => `+${count} more`,
}

export function mergeMessages(
  base?: Record<string, unknown>,
  custom?: Partial<CalendarMessages>,
): Required<CalendarMessages> {
  return { ...defaultMessages, ...base, ...custom } as Required<CalendarMessages>
}

// ─── Event selection check ────────────────────────────────────────────
export function isSelected<TEvent extends CalendarEvent>(
  event: TEvent,
  selected?: TEvent,
): boolean {
  if (!selected) return false
  return event === selected
}

// ─── Chunk array ──────────────────────────────────────────────────────
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

// ─── Noop wrapper ─────────────────────────────────────────────────────
export function NoopWrapper({ children }: { children: ReactNode }): ReactNode {
  return children
}
