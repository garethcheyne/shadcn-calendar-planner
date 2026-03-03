/**
 * Event segment & level calculation for month/all-day row layout.
 */

import type {
  CalendarEvent,
  Accessors,
  DateLocalizer,
  EventSegment,
} from "../types"

export function endOfRange({
  dateRange,
  unit = "day",
  localizer,
}: {
  dateRange: Date[]
  unit?: string
  localizer: DateLocalizer
}): { first: Date; last: Date } {
  return {
    first: dateRange[0],
    last: localizer.add(dateRange[dateRange.length - 1], 1, unit),
  }
}

export function eventSegments<TEvent extends CalendarEvent>(
  event: TEvent,
  range: Date[],
  accessors: Accessors<TEvent>,
  localizer: DateLocalizer,
): EventSegment<TEvent> {
  const { first, last } = endOfRange({ dateRange: range, localizer })

  const slots = localizer.diff(first, last, "day")
  const start = localizer.max(
    localizer.startOf(accessors.start(event), "day"),
    first,
  )
  const end = localizer.min(localizer.ceil(accessors.end(event), "day"), last)

  const padding = range.findIndex((x) => localizer.isSameDate(x, start))
  let span = localizer.diff(start, end, "day")

  span = Math.min(span, slots)
  span = Math.max(span - (localizer.segmentOffset ?? 0), 1)

  return {
    event,
    span,
    left: padding + 1,
    right: Math.max(padding + span, 1),
  }
}

export function eventLevels<TEvent extends CalendarEvent>(
  rowSegments: EventSegment<TEvent>[],
  limit: number = Infinity,
): { levels: EventSegment<TEvent>[][]; extra: EventSegment<TEvent>[] } {
  const levels: EventSegment<TEvent>[][] = []
  const extra: EventSegment<TEvent>[] = []

  for (const seg of rowSegments) {
    let j = 0
    for (; j < levels.length; j++) {
      if (!segsOverlap(seg, levels[j])) break
    }

    if (j >= limit) {
      extra.push(seg)
    } else {
      ;(levels[j] || (levels[j] = [])).push(seg)
    }
  }

  for (const level of levels) {
    level.sort((a, b) => a.left - b.left)
  }

  return { levels, extra }
}

export function inRange<TEvent extends CalendarEvent>(
  e: TEvent,
  start: Date,
  end: Date,
  accessors: Accessors<TEvent>,
  localizer: DateLocalizer,
): boolean {
  const event = {
    start: accessors.start(e),
    end: accessors.end(e),
  }
  return localizer.inEventRange(e as CalendarEvent, { start, end }, accessors as Accessors<CalendarEvent>)
}

export function segsOverlap<TEvent extends CalendarEvent>(
  seg: EventSegment<TEvent>,
  otherSegs: EventSegment<TEvent>[],
): boolean {
  return otherSegs.some(
    (otherSeg) => otherSeg.left <= seg.right && otherSeg.right >= seg.left,
  )
}

export function sortWeekEvents<TEvent extends CalendarEvent>(
  events: TEvent[],
  accessors: Accessors<TEvent>,
  localizer: DateLocalizer,
): TEvent[] {
  const multiDayEvents: TEvent[] = []
  const standardEvents: TEvent[] = []

  for (const event of events) {
    const start = accessors.start(event)
    const end = accessors.end(event)
    const daySpan = Math.abs(
      Math.round(
        (+localizer.startOf(end, "day") - +localizer.startOf(start, "day")) / (1000 * 60 * 60 * 24),
      ),
    )
    if (daySpan > 1) {
      multiDayEvents.push(event)
    } else {
      standardEvents.push(event)
    }
  }

  const sorter = (a: TEvent, b: TEvent) => localizer.sortEvents(a as CalendarEvent, b as CalendarEvent, accessors as Accessors<CalendarEvent>)
  return [...multiDayEvents.sort(sorter), ...standardEvents.sort(sorter)]
}

export function sortEvents<TEvent extends CalendarEvent>(
  eventA: TEvent,
  eventB: TEvent,
  accessors: Accessors<TEvent>,
  localizer: DateLocalizer,
): number {
  return localizer.sortEvents(eventA as CalendarEvent, eventB as CalendarEvent, accessors as Accessors<CalendarEvent>)
}
