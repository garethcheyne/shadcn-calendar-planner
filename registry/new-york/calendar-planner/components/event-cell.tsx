"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type {
  CalendarEvent,
  Accessors,
  Getters,
  DateLocalizer,
  CalendarComponents,
} from "../types"
import { isSelected as checkSelected } from "../helpers"

// ─── EventCell (month / all-day row event) ────────────────────────────

export interface EventCellProps<TEvent extends CalendarEvent = CalendarEvent> {
  event: TEvent
  selected?: TEvent
  isAllDay?: boolean
  continuesPrior?: boolean
  continuesAfter?: boolean
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  slotStart?: Date
  slotEnd?: Date
  onSelect?: (event: TEvent, e: React.SyntheticEvent) => void
  onDoubleClick?: (event: TEvent, e: React.SyntheticEvent) => void
  onKeyPress?: (event: TEvent, e: React.KeyboardEvent) => void
  resizable?: boolean
}

export function EventCell<TEvent extends CalendarEvent = CalendarEvent>({
  event,
  selected,
  isAllDay,
  continuesPrior,
  continuesAfter,
  accessors,
  getters,
  localizer,
  components,
  slotStart,
  slotEnd,
  onSelect,
  onDoubleClick,
  onKeyPress,
}: EventCellProps<TEvent>) {
  const title = accessors.title(event)
  const tooltip = accessors.tooltip(event)
  const end = accessors.end(event)
  const start = accessors.start(event)
  const isSelectedEvent = checkSelected(event, selected)
  const { className: userClassName, style: userStyle } = getters.eventProp(
    event,
    start,
    end,
    isSelectedEvent,
  )

  const EventComponent = components.event

  return (
    <div
      data-event
      tabIndex={0}
      title={tooltip || title}
      onClick={(e) => onSelect?.(event, e)}
      onDoubleClick={(e) => onDoubleClick?.(event, e)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect?.(event, e)
        }
        onKeyPress?.(event, e)
      }}
      style={userStyle}
      className={cn(
        "group relative cursor-pointer select-none rounded-md px-2 py-0.5 text-xs font-medium leading-tight",
        "bg-calendar-event text-calendar-event-foreground",
        "hover:opacity-90 transition-opacity",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        isAllDay && "truncate",
        isSelectedEvent && "ring-2 ring-ring ring-offset-1",
        continuesPrior && "rounded-l-none",
        continuesAfter && "rounded-r-none",
        userClassName,
      )}
    >
      {EventComponent ? (
        <EventComponent
          event={event}
          title={title}
          isAllDay={isAllDay}
          localizer={localizer}
          slotStart={slotStart}
          slotEnd={slotEnd}
          continuesPrior={continuesPrior}
          continuesAfter={continuesAfter}
        />
      ) : (
        <span className="truncate">{title}</span>
      )}
    </div>
  )
}

// ─── TimeGridEvent (time-based views) ─────────────────────────────────

export interface TimeGridEventProps<TEvent extends CalendarEvent = CalendarEvent> {
  event: TEvent
  style: {
    top: number
    height: number
    width: number
    xOffset: number
  }
  label?: string
  selected?: TEvent
  isBackgroundEvent?: boolean
  continuesPrior?: boolean
  continuesAfter?: boolean
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  rtl?: boolean
  onSelect?: (event: TEvent, e: React.SyntheticEvent) => void
  onDoubleClick?: (event: TEvent, e: React.SyntheticEvent) => void
  onKeyPress?: (event: TEvent, e: React.KeyboardEvent) => void
}

export function TimeGridEvent<TEvent extends CalendarEvent = CalendarEvent>({
  event,
  style,
  label,
  selected,
  isBackgroundEvent,
  continuesPrior,
  continuesAfter,
  accessors,
  getters,
  localizer,
  components,
  rtl,
  onSelect,
  onDoubleClick,
  onKeyPress,
}: TimeGridEventProps<TEvent>) {
  const title = accessors.title(event)
  const tooltip = accessors.tooltip(event)
  const end = accessors.end(event)
  const start = accessors.start(event)
  const isSelectedEvent = checkSelected(event, selected)
  const { className: userClassName, style: userStyle } = getters.eventProp(
    event,
    start,
    end,
    isSelectedEvent,
  )

  const EventComponent = components.day?.event ?? components.event

  const inlineStyle: React.CSSProperties = {
    ...userStyle,
    top: `${style.top}%`,
    height: `${style.height}%`,
    width: `${style.width}%`,
    [rtl ? "right" : "left"]: `${style.xOffset}%`,
  }

  return (
    <div
      data-event
      tabIndex={0}
      title={tooltip || title}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(event, e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick?.(event, e)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect?.(event, e)
        }
        onKeyPress?.(event, e)
      }}
      style={inlineStyle}
      className={cn(
        "absolute z-10 overflow-hidden rounded-md border px-1.5 py-0.5 text-xs leading-tight cursor-pointer",
        isBackgroundEvent
          ? "bg-calendar-event/20 border-calendar-event/30 text-foreground pointer-events-none z-0"
          : "bg-calendar-event text-calendar-event-foreground border-calendar-event/50",
        "hover:opacity-90 transition-opacity",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelectedEvent && "ring-2 ring-ring z-20",
        continuesPrior && "rounded-t-none border-t-0",
        continuesAfter && "rounded-b-none border-b-0",
        userClassName,
      )}
    >
      {EventComponent ? (
        <EventComponent
          event={event}
          title={title}
          localizer={localizer}
          continuesPrior={continuesPrior}
          continuesAfter={continuesAfter}
        />
      ) : (
        <div className="flex flex-col gap-0">
          {label && (
            <span className="text-[10px] font-normal opacity-80 truncate">{label}</span>
          )}
          <span className="font-medium truncate">{title}</span>
        </div>
      )}
    </div>
  )
}
