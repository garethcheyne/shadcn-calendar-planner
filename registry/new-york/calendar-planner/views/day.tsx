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

export interface DayViewProps<TEvent extends CalendarEvent = CalendarEvent> {
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

export function DayView<TEvent extends CalendarEvent = CalendarEvent>({
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
}: DayViewProps<TEvent>) {
  const range = useMemo(() => [localizer.startOf(date, "day")], [date, localizer])

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

DayView.range = (date: Date, localizer: DateLocalizer) => {
  const start = localizer.startOf(date, "day")
  return { start, end: start }
}

DayView.navigate = (date: Date, action: NavigateAction, localizer: DateLocalizer) => {
  switch (action) {
    case navigate.PREVIOUS:
      return localizer.add(date, -1, "day")
    case navigate.NEXT:
      return localizer.add(date, 1, "day")
    default:
      return date
  }
}

DayView.title = (date: Date, localizer: DateLocalizer) => {
  return localizer.format(date, "dayHeaderFormat")
}
