"use client"

import * as React from "react"
import { useMemo, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import type {
  CalendarEvent,
  Accessors,
  Getters,
  DateLocalizer,
  CalendarComponents,
  View,
  NavigateAction,
} from "../types"
import { navigate, views } from "../constants"
import { DateContentRow } from "../components/date-content-row"
import { EventPopup } from "../components/event-popup"
import { DateHeader } from "../components/headers"
import * as dates from "../lib/dates"
import { chunk } from "../helpers"

export interface MonthViewProps<TEvent extends CalendarEvent = CalendarEvent> {
  date: Date
  events: TEvent[]
  backgroundEvents?: TEvent[]
  getNow: () => Date
  selected?: TEvent
  selectable?: boolean | "ignoreEvents"
  longPressThreshold?: number
  popup?: boolean
  popupOffset?: number | { x: number; y: number }
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  rtl?: boolean
  onSelectSlot?: (slotInfo: {
    start: Date
    end: Date
    slots: Date[]
    action: string
  }) => void
  onSelect?: (event: TEvent, e: React.SyntheticEvent) => void
  onDoubleClick?: (event: TEvent, e: React.SyntheticEvent) => void
  onKeyPress?: (event: TEvent, e: React.KeyboardEvent) => void
  onShowMore?: (events: TEvent[], date: Date, cell: HTMLElement, slot: number) => void
  onDrillDown?: (date: Date, view: View) => void
  onNavigate?: (action: NavigateAction, date?: Date) => void
}

export function MonthView<TEvent extends CalendarEvent = CalendarEvent>({
  date,
  events,
  backgroundEvents = [],
  getNow,
  selected,
  selectable,
  longPressThreshold,
  popup,
  accessors,
  getters,
  localizer,
  components,
  onSelectSlot,
  onSelect,
  onDoubleClick,
  onKeyPress,
  onShowMore: onShowMoreProp,
  onDrillDown,
}: MonthViewProps<TEvent>) {
  const [popupState, setPopupState] = useState<{
    events: TEvent[]
    date: Date
    anchorEl: HTMLElement | null
  } | null>(null)

  const popupAnchorRef = useRef<HTMLElement | null>(null)

  // Build weeks grid
  const month = useMemo(() => {
    const start = localizer.firstVisibleDay(date)
    const end = localizer.lastVisibleDay(date)
    const allDays = dates.range(start, end, "day")
    return chunk(allDays, 7)
  }, [date, localizer])

  // Filter events for the visible range
  const visibleEvents = useMemo(() => {
    if (month.length === 0) return []
    const start = month[0][0]
    const end = month[month.length - 1][6]
    return events.filter((evt) => {
      const evtStart = accessors.start(evt)
      const evtEnd = accessors.end(evt)
      return localizer.inRange(evtStart, start, end) || localizer.inRange(evtEnd, start, end) ||
        (localizer.lt(evtStart, start) && localizer.gt(evtEnd, end))
    })
  }, [month, events, accessors, localizer])

  // Week day headers
  const headers = useMemo(() => {
    if (month.length === 0) return []
    return month[0].map((d) => ({
      date: d,
      label: localizer.format(d, "weekdayFormat"),
    }))
  }, [month, localizer])

  const handleShowMore = useCallback(
    (evts: TEvent[], d: Date, cell: HTMLElement, slot: number) => {
      if (popup) {
        popupAnchorRef.current = cell
        setPopupState({ events: evts, date: d, anchorEl: cell })
      }
      onShowMoreProp?.(evts, d, cell, slot)
    },
    [popup, onShowMoreProp],
  )

  const handleDrillDown = useCallback(
    (d: Date) => {
      onDrillDown?.(d, views.DAY as View)
    },
    [onDrillDown],
  )

  return (
    <div className="flex flex-col h-full" role="grid">
      {/* Weekday headers */}
      <div className="flex flex-row border-b border-border" role="row">
        {headers.map((h, idx) => (
          <div
            key={idx}
            className="flex-1 text-center py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
            role="columnheader"
          >
            {h.label}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="flex-1 flex flex-col">
        {month.map((week, weekIdx) => (
          <div key={weekIdx} className="flex-1 border-b border-border/50 last:border-b-0">
            <DateContentRow
              range={week}
              date={date}
              events={visibleEvents}
              maxRows={6}
              getNow={getNow}
              selected={selected}
              selectable={selectable}
              longPressThreshold={longPressThreshold}
              accessors={accessors}
              getters={getters}
              localizer={localizer}
              components={components}
              onSelect={onSelect}
              onDoubleClick={onDoubleClick}
              onKeyPress={onKeyPress}
              onSelectSlot={onSelectSlot}
              onShowMore={handleShowMore}
              renderHeader={({ date: d, key }) => {
                const isToday = localizer.isSameDate(d, getNow())
                const isOffRange = !localizer.isSameDate(d, date, "month")
                return (
                  <DateHeader
                    key={key}
                    date={d}
                    label={localizer.format(d, "dateFormat")}
                    isToday={isToday}
                    isOffRange={isOffRange}
                    drilldownView="day"
                    onDrillDown={() => handleDrillDown(d)}
                  />
                )
              }}
            />
          </div>
        ))}
      </div>

      {/* Show-more popup */}
      {popup && popupState && (
        <EventPopup
          events={popupState.events}
          date={popupState.date}
          open={!!popupState}
          onOpenChange={(open) => {
            if (!open) setPopupState(null)
          }}
          anchorRef={popupAnchorRef}
          accessors={accessors}
          getters={getters}
          localizer={localizer}
          components={components}
          selected={selected}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          onKeyPress={onKeyPress}
        />
      )}
    </div>
  )
}

// Static navigation methods
MonthView.range = (date: Date, localizer: DateLocalizer) => {
  const start = localizer.firstVisibleDay(date)
  const end = localizer.lastVisibleDay(date)
  return { start, end }
}

MonthView.navigate = (date: Date, action: NavigateAction, localizer: DateLocalizer) => {
  switch (action) {
    case navigate.PREVIOUS:
      return localizer.add(date, -1, "month")
    case navigate.NEXT:
      return localizer.add(date, 1, "month")
    default:
      return date
  }
}

MonthView.title = (date: Date, localizer: DateLocalizer) => {
  return localizer.format(date, "monthHeaderFormat")
}
