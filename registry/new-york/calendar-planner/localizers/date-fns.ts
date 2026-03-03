/**
 * date-fns localizer adapter for the calendar.
 *
 * Usage:
 * ```ts
 * import { dateFnsLocalizer } from "@/registry/new-york/calendar-planner"
 * import { format, parse, startOfWeek, getDay } from "date-fns"
 * import { enUS } from "date-fns/locale"
 *
 * const localizer = dateFnsLocalizer({
 *   format, parse, startOfWeek, getDay,
 *   locales: { "en-US": enUS },
 * })
 * ```
 */

import { DateLocalizer } from "../localizer"
import type { CalendarFormats, DateRangeFormat } from "../types"
import * as dates from "../lib/dates"

// ─── Default format strings ──────────────────────────────────────────

const dateRangeFormat: DateRangeFormat = ({ start, end }, culture, local) =>
  `${local!.format(start, "P", culture)} – ${local!.format(end, "P", culture)}`

const timeRangeFormat: DateRangeFormat = ({ start, end }, culture, local) =>
  `${local!.format(start, "p", culture)} – ${local!.format(end, "p", culture)}`

const timeRangeStartFormat: DateRangeFormat = ({ start }, culture, local) =>
  `${local!.format(start, "h:mma", culture)} – `

const timeRangeEndFormat: DateRangeFormat = ({ end }, culture, local) =>
  ` – ${local!.format(end, "h:mma", culture)}`

const weekRangeFormat: DateRangeFormat = ({ start, end }, culture, local) =>
  `${local!.format(start, "MMMM dd", culture)} – ${local!.format(
    end,
    dates.eq(start, end, "month") ? "dd" : "MMMM dd",
    culture,
  )}`

export const defaultFormats: CalendarFormats = {
  dateFormat: "dd",
  dayFormat: "dd eee",
  weekdayFormat: "ccc",
  selectRangeFormat: timeRangeFormat,
  eventTimeRangeFormat: timeRangeFormat,
  eventTimeRangeStartFormat: timeRangeStartFormat,
  eventTimeRangeEndFormat: timeRangeEndFormat,
  timeGutterFormat: "p",
  monthHeaderFormat: "MMMM yyyy",
  dayHeaderFormat: "cccc MMM dd",
  dayRangeHeaderFormat: weekRangeFormat,
  agendaHeaderFormat: dateRangeFormat,
  agendaDateFormat: "ccc MMM dd",
  agendaTimeFormat: "p",
  agendaTimeRangeFormat: timeRangeFormat,
}

// ─── Localizer factory ───────────────────────────────────────────────

export interface DateFnsLocalizerArgs {
  format: (date: Date, formatStr: string, options?: any) => string
  parse?: (dateStr: string, formatStr: string, referenceDate: Date, options?: any) => Date
  startOfWeek: (date: Date, options?: any) => Date
  getDay: (date: Date) => number
  locales: Record<string, unknown>
}

export function dateFnsLocalizer({
  format: _format,
  parse: _parse,
  startOfWeek: _startOfWeek,
  getDay,
  locales,
}: DateFnsLocalizerArgs): DateLocalizer {
  return new DateLocalizer({
    formats: defaultFormats,

    firstOfWeek(culture?: string) {
      return getDay(_startOfWeek(new Date(), { locale: locales[culture ?? ""] }))
    },

    format(value: Date, formatString: string, culture?: string) {
      return _format(new Date(value), formatString, {
        locale: locales[culture ?? ""],
      })
    },

    parse: _parse
      ? (value: string, formatStr: string, culture?: string) =>
          _parse(value, formatStr, new Date(), { locale: locales[culture ?? ""] })
      : undefined,
  })
}

export default dateFnsLocalizer
