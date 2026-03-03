/**
 * Overlap layout algorithm — allows events to visually overlap.
 * Ported from react-big-calendar to TypeScript.
 */

import type { Accessors, CalendarEvent, StyledEvent } from "../../types"
import type { ITimeSlotMetrics } from "../time-slot-metrics"

interface LayoutEvent {
  start: number
  end: number
  startMs: number
  endMs: number
  top: number
  height: number
  data: CalendarEvent

  // Tree structure
  rows?: LayoutEvent[]
  leaves?: LayoutEvent[]
  container?: LayoutEvent
  row?: LayoutEvent
}

function createLayoutEvent(
  data: CalendarEvent,
  accessors: Accessors,
  slotMetrics: ITimeSlotMetrics,
): LayoutEvent {
  const { start, startDate, end, endDate, top, height } = slotMetrics.getRange(
    accessors.start(data),
    accessors.end(data),
  )
  return {
    start,
    end,
    startMs: +startDate,
    endMs: +endDate,
    top,
    height,
    data,
  }
}

function getWidth(event: LayoutEvent): number {
  if (event.rows) {
    const columns =
      event.rows.reduce((max, row) => Math.max(max, (row.leaves?.length ?? 0) + 1), 0) + 1
    return 100 / columns
  }
  if (event.leaves) {
    const available = 100 - getWidth(event.container!)
    return available / (event.leaves.length + 1)
  }
  return getWidth(event.row!)
}

function getOverlapWidth(event: LayoutEvent): number {
  const noOverlap = getWidth(event)
  const overlap = Math.min(100, getWidth(event) * 1.7)

  if (event.rows) return overlap
  if (event.leaves) return event.leaves.length > 0 ? overlap : noOverlap

  const { leaves } = event.row!
  const index = leaves!.indexOf(event)
  return index === leaves!.length - 1 ? noOverlap : overlap
}

function getXOffset(event: LayoutEvent): number {
  if (event.rows) return 0
  if (event.leaves) return getWidth(event.container!)

  const { leaves, row } = event
  const rowXOffset = getXOffset(event.row!)
  const rowWidth = getWidth(event.row!)
  const index = event.row!.leaves!.indexOf(event) + 1
  return rowXOffset + index * rowWidth
}

function onSameRow(a: LayoutEvent, b: LayoutEvent, minimumStartDifference: number): boolean {
  return (
    Math.abs(b.start - a.start) < minimumStartDifference ||
    (b.start > a.start && b.start < a.end)
  )
}

function sortByRender(events: LayoutEvent[]): LayoutEvent[] {
  const sortedByTime = [...events].sort(
    (a, b) => a.startMs - b.startMs || b.endMs - a.endMs,
  )

  const sorted: LayoutEvent[] = []
  while (sortedByTime.length > 0) {
    const event = sortedByTime.shift()!
    sorted.push(event)

    for (let i = 0; i < sortedByTime.length; i++) {
      const test = sortedByTime[i]
      if (event.endMs > test.startMs) continue
      if (i > 0) {
        const [moved] = sortedByTime.splice(i, 1)
        sorted.push(moved)
      }
      break
    }
  }
  return sorted
}

export default function overlapLayout({
  events,
  minimumStartDifference,
  slotMetrics,
  accessors,
}: {
  events: CalendarEvent[]
  minimumStartDifference: number
  slotMetrics: ITimeSlotMetrics
  accessors: Accessors
}): StyledEvent[] {
  const proxies = events.map((e) => createLayoutEvent(e, accessors, slotMetrics))

  // Sort by start time, then by longest event first
  const sorted = proxies.sort(
    (a, b) => a.startMs - b.startMs || b.endMs - a.endMs,
  )

  // Build the tree of containers → rows → leaves
  const containers: LayoutEvent[] = []

  for (const event of sorted) {
    const container = containers.find(
      (c) =>
        c.end > event.start ||
        Math.abs(event.start - c.start) < minimumStartDifference,
    )

    if (!container) {
      event.rows = []
      containers.push(event)
      continue
    }

    // Check if it belongs to an existing row
    const row = container.rows!.find((r) => onSameRow(r, event, minimumStartDifference))

    if (row) {
      row.leaves!.push(event)
      event.row = row
      event.container = container
      container.end = Math.max(container.end, event.end)
    } else {
      event.leaves = []
      event.container = container
      container.rows!.push(event)
      container.end = Math.max(container.end, event.end)
    }
  }

  // Convert to styled events
  const rendered = sortByRender(sorted)
  return rendered.map((event) => ({
    event: event.data,
    style: {
      top: event.top,
      height: event.height,
      width: getOverlapWidth(event),
      xOffset: getXOffset(event),
    },
  }))
}
