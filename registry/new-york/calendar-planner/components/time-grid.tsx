"use client"

import * as React from "react"
import { useRef, useMemo, useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type {
  CalendarEvent,
  Accessors,
  Getters,
  DateLocalizer,
  CalendarComponents,
  DayLayoutAlgorithm,
} from "../types"
import { DayColumn } from "./day-column"
import { TimeGutter } from "./time-slots"
import { TimeGridHeader } from "./time-grid-header"
import * as dates from "../lib/dates"
import { Resources, NONE } from "../lib/resources"

export interface TimeGridProps<TEvent extends CalendarEvent = CalendarEvent> {
  range: Date[]
  events: TEvent[]
  backgroundEvents?: TEvent[]
  step?: number
  timeslots?: number
  min?: Date
  max?: Date
  scrollToTime?: Date
  getNow: () => Date
  selected?: TEvent
  selectable?: boolean | "ignoreEvents"
  longPressThreshold?: number
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  rtl?: boolean
  width?: number
  resources?: { id: string | number; title: string }[]
  resourceAccessor?: keyof TEvent | ((event: TEvent) => string | number)
  resourceIdAccessor?: string
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
  onDrillDown?: (date: Date, view: string) => void
  onShowMore?: (events: TEvent[], date: Date, cell: HTMLElement, slot: number) => void
}

export function TimeGrid<TEvent extends CalendarEvent = CalendarEvent>({
  range,
  events,
  backgroundEvents = [],
  step = 30,
  timeslots = 2,
  min: minProp,
  max: maxProp,
  scrollToTime,
  getNow,
  selected,
  selectable,
  longPressThreshold,
  accessors,
  getters,
  localizer,
  components,
  rtl,
  resources: resourcesProp,
  resourceAccessor,
  dayLayoutAlgorithm,
  onSelectSlot,
  onSelect,
  onDoubleClick,
  onKeyPress,
  onDrillDown,
}: TimeGridProps<TEvent>) {
  const contentRef = useRef<HTMLDivElement>(null)
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const now = getNow()

  // Default min/max: start of day to end of day
  const min = useMemo(() => {
    if (minProp) return minProp
    const d = new Date(range[0])
    d.setHours(0, 0, 0, 0)
    return d
  }, [minProp, range])

  const max = useMemo(() => {
    if (maxProp) return maxProp
    const d = new Date(range[0])
    d.setHours(23, 59, 59, 999)
    return d
  }, [maxProp, range])

  // Partition events into all-day and time-based
  const { allDayEvents, rangeEvents } = useMemo(() => {
    const allDay: TEvent[] = []
    const ranged: TEvent[] = []
    for (const event of events) {
      if (accessors.allDay(event) || localizer.diff(accessors.start(event), accessors.end(event), "day") >= 1) {
        allDay.push(event)
      } else {
        ranged.push(event)
      }
    }
    return { allDayEvents: allDay, rangeEvents: ranged }
  }, [events, accessors, localizer])

  // Resources
  const resourceData = useMemo(() => {
    if (!resourcesProp || resourcesProp.length === 0) return null
    return Resources(
      resourcesProp as any,
      accessors,
    )
  }, [resourcesProp, accessors])

  // Group events by date then resource
  const getEventsForDate = useCallback(
    (date: Date, resourceId?: string | number) => {
      return rangeEvents.filter((event) => {
        const start = accessors.start(event)
        const end = accessors.end(event)
        if (!dates.inRange(date, start, end, "day")) return false
        if (resourceId !== undefined && resourceAccessor) {
          const eventResource =
            typeof resourceAccessor === "function"
              ? resourceAccessor(event)
              : (event as Record<string, unknown>)[resourceAccessor as string]
          return eventResource === resourceId
        }
        return true
      })
    },
    [rangeEvents, accessors, resourceAccessor],
  )

  const getBackgroundEventsForDate = useCallback(
    (date: Date, resourceId?: string | number) => {
      return backgroundEvents.filter((event) => {
        const start = accessors.start(event)
        const end = accessors.end(event)
        if (!dates.inRange(date, start, end, "day")) return false
        if (resourceId !== undefined && resourceAccessor) {
          const eventResource =
            typeof resourceAccessor === "function"
              ? resourceAccessor(event)
              : (event as Record<string, unknown>)[resourceAccessor as string]
          return eventResource === resourceId
        }
        return true
      })
    },
    [backgroundEvents, accessors, resourceAccessor],
  )

  // Scroll to time on mount
  useEffect(() => {
    if (!contentRef.current) return
    const target = scrollToTime || now
    const totalMinutes = dates.diff(min, max, "minutes")
    const targetMinutes = dates.diff(min, target, "minutes")
    const pct = targetMinutes / totalMinutes
    contentRef.current.scrollTop = pct * contentRef.current.scrollHeight
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync header scroll with content scroll
  const handleScroll = useCallback(() => {
    if (contentRef.current && headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = contentRef.current.scrollLeft
    }
  }, [])

  // Check overflow
  useEffect(() => {
    if (!contentRef.current) return
    setIsOverflowing(contentRef.current.scrollHeight > contentRef.current.clientHeight)
  }, [range, events])

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header with all-day events */}
      <TimeGridHeader
        range={range}
        events={allDayEvents}
        getNow={getNow}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        components={components}
        selected={selected}
        selectable={selectable}
        isOverflowing={isOverflowing}
        rtl={rtl}
        resources={resourcesProp}
        scrollRef={headerScrollRef}
        onSelectSlot={onSelectSlot}
        onSelect={onSelect}
        onDoubleClick={onDoubleClick}
        onKeyPress={onKeyPress}
        onDrillDown={onDrillDown}
      />

      {/* Scrollable time content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={handleScroll}
      >
        <div className="flex flex-row min-h-full">
          {/* Time gutter */}
          <TimeGutter
            min={min}
            max={max}
            step={step}
            timeslots={timeslots}
            localizer={localizer}
            getNow={getNow}
            gutterRef={gutterRef}
          />

          {/* Day columns */}
          <div className="flex flex-row flex-1 min-w-0">
            {resourceData
              ? resourceData.map(([resourceId, _resource]: [string | number | typeof NONE, unknown]) => {
                  return range.map((date, idx) => {
                    return (
                      <DayColumn
                        key={`${String(resourceId)}-${idx}`}
                        date={date}
                        events={getEventsForDate(date, resourceId as string | number)}
                        backgroundEvents={getBackgroundEventsForDate(date, resourceId as string | number)}
                        step={step}
                        timeslots={timeslots}
                        min={min}
                        max={max}
                        getNow={getNow}
                        selected={selected}
                        selectable={selectable}
                        isNow={localizer.isSameDate(date, now)}
                        accessors={accessors}
                        getters={getters}
                        localizer={localizer}
                        components={components}
                        rtl={rtl}
                        resource={resourceId as string | number}
                        dayLayoutAlgorithm={dayLayoutAlgorithm}
                        onSelectSlot={onSelectSlot}
                        onSelect={onSelect}
                        onDoubleClick={onDoubleClick}
                        onKeyPress={onKeyPress}
                      />
                    )
                  })
                })
              : range.map((date, idx) => (
                  <DayColumn
                    key={idx}
                    date={date}
                    events={getEventsForDate(date)}
                    backgroundEvents={getBackgroundEventsForDate(date)}
                    step={step}
                    timeslots={timeslots}
                    min={min}
                    max={max}
                    getNow={getNow}
                    selected={selected}
                    selectable={selectable}
                    isNow={localizer.isSameDate(date, now)}
                    accessors={accessors}
                    getters={getters}
                    localizer={localizer}
                    components={components}
                    rtl={rtl}
                    dayLayoutAlgorithm={dayLayoutAlgorithm}
                    onSelectSlot={onSelectSlot}
                    onSelect={onSelect}
                    onDoubleClick={onDoubleClick}
                    onKeyPress={onKeyPress}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}
