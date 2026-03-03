/**
 * DateSlotMetrics — computes layout metrics for month/all-day row segments.
 */

import type {
  CalendarEvent,
  Accessors,
  DateLocalizer,
  EventSegment,
  DateSlotMetrics as IDateSlotMetrics,
} from "../types"
import { eventSegments, endOfRange, eventLevels } from "./event-levels"

function isSegmentInSlot<TEvent extends CalendarEvent>(
  seg: EventSegment<TEvent>,
  slot: number,
): boolean {
  return seg.left <= slot && seg.right >= slot
}

export interface DateSlotMetricsOptions<TEvent extends CalendarEvent = CalendarEvent> {
  range: Date[]
  events: TEvent[]
  maxRows: number
  minRows: number
  accessors: Accessors<TEvent>
  localizer: DateLocalizer
}

export function getDateSlotMetrics<TEvent extends CalendarEvent = CalendarEvent>(
  options: DateSlotMetricsOptions<TEvent>,
): IDateSlotMetrics<TEvent> {
  const { range, events, maxRows, minRows, accessors, localizer } = options
  const { first, last } = endOfRange({ dateRange: range, localizer })

  const segments = events.map((evt) =>
    eventSegments(evt, range, accessors, localizer),
  )

  const { levels, extra } = eventLevels(segments, Math.max(maxRows - 1, 1))

  // Pad levels up to minRows (subtract 1 for showMore button row when extra exists)
  const minEventRows = extra.length > 0 ? minRows - 1 : minRows
  while (levels.length < minEventRows) levels.push([])

  return {
    first,
    last,
    levels,
    extra,
    range,
    slots: range.length,

    clone(args) {
      return getDateSlotMetrics({ ...options, ...args })
    },

    getDateForSlot(slotNumber: number) {
      return range[slotNumber]
    },

    getSlotForDate(date: Date) {
      return range.findIndex((r) => localizer.isSameDate(r, date))
    },

    getEventsForSlot(slot: number) {
      return segments
        .filter((seg) => isSegmentInSlot(seg, slot))
        .map((seg) => seg.event)
    },

    continuesPrior(event: TEvent) {
      return localizer.continuesPrior(accessors.start(event), first)
    },

    continuesAfter(event: TEvent) {
      const start = accessors.start(event)
      const end = accessors.end(event)
      return localizer.continuesAfter(start, end, last)
    },
  }
}
