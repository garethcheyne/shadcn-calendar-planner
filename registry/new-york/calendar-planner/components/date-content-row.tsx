"use client"

import * as React from "react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type {
  CalendarEvent,
  Accessors,
  Getters,
  DateLocalizer,
  CalendarComponents,
} from "../types"
import { getDateSlotMetrics } from "../lib/date-slot-metrics"
import { BackgroundCells } from "./background-cells"
import { EventRow } from "./event-row"
import { DateHeader } from "./headers"

export interface DateContentRowProps<TEvent extends CalendarEvent = CalendarEvent> {
  range: Date[]
  date: Date
  events: TEvent[]
  backgroundEvents?: TEvent[]
  maxRows?: number
  renderHeader: (props: {
    date: Date
    key: string
    className?: string
  }) => React.ReactNode
  renderForMeasure?: boolean
  getNow: () => Date
  selected?: TEvent
  selectable?: boolean | "ignoreEvents"
  longPressThreshold?: number
  isAllDay?: boolean
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  onSelect?: (event: TEvent, e: React.SyntheticEvent) => void
  onDoubleClick?: (event: TEvent, e: React.SyntheticEvent) => void
  onKeyPress?: (event: TEvent, e: React.KeyboardEvent) => void
  onSelectSlot?: (slotInfo: {
    start: Date
    end: Date
    slots: Date[]
    action: string
    bounds?: DOMRect
    box?: { x: number; y: number }
  }) => void
  onShowMore?: (events: TEvent[], date: Date, cell: HTMLElement, slot: number) => void
  resourceId?: string | number
  rtl?: boolean
}

export function DateContentRow<TEvent extends CalendarEvent = CalendarEvent>({
  range,
  date,
  events,
  backgroundEvents = [],
  maxRows = 5,
  renderHeader,
  renderForMeasure,
  getNow,
  selected,
  selectable,
  longPressThreshold,
  isAllDay,
  accessors,
  getters,
  localizer,
  components,
  onSelect,
  onDoubleClick,
  onKeyPress,
  onSelectSlot,
  onShowMore,
  resourceId,
}: DateContentRowProps<TEvent>) {
  const metrics = useMemo(
    () =>
      getDateSlotMetrics({
        range,
        events,
        maxRows,
        minRows: 0,
        accessors,
        localizer,
      }),
    [range, events, maxRows, accessors, localizer],
  )

  const { levels, extra } = metrics

  return (
    <div className={cn("relative", "min-h-25")}>
      {/* Background cells (selection, today, off-range) */}
      <BackgroundCells
        range={range}
        date={date}
        getNow={getNow}
        getters={getters}
        localizer={localizer}
        selectable={selectable}
        longPressThreshold={longPressThreshold}
        onSelectSlot={onSelectSlot}
        resourceId={resourceId}
      />

      {/* Header row - date numbers */}
      <div className="relative flex flex-row">
        {range.map((d, idx) => {
          const isToday = localizer.isSameDate(d, getNow())
          const isOffRange = !localizer.isSameDate(d, date, "month")
          return (
            <div key={idx} className="flex-1 text-center py-1">
              {renderHeader ? (
                renderHeader({ date: d, key: `hdr-${idx}` })
              ) : (
                <DateHeader
                  date={d}
                  label={localizer.format(d, "dateFormat")}
                  isToday={isToday}
                  isOffRange={isOffRange}
                  drilldownView="day"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Event rows */}
      <div className="relative">
        {levels.map((segs, idx) => (
          <EventRow
            key={idx}
            segments={segs}
            slotMetrics={{ slots: range.length, range }}
            accessors={accessors}
            getters={getters}
            localizer={localizer}
            components={components}
            selected={selected}
            onSelect={onSelect}
            onDoubleClick={onDoubleClick}
            onKeyPress={onKeyPress}
            isAllDay={isAllDay}
          />
        ))}

        {/* Show more */}
        {extra.length > 0 && (
          <div className="flex flex-row">
            {range.map((d, idx) => {
              const eventsForDay = extra.filter((seg) =>
                localizer.inRange(d, accessors.start(seg.event), accessors.end(seg.event), "day"),
              )
              if (eventsForDay.length === 0) {
                return <div key={idx} className="flex-1" />
              }
              return (
                <div key={idx} className="flex-1 px-0.5">
                  <button
                    type="button"
                    className="w-full text-xs text-primary font-medium hover:underline text-left px-1"
                    onClick={(e) => {
                      const cell = e.currentTarget.parentElement
                      onShowMore?.(
                        eventsForDay.map((s) => s.event),
                        d,
                        cell as HTMLElement,
                        idx,
                      )
                    }}
                  >
                    +{eventsForDay.length} more
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
