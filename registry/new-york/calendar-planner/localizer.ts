/**
 * DateLocalizer — the core abstraction for formatting and date arithmetic.
 *
 * Each localizer adapter (date-fns, dayjs, luxon, moment) creates an
 * instance of this class with its own `format` and `firstOfWeek` implementations.
 * All date math falls back to our pure-TS `dates` utilities by default.
 */

import type {
  CalendarEvent,
  CalendarFormats,
  CalendarMessages,
  Accessors,
  DateLocalizer as IDateLocalizer,
} from "./types"
import * as dates from "./lib/dates"
import { mergeMessages } from "./helpers"

export interface LocalizerSpec {
  formats: CalendarFormats
  firstOfWeek: (culture?: string) => number
  format: (value: Date, formatStr: string, culture?: string) => string
  parse?: (value: string, format: string, culture?: string) => Date

  // Optional overrides — all default to our pure TS date math
  merge?: (date: Date, time: Date) => Date
  inRange?: (day: Date, min: Date, max: Date, unit?: string) => boolean
  lt?: (a: Date, b: Date, unit?: string) => boolean
  lte?: (a: Date, b: Date, unit?: string) => boolean
  gt?: (a: Date, b: Date, unit?: string) => boolean
  gte?: (a: Date, b: Date, unit?: string) => boolean
  eq?: (a: Date, b: Date, unit?: string) => boolean
  neq?: (a: Date, b: Date, unit?: string) => boolean
  startOf?: (date: Date, unit: string) => Date
  endOf?: (date: Date, unit: string) => Date
  add?: (date: Date, amount: number, unit: string) => Date
  range?: (start: Date, end: Date, unit?: string) => Date[]
  diff?: (a: Date, b: Date, unit?: string) => number
  ceil?: (date: Date, unit: string) => Date
  min?: (a: Date, b: Date) => Date
  max?: (a: Date, b: Date) => Date
  minutes?: (date: Date) => number
  firstVisibleDay?: (date: Date, localizer?: IDateLocalizer) => Date
  lastVisibleDay?: (date: Date, localizer?: IDateLocalizer) => Date
  visibleDays?: (date: Date, localizer?: IDateLocalizer) => Date[]
  getSlotDate?: (dt: Date, minutesFromMidnight: number, offset: number) => Date
  getTimezoneOffset?: (date: Date) => number
  getDstOffset?: (start: Date, end: Date) => number
  getTotalMin?: (start: Date, end: Date) => number
  getMinutesFromMidnight?: (date: Date) => number
  continuesPrior?: (start: Date, first: Date) => boolean
  continuesAfter?: (start: Date, end: Date, last: Date) => boolean
  sortEvents?: (args: { evtA: SortableEvent; evtB: SortableEvent }) => number
  inEventRange?: (args: { event: { start: Date; end: Date }; range: { start: Date; end: Date } }) => boolean
  isSameDate?: (a: Date, b: Date, unit?: string) => boolean
  startAndEndAreDateOnly?: (start: Date, end: Date) => boolean
  daySpan?: (start: Date, end: Date) => number
  browserTZOffset?: () => number
}

interface SortableEvent {
  start: Date
  end: Date
  allDay: boolean
}

// ─── Default implementations ──────────────────────────────────────────

function defaultGetSlotDate(dt: Date, minutesFromMidnight: number, offset: number): Date {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, minutesFromMidnight + offset, 0, 0)
}

function defaultGetDstOffset(start: Date, end: Date): number {
  return start.getTimezoneOffset() - end.getTimezoneOffset()
}

function defaultGetTotalMin(start: Date, end: Date): number {
  return dates.diff(start, end, "minutes") + defaultGetDstOffset(start, end)
}

function defaultGetMinutesFromMidnight(start: Date): number {
  const dayStart = dates.startOf(start, "day")
  return dates.diff(dayStart, start, "minutes") + defaultGetDstOffset(dayStart, start)
}

function defaultContinuesPrior(start: Date, first: Date): boolean {
  return dates.lt(start, first, "day")
}

function defaultContinuesAfter(start: Date, end: Date, last: Date): boolean {
  const sameMin = dates.eq(start, end, "minutes")
  return sameMin ? dates.gte(end, last, "minutes") : dates.gt(end, last, "minutes")
}

function defaultDaySpan(start: Date, end: Date): number {
  return dates.duration(start, end, "day")
}

function defaultSortEvents({ evtA, evtB }: { evtA: SortableEvent; evtB: SortableEvent }): number {
  const startSort = +dates.startOf(evtA.start, "day") - +dates.startOf(evtB.start, "day")
  const durA = defaultDaySpan(evtA.start, evtA.end)
  const durB = defaultDaySpan(evtB.start, evtB.end)
  return (
    startSort ||
    durB - durA ||
    (evtB.allDay ? 1 : 0) - (evtA.allDay ? 1 : 0) ||
    +evtA.start - +evtB.start ||
    +evtA.end - +evtB.end
  )
}

