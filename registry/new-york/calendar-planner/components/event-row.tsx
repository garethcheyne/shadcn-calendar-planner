"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type {
  CalendarEvent,
  Accessors,
  Getters,
  DateLocalizer,
  CalendarComponents,
  EventSegment,
} from "../types"
import { EventCell } from "./event-cell"

// ─── EventRow ──────────────────────────────────────────────────────

export interface EventRowProps<TEvent extends CalendarEvent = CalendarEvent> {
  segments: EventSegment<TEvent>[]
  slotMetrics: {
    slots: number
    range: Date[]
  }
  className?: string
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  selected?: TEvent
  onSelect?: (event: TEvent, e: React.SyntheticEvent) => void
  onDoubleClick?: (event: TEvent, e: React.SyntheticEvent) => void
  onKeyPress?: (event: TEvent, e: React.KeyboardEvent) => void
  isAllDay?: boolean
}

export function EventRow<TEvent extends CalendarEvent = CalendarEvent>({
  segments,
  slotMetrics,
  className,
  accessors,
  getters,
  localizer,
  components,
  selected,
  onSelect,
  onDoubleClick,
  onKeyPress,
  isAllDay,
}: EventRowProps<TEvent>) {
  let lastEnd = 1
  const totalSlots = slotMetrics.slots

  const row: React.ReactNode[] = []
  for (const { event, left, right, span } of segments) {
    const gap = left - lastEnd
    if (gap > 0) {
      row.push(
        <div
          key={`gap-${lastEnd}`}
          className="flex-none"
          style={{ flexBasis: `${(gap / totalSlots) * 100}%` }}
        />,
      )
    }
    row.push(
      <div
        key={`evt-${left}-${accessors.title(event)}`}
        className="flex-none px-0.5"
        style={{ flexBasis: `${(span / totalSlots) * 100}%` }}
      >
        <EventCell
          event={event}
          selected={selected}
          isAllDay={isAllDay}
          continuesPrior={left === 1}
          continuesAfter={right === totalSlots}
          accessors={accessors}
          getters={getters}
          localizer={localizer}
          components={components}
          slotStart={slotMetrics.range[left - 1]}
          slotEnd={slotMetrics.range[right - 1]}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          onKeyPress={onKeyPress}
        />
      </div>,
    )
    lastEnd = left + span
  }

  return (
    <div className={cn("flex flex-row items-stretch", className)}>
      {row}
    </div>
  )
}

// ─── EventEndingRow (handles "show more") ──────────────────────────

export interface EventEndingRowProps<TEvent extends CalendarEvent = CalendarEvent>
  extends EventRowProps<TEvent> {
  maxRows: number
  onShowMore?: (events: TEvent[], date: Date, cell: HTMLElement, slot: number) => void
}

export function EventEndingRow<TEvent extends CalendarEvent = CalendarEvent>({
  segments,
  slotMetrics,
  maxRows,
  className,
  accessors,
  getters,
  localizer,
  components,
  selected,
  onSelect,
  onDoubleClick,
  onKeyPress,
  isAllDay,
  onShowMore,
}: EventEndingRowProps<TEvent>) {
  let lastEnd = 1
  const totalSlots = slotMetrics.slots

  const row: React.ReactNode[] = []
  for (const { event, left, right, span } of segments) {
    const gap = left - lastEnd
    if (gap > 0) {
      row.push(
        <div
          key={`gap-${lastEnd}`}
          className="flex-none"
          style={{ flexBasis: `${(gap / totalSlots) * 100}%` }}
        />,
      )
    }
    row.push(
      <div
        key={`evt-${left}-${accessors.title(event)}`}
        className="flex-none px-0.5"
        style={{ flexBasis: `${(span / totalSlots) * 100}%` }}
      >
        <EventCell
          event={event}
          selected={selected}
          isAllDay={isAllDay}
          continuesPrior={left === 1}
          continuesAfter={right === totalSlots}
          accessors={accessors}
          getters={getters}
          localizer={localizer}
          components={components}
          slotStart={slotMetrics.range[left - 1]}
          slotEnd={slotMetrics.range[right - 1]}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          onKeyPress={onKeyPress}
        />
      </div>,
    )
    lastEnd = left + span
  }

  return (
    <div className={cn("flex flex-row items-stretch", className)}>
      {row}
    </div>
  )
}
