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
  NavigateAction,
} from "../types"
import { navigate } from "../constants"
import * as dates from "../lib/dates"

export interface AgendaViewProps<TEvent extends CalendarEvent = CalendarEvent> {
  date: Date
  events: TEvent[]
  length?: number
  getNow: () => Date
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  selected?: TEvent
  onSelect?: (event: TEvent, e: React.SyntheticEvent) => void
  onDoubleClick?: (event: TEvent, e: React.SyntheticEvent) => void
  onKeyPress?: (event: TEvent, e: React.KeyboardEvent) => void
}

export function AgendaView<TEvent extends CalendarEvent = CalendarEvent>({
  date,
  events,
  length = 30,
  getNow,
  accessors,
  getters,
  localizer,
  components,
  selected,
  onSelect,
  onDoubleClick,
}: AgendaViewProps<TEvent>) {
  const end = localizer.add(date, length, "day")

  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const start = accessors.start(evt)
        const evtEnd = accessors.end(evt)
        return localizer.inRange(start, date, end) || localizer.inRange(evtEnd, date, end) ||
          (localizer.lt(start, date) && localizer.gt(evtEnd, end))
      })
      .sort((a, b) => +accessors.start(a) - +accessors.start(b))
  }, [events, accessors, localizer, date, end])

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, TEvent[]>()
    for (const evt of filteredEvents) {
      const key = localizer.startOf(accessors.start(evt), "day").toISOString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(evt)
    }
    return map
  }, [filteredEvents, accessors, localizer])

  const EventComponent = components.agenda?.event ?? components.event

  if (filteredEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <span className="text-sm">No events in this range.</span>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide p-2 border-b border-border w-28">
              Date
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide p-2 border-b border-border w-40">
              Time
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide p-2 border-b border-border">
              Event
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from(grouped.entries()).map(([dayKey, dayEvents]) => {
            const dayDate = new Date(dayKey)
            return dayEvents.map((event, idx) => {
              const start = accessors.start(event)
              const evtEnd = accessors.end(event)
              const title = accessors.title(event)
              const isAllDay = accessors.allDay(event) || localizer.diff(start, evtEnd, "day") >= 1
              const { className: userClassName, style: userStyle } = getters.eventProp(
                event,
                start,
                evtEnd,
                event === selected,
              )

              return (
                <tr
                  key={`${dayKey}-${idx}`}
                  className={cn(
                    "hover:bg-accent/50 transition-colors cursor-pointer",
                    event === selected && "bg-accent",
                    userClassName,
                  )}
                  style={userStyle}
                  onClick={(e) => onSelect?.(event, e)}
                  onDoubleClick={(e) => onDoubleClick?.(event, e)}
                >
                  {/* Date column - only on first event of the day */}
                  <td className="p-2 border-b border-border/50 align-top text-sm">
                    {idx === 0 && (
                      <span className="font-medium">
                        {localizer.format(dayDate, "agendaDateFormat")}
                      </span>
                    )}
                  </td>
                  {/* Time column */}
                  <td className="p-2 border-b border-border/50 align-top text-sm text-muted-foreground">
                    {isAllDay ? (
                      <span>All Day</span>
                    ) : (
                      <span>{localizer.format({ start, end: evtEnd }, "agendaTimeRangeFormat")}</span>
                    )}
                  </td>
                  {/* Event column */}
                  <td className="p-2 border-b border-border/50 align-top">
                    {EventComponent ? (
                      <EventComponent
                        event={event}
                        title={title}
                        localizer={localizer}
                      />
                    ) : (
                      <span className="text-sm font-medium">{title}</span>
                    )}
                  </td>
                </tr>
              )
            })
          })}
        </tbody>
      </table>
    </div>
  )
}

AgendaView.range = (date: Date, localizer: DateLocalizer, length = 30) => {
  const end = localizer.add(date, length, "day")
  return { start: date, end }
}

AgendaView.navigate = (date: Date, action: NavigateAction, localizer: DateLocalizer, length = 30) => {
  switch (action) {
    case navigate.PREVIOUS:
      return localizer.add(date, -length, "day")
    case navigate.NEXT:
      return localizer.add(date, length, "day")
    default:
      return date
  }
}

AgendaView.title = (date: Date, localizer: DateLocalizer, length = 30) => {
  const end = localizer.add(date, length, "day")
  return localizer.format({ start: date, end }, "agendaHeaderFormat")
}