function defaultInEventRange({
  event,
  range,
}: {
  event: { start: Date; end: Date }
  range: { start: Date; end: Date }
}): boolean {
  const eStart = dates.startOf(event.start, "day")
  const startsBeforeEnd = dates.lte(eStart, range.end, "day")
  const sameMin = dates.neq(eStart, event.end, "minutes")
  const endsAfterStart = sameMin
    ? dates.gt(event.end, range.start, "minutes")
    : dates.gte(event.end, range.start, "minutes")
  return startsBeforeEnd && endsAfterStart
}

// ─── DateLocalizer class ──────────────────────────────────────────────

export class DateLocalizer implements IDateLocalizer {
  formats: CalendarFormats
  messages: Required<CalendarMessages>
  segmentOffset: number

  private _format: (value: Date, formatStr: string, culture?: string) => string
  private _firstOfWeek: (culture?: string) => number

  // Date arithmetic (all overridable)
  merge: (date: Date, time: Date) => Date
  inRange: (day: Date, min: Date, max: Date, unit?: string) => boolean
  lt: (a: Date, b: Date, unit?: string) => boolean
  lte: (a: Date, b: Date, unit?: string) => boolean
  gt: (a: Date, b: Date, unit?: string) => boolean
  gte: (a: Date, b: Date, unit?: string) => boolean
  eq: (a: Date, b: Date, unit?: string) => boolean
  neq: (a: Date, b: Date, unit?: string) => boolean
  startOf: (date: Date, unit: string) => Date
  endOf: (date: Date, unit: string) => Date
  add: (date: Date, amount: number, unit: string) => Date
  range: (start: Date, end: Date, unit?: string) => Date[]
  diff: (a: Date, b: Date, unit?: string) => number
  ceil: (date: Date, unit: string) => Date
  min: (a: Date, b: Date) => Date
  max: (a: Date, b: Date) => Date
  minutes: (date: Date) => number

  // Visibility
  firstVisibleDay: (date: Date, localizer?: IDateLocalizer) => Date
  lastVisibleDay: (date: Date, localizer?: IDateLocalizer) => Date
  visibleDays: (date: Date, localizer?: IDateLocalizer) => Date[]

  // Time slots
  getSlotDate: (dt: Date, minutesFromMidnight: number, offset: number) => Date
  getTimezoneOffset: (date: Date) => number
  getDstOffset: (start: Date, end: Date) => number
  getTotalMin: (start: Date, end: Date) => number
  getMinutesFromMidnight: (date: Date) => number

  // Event helpers
  continuesPrior: (start: Date, first: Date) => boolean
  continuesAfter: (start: Date, end: Date, last: Date) => boolean
  sortEvents: (eventA: CalendarEvent, eventB: CalendarEvent, accessors: Accessors) => number
  inEventRange: (event: CalendarEvent, range: { start: Date; end: Date }, accessors: Accessors) => boolean
  isSameDate: (a: Date, b: Date, unit?: string) => boolean
  startAndEndAreDateOnly: (start: Date, end: Date) => boolean

  parse?: (value: string, format: string, culture?: string) => Date

