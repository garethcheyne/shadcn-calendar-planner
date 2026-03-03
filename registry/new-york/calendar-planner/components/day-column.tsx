"use client"

import * as React from "react"
import { useRef, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import type {
  CalendarEvent,
  Accessors,
  Getters,
  DateLocalizer,
  CalendarComponents,
  DayLayoutAlgorithm,
} from "../types"
import { getStyledEvents } from "../lib/day-event-layout"
import { getTimeSlotMetrics } from "../lib/time-slot-metrics"
import { TimeGridEvent } from "./event-cell"
import { TimeSlotGroup } from "./time-slots"
import * as dates from "../lib/dates"

export interface DayColumnProps<TEvent extends CalendarEvent = CalendarEvent> {
  date: Date
  events: TEvent[]
  backgroundEvents?: TEvent[]
  step: number
  timeslots: number
  min: Date
  max: Date
  getNow: () => Date
  selected?: TEvent
  selectable?: boolean | "ignoreEvents"
  longPressThreshold?: number
  isNow?: boolean
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  rtl?: boolean
  resource?: string | number
  dayLayoutAlgorithm?: DayLayoutAlgorithm
  onSelectSlot?: (slotInfo: {
    start: Date
    end: Date
    slots: Date[]
    action: string
    resourceId?: string | number
  }) => void
  onSelect?: (event: TEvent, e: React.SyntheticEvent) => void
  onDoubleClick?: (event: TEvent, e: React.SyntheticEvent) => void
  onKeyPress?: (event: TEvent, e: React.KeyboardEvent) => void
}

export function DayColumn<TEvent extends CalendarEvent = CalendarEvent>({
  date,
  events,
  backgroundEvents = [],
  step,
  timeslots,
  min,
  max,
  getNow,
  selected,
  selectable,
  isNow,
  accessors,
  getters,
  localizer,
  components,
  rtl,
  resource,
  dayLayoutAlgorithm,
  onSelectSlot,
  onSelect,
  onDoubleClick,
  onKeyPress,
}: DayColumnProps<TEvent>) {
  const columnRef = useRef<HTMLDivElement>(null)

  const slotMetrics = useMemo(
    () => getTimeSlotMetrics({ min, max, step, timeslots, localizer }),
    [min, max, step, timeslots, localizer],
  )

  const styledEvents = useMemo(
    () =>
      getStyledEvents({
        events,
        accessors: accessors as Accessors<CalendarEvent>,
        slotMetrics,
        minimumStartDifference: Math.ceil((step * timeslots) / 2),
        dayLayoutAlgorithm: dayLayoutAlgorithm ?? "overlap",
      }),
    [events, accessors, slotMetrics, step, timeslots, dayLayoutAlgorithm],
  )

  const styledBackground = useMemo(
    () =>
      getStyledEvents({
        events: backgroundEvents,
        accessors: accessors as Accessors<CalendarEvent>,
        slotMetrics,
        minimumStartDifference: 0,
        dayLayoutAlgorithm: "no-overlap",
      }),
    [backgroundEvents, accessors, slotMetrics],
  )

  // Build time slot groups for rendering
  const groups = useMemo(() => {
    const result: Date[][] = []
    const totalMin = 1 + localizer.getTotalMin(min, max)
    const minutesFromMidnight = localizer.getMinutesFromMidnight(min)
    const numGroups = Math.ceil((totalMin - 1) / (step * timeslots))

    for (let grp = 0; grp < numGroups; grp++) {
      const group: Date[] = []
      for (let slot = 0; slot < timeslots; slot++) {
        const slotIdx = grp * timeslots + slot
        group.push(localizer.getSlotDate(min, minutesFromMidnight, slotIdx * step))
      }
      result.push(group)
    }
    return result
  }, [min, max, step, timeslots, localizer])

  // Current time indicator
  const now = getNow()
  const showCurrentTime = isNow && dates.inRange(now, min, max, "minutes")
  const currentTimePosition = showCurrentTime
    ? ((dates.diff(min, now, "minutes") / dates.diff(min, max, "minutes")) * 100)
    : null

  // Click handler for slots
  const handleSlotClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectable) return
      if ((e.target as HTMLElement).closest("[data-event]")) return

      const bounds = columnRef.current?.getBoundingClientRect()
      if (!bounds) return
      const y = e.clientY - bounds.top
      const pct = y / bounds.height
      const totalMinutes = dates.diff(min, max, "minutes")
      const minuteOffset = Math.round(pct * totalMinutes / step) * step
      const slotDate = dates.add(min, minuteOffset, "minutes")
      const slotEnd = dates.add(slotDate, step, "minutes")

      onSelectSlot?.({
        start: slotDate,
        end: slotEnd,
        slots: [slotDate],
        action: "click",
        resourceId: resource,
      })
    },
    [selectable, min, max, step, resource, onSelectSlot],
  )

  const { className: dayClassName, style: dayStyle } = getters.dayProp?.(date) ?? {}

  return (
    <div
      ref={columnRef}
      className={cn(
        "relative flex-1 border-l border-border/50 first:border-l-0",
        dayClassName,
      )}
      style={dayStyle}
      onClick={handleSlotClick}
    >
      {/* Time slot background grid */}
      {groups.map((group, idx) => (
        <TimeSlotGroup
          key={idx}
          group={group}
          getters={getters}
          resourceId={resource}
        />
      ))}

      {/* Background events */}
      {styledBackground.map(({ event, style }, idx) => (
        <TimeGridEvent
          key={`bg-${idx}`}
          event={event as unknown as TEvent}
          style={style}
          isBackgroundEvent
          accessors={accessors}
          getters={getters}
          localizer={localizer}
          components={components}
          rtl={rtl}
        />
      ))}

      {/* Foreground events */}
      {styledEvents.map(({ event, style }, idx) => {
        const evt = event as unknown as TEvent
        const start = accessors.start(evt)
        const end = accessors.end(evt)
        const label = localizer.format({ start, end }, "eventTimeRangeFormat")
        const continuesPrior = localizer.lt(start, min, "day")
        const continuesAfter = localizer.gt(end, max, "day")

        return (
          <TimeGridEvent
            key={`evt-${idx}`}
            event={evt}
            label={label}
            style={style}
            selected={selected}
            continuesPrior={continuesPrior}
            continuesAfter={continuesAfter}
            accessors={accessors}
            getters={getters}
            localizer={localizer}
            components={components}
            rtl={rtl}
            onSelect={onSelect}
            onDoubleClick={onDoubleClick}
            onKeyPress={onKeyPress}
          />
        )
      })}

      {/* Current time indicator */}
      {showCurrentTime && currentTimePosition !== null && (
        <div
          className="absolute left-0 right-0 z-30 border-t-2 border-calendar-current-time pointer-events-none"
          style={{ top: `${currentTimePosition}%` }}
        >
          <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-calendar-current-time" />
        </div>
      )}
    </div>
  )
}
