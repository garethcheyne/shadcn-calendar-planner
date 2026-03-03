"use client"

import * as React from "react"
import { useMemo } from "react"
import type {
  CalendarEvent,
  Accessors,
  Getters,
  DateLocalizer,
  CalendarComponents,
  NavigateAction,
  DayLayoutAlgorithm,
} from "../types"
import { navigate } from "../constants"
import { TimeGrid } from "../components/time-grid"
import * as dates from "../lib/dates"

export interface WorkWeekViewProps<TEvent extends CalendarEvent = CalendarEvent> {
  date: Date
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
  resources?: { id: string | number; title: string }[]
  resourceAccessor?: keyof TEvent | ((event: TEvent) => string | number)
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
}

export function WorkWeekView<TEvent extends CalendarEvent = CalendarEvent>({
  date,
  events,
  backgroundEvents,
  step,
  timeslots,
  min,
  max,
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
  resources,
  resourceAccessor,
  dayLayoutAlgorithm,
  onSelectSlot,
  onSelect,
  onDoubleClick,
  onKeyPress,
  onDrillDown,
}: WorkWeekViewProps<TEvent>) {
  const range = useMemo(() => {
    const start = localizer.startOf(date, "week")
    const end = localizer.endOf(date, "week")
    const weekDays = dates.range(start, end, "day")
    // Filter to Mon-Fri (1-5)
    return weekDays.filter((d) => {
      const day = d.getDay()
      return day !== 0 && day !== 6
    })
  }, [date, localizer])

  return (
    <TimeGrid
      range={range}
      events={events}
      backgroundEvents={backgroundEvents}
      step={step}
      timeslots={timeslots}
      min={min}
      max={max}
      scrollToTime={scrollToTime}
      getNow={getNow}
      selected={selected}
      selectable={selectable}
      longPressThreshold={longPressThreshold}
      accessors={accessors}
      getters={getters}
      localizer={localizer}
      components={components}
      rtl={rtl}
      resources={resources}
      resourceAccessor={resourceAccessor}
      dayLayoutAlgorithm={dayLayoutAlgorithm}
      onSelectSlot={onSelectSlot}
      onSelect={onSelect}
      onDoubleClick={onDoubleClick}
      onKeyPress={onKeyPress}
      onDrillDown={onDrillDown}
    />
  )
}

WorkWeekView.range = (date: Date, localizer: DateLocalizer) => {
  const start = localizer.startOf(date, "week")
  const end = localizer.endOf(date, "week")
  const weekDays = dates.range(start, end, "day")
  const filtered = weekDays.filter((d) => {
    const day = d.getDay()
    return day !== 0 && day !== 6
  })
  return { start: filtered[0], end: filtered[filtered.length - 1] }
}

WorkWeekView.navigate = (date: Date, action: NavigateAction, localizer: DateLocalizer) => {
  switch (action) {
    case navigate.PREVIOUS:
      return localizer.add(date, -7, "day")
    case navigate.NEXT:
      return localizer.add(date, 7, "day")
    default:
      return date
  }
}

WorkWeekView.title = (date: Date, localizer: DateLocalizer) => {
  const start = localizer.startOf(date, "week")
  const end = localizer.endOf(date, "week")
  return localizer.format({ start, end }, "dayRangeHeaderFormat")
}