  constructor(spec: LocalizerSpec) {
    this.formats = spec.formats
    this.messages = mergeMessages()
    this._format = spec.format
    this._firstOfWeek = spec.firstOfWeek
    this.parse = spec.parse

    // Date math with defaults
    this.merge = spec.merge ?? ((d, t) => dates.merge(d, t)!)
    this.inRange = spec.inRange ?? dates.inRange
    this.lt = spec.lt ?? dates.lt
    this.lte = spec.lte ?? dates.lte
    this.gt = spec.gt ?? dates.gt
    this.gte = spec.gte ?? dates.gte
    this.eq = spec.eq ?? dates.eq
    this.neq = spec.neq ?? dates.neq
    this.startOf = spec.startOf ?? dates.startOf
    this.endOf = spec.endOf ?? dates.endOf
    this.add = spec.add ?? dates.add
    this.range = spec.range ?? dates.range
    this.diff = spec.diff ?? dates.diff
    this.ceil = spec.ceil ?? dates.ceil
    this.min = spec.min ?? dates.min
    this.max = spec.max ?? dates.max
    this.minutes = spec.minutes ?? dates.minutes

    // Visibility
    const sow = () => this.startOfWeek()
    this.firstVisibleDay = spec.firstVisibleDay ?? (((d: Date) => dates.firstVisibleDay(d, sow())) as (date: Date, localizer?: IDateLocalizer) => Date)
    this.lastVisibleDay = spec.lastVisibleDay ?? (((d: Date) => dates.lastVisibleDay(d, sow())) as (date: Date, localizer?: IDateLocalizer) => Date)
    this.visibleDays = spec.visibleDays ?? (((d: Date) => dates.visibleDays(d, sow())) as (date: Date, localizer?: IDateLocalizer) => Date[])

    // Time slots
    this.getSlotDate = spec.getSlotDate ?? defaultGetSlotDate
    this.getTimezoneOffset = spec.getTimezoneOffset ?? ((v) => v.getTimezoneOffset())
    this.getDstOffset = spec.getDstOffset ?? defaultGetDstOffset
    this.getTotalMin = spec.getTotalMin ?? defaultGetTotalMin
    this.getMinutesFromMidnight = spec.getMinutesFromMidnight ?? defaultGetMinutesFromMidnight

    // Event helpers
    this.continuesPrior = spec.continuesPrior ?? defaultContinuesPrior
    this.continuesAfter = spec.continuesAfter ?? defaultContinuesAfter
    this.isSameDate = spec.isSameDate ?? ((a, b, unit?) => dates.eq(a, b, unit ?? "day"))
    this.startAndEndAreDateOnly = spec.startAndEndAreDateOnly ?? ((s, e) => dates.isJustDate(s) && dates.isJustDate(e))

    // These need accessors, so we wrap
    const sortFn = spec.sortEvents ?? defaultSortEvents
    this.sortEvents = (_eventA, _eventB, accessors) => {
      const evtA = { start: accessors.start(_eventA), end: accessors.end(_eventA), allDay: accessors.allDay(_eventA) }
      const evtB = { start: accessors.start(_eventB), end: accessors.end(_eventB), allDay: accessors.allDay(_eventB) }
      return sortFn({ evtA, evtB })
    }

    const inRangeFn = spec.inEventRange ?? defaultInEventRange
    this.inEventRange = (event, range, accessors) => {
      return inRangeFn({ event: { start: accessors.start(event), end: accessors.end(event) }, range })
    }

    this.segmentOffset = spec.browserTZOffset ? spec.browserTZOffset() : 0
  }

  format(value: Date | { start: Date; end: Date }, formatStr: string | ((date: Date, culture?: string, localizer?: IDateLocalizer) => string), culture?: string): string {
    if (typeof formatStr === "function") {
      if (typeof (value as any).start !== "undefined") {
        return formatStr((value as { start: Date }).start, culture, this)
      }
      return formatStr(value as Date, culture, this)
    }
    // Resolve format name from the formats map (e.g. "monthHeaderFormat" → "MMMM yyyy")
    const resolvedFormat = (this.formats as Record<string, unknown>)[formatStr] ?? formatStr
    // If resolved to a range format function
    if (typeof resolvedFormat === "function") {
      if (typeof (value as any).start !== "undefined") {
        return (resolvedFormat as (range: { start: Date; end: Date }, culture?: string, localizer?: IDateLocalizer) => string)(
          value as { start: Date; end: Date },
          culture,
          this,
        )
      }
      return (resolvedFormat as (date: Date, culture?: string, localizer?: IDateLocalizer) => string)(
        value as Date,
        culture,
        this,
      )
    }
    // Resolved to a string format — use it instead of the original key
    const actualFormat = typeof resolvedFormat === "string" ? resolvedFormat : formatStr
    if (typeof (value as any).start !== "undefined") {
      return this._format((value as { start: Date }).start, actualFormat, culture)
    }
    return this._format(value as Date, actualFormat, culture)
  }

  startOfWeek(culture?: string): number {
    return this._firstOfWeek(culture)
  }
}

// ─── Merge localizer with user overrides ──────────────────────────────

export function mergeWithDefaults(
  localizer: DateLocalizer,
  culture: string | undefined,
  formatOverrides: Partial<CalendarFormats> | undefined,
  messages: Partial<CalendarMessages> | undefined,
): DateLocalizer & { messages: Required<CalendarMessages> } {
  const mergedFormats = { ...localizer.formats, ...formatOverrides }
  const mergedMessages = mergeMessages(messages)

  // Return a proxy-like object that delegates to the localizer
  // but overrides format and startOfWeek with culture baked in
  return Object.create(localizer, {
    messages: { value: mergedMessages, writable: false },
    startOfWeek: { value: () => localizer.startOfWeek(culture), writable: false },
    format: {
      value: (value: Date, format: string) => {
        const resolved = (mergedFormats as Record<string, unknown>)[format] ?? format
        return localizer.format(value, resolved as string, culture)
      },
      writable: false,
    },
  })
}
