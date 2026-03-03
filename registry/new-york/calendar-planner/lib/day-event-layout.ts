/**
 * DayEventLayout — dispatches to the correct layout algorithm.
 */

import type { Accessors, CalendarEvent, DayLayoutAlgorithm, StyledEvent } from "../types"
import type { ITimeSlotMetrics } from "./time-slot-metrics"
import overlapLayout from "./layout-algorithms/overlap"
import noOverlapLayout from "./layout-algorithms/no-overlap"

const algorithms: Record<string, typeof overlapLayout> = {
  overlap: overlapLayout,
  "no-overlap": noOverlapLayout,
}

export function getStyledEvents({
  events,
  minimumStartDifference,
  slotMetrics,
  accessors,
  dayLayoutAlgorithm = "overlap",
}: {
  events: CalendarEvent[]
  minimumStartDifference: number
  slotMetrics: ITimeSlotMetrics
  accessors: Accessors
  dayLayoutAlgorithm?: DayLayoutAlgorithm
}): StyledEvent[] {
  if (typeof dayLayoutAlgorithm === "function") {
    return dayLayoutAlgorithm({
      events: events.map((e) => ({ event: e, style: { top: 0, height: 0, width: 0, xOffset: 0 } })),
      minimumStartDifference,
      slotMetrics: slotMetrics as never,
      accessors,
    })
  }

  const algorithm = algorithms[dayLayoutAlgorithm]
  if (!algorithm) return []

  return algorithm({
    events,
    minimumStartDifference,
    slotMetrics,
    accessors,
  })
}
