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
import { DateContentRow } from "./date-content-row"
import { Header } from "./headers"

export interface TimeGridHeaderProps<TEvent extends CalendarEvent = CalendarEvent> {
  range: Date[]
  events: TEvent[]
  width?: number
  getNow: () => Date
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  selected?: TEvent
  selectable?: boolean | "ignoreEvents"
  isOverflowing?: boolean
  rtl?: boolean
  resources?: { id: string | number; title: string }[]
  scrollRef?: React.RefObject<HTMLDivElement | null>
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

export function TimeGridHeader<TEvent extends CalendarEvent = CalendarEvent>({
  range,
  events,
  getNow,
  accessors,
  getters,
  localizer,
  components,
  selected,
  selectable,
  isOverflowing,
  resources,
  scrollRef,
  onSelectSlot,
  onSelect,
  onDoubleClick,
  onKeyPress,
  onDrillDown,
}: TimeGridHeaderProps<TEvent>) {
  const HeaderComponent = components.header ?? Header

  return (
    <div
      ref={scrollRef}
      className={cn(
        "border-b border-border bg-background sticky top-0 z-20",
        isOverflowing && "overflow-y-scroll",
      )}
    >
      {/* Day headers */}
      <div className="flex flex-row">
        {/* Gutter spacer */}
        <div className="w-16 shrink-0 border-r border-border" />

        {resources && resources.length > 0 ? (
          // Resource columns
          resources.map((resource) => (
            <div key={resource.id} className="flex-1 min-w-0">
              <div className="flex flex-row">
                {range.map((date, idx) => {
                  const label = localizer.format(date, "dayFormat")
                  return (
                    <div key={idx} className="flex-1 text-center py-1.5 border-l border-border/50 first:border-l-0">
                      <div className="text-[10px] text-muted-foreground">{resource.title}</div>
                      <HeaderComponent
                        date={date}
                        label={label}
                        localizer={localizer}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          // Regular day headers
          range.map((date, idx) => {
            const label = localizer.format(date, "dayFormat")
            return (
              <div
                key={idx}
                className="flex-1 text-center py-1.5 border-l border-border/50 first:border-l-0"
              >
                <button
                  type="button"
                  title={label}
                  className={cn(
                    "inline-flex flex-col items-center gap-0.5",
                    "hover:text-primary transition-colors",
                  )}
                  onClick={() => onDrillDown?.(date, "day")}
                >
                  <HeaderComponent
                    date={date}
                    label={label}
                    localizer={localizer}
                  />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* All-day events row */}
      {events.length > 0 && (
        <div className="flex flex-row border-t border-border/50">
          <div className="w-16 shrink-0 border-r border-border flex items-center justify-end pr-2">
            <span className="text-[10px] text-muted-foreground">all-day</span>
          </div>
          <div className="flex-1 min-w-0">
            <DateContentRow
              range={range}
              date={range[0]}
              events={events}
              maxRows={3}
              getNow={getNow}
              selected={selected}
              selectable={selectable}
              isAllDay
              accessors={accessors}
              getters={getters}
              localizer={localizer}
              components={components}
              onSelect={onSelect}
              onDoubleClick={onDoubleClick}
              onKeyPress={onKeyPress}
              onSelectSlot={onSelectSlot}
              renderHeader={() => null}
            />
          </div>
        </div>
      )}
    </div>
  )
}
