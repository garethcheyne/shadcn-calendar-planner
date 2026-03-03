"use client"

import * as React from "react"
import { useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { CalendarEvent, DateLocalizer, Getters } from "../types"

export interface BackgroundCellsProps<TEvent extends CalendarEvent = CalendarEvent> {
  range: Date[]
  date?: Date
  getNow: () => Date
  getters: Getters<TEvent>
  localizer: DateLocalizer
  selectable?: boolean | "ignoreEvents"
  longPressThreshold?: number
  onSelectSlot?: (slotInfo: {
    start: Date
    end: Date
    slots: Date[]
    action: "click" | "doubleClick" | "select"
    bounds?: DOMRect
    box?: { x: number; y: number; clientX: number; clientY: number }
  }) => void
  resourceId?: string | number
}

export function BackgroundCells<TEvent extends CalendarEvent = CalendarEvent>({
  range,
  date,
  getNow,
  getters,
  localizer,
  selectable,
  onSelectSlot,
  resourceId,
}: BackgroundCellsProps<TEvent>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selecting, setSelecting] = React.useState(false)
  const [selectStart, setSelectStart] = React.useState<number | null>(null)
  const [selectEnd, setSelectEnd] = React.useState<number | null>(null)

  const now = getNow()
  const currentDate = date || now

  const handleCellClick = useCallback(
    (idx: number) => {
      if (!selectable) return
      const slot = range[idx]
      const slotEnd = localizer.add(slot, 1, "day")
      onSelectSlot?.({
        start: slot,
        end: slotEnd,
        slots: [slot],
        action: "click",
      })
    },
    [selectable, range, localizer, onSelectSlot],
  )

  const handleCellDoubleClick = useCallback(
    (idx: number) => {
      if (!selectable) return
      const slot = range[idx]
      const slotEnd = localizer.add(slot, 1, "day")
      onSelectSlot?.({
        start: slot,
        end: slotEnd,
        slots: [slot],
        action: "doubleClick",
      })
    },
    [selectable, range, localizer, onSelectSlot],
  )

  const handleMouseDown = useCallback(
    (idx: number) => {
      if (!selectable) return
      setSelecting(true)
      setSelectStart(idx)
      setSelectEnd(idx)
    },
    [selectable],
  )

  const handleMouseEnter = useCallback(
    (idx: number) => {
      if (!selecting) return
      setSelectEnd(idx)
    },
    [selecting],
  )

  useEffect(() => {
    if (!selecting) return
    const handleMouseUp = () => {
      if (selectStart !== null && selectEnd !== null) {
        const start = Math.min(selectStart, selectEnd)
        const end = Math.max(selectStart, selectEnd)
        const slots = range.slice(start, end + 1)
        onSelectSlot?.({
          start: slots[0],
          end: localizer.add(slots[slots.length - 1], 1, "day"),
          slots,
          action: "select",
        })
      }
      setSelecting(false)
      setSelectStart(null)
      setSelectEnd(null)
    }
    window.addEventListener("mouseup", handleMouseUp)
    return () => window.removeEventListener("mouseup", handleMouseUp)
  }, [selecting, selectStart, selectEnd, range, localizer, onSelectSlot])

  const isInSelection = (idx: number) => {
    if (!selecting || selectStart === null || selectEnd === null) return false
    const start = Math.min(selectStart, selectEnd)
    const end = Math.max(selectStart, selectEnd)
    return idx >= start && idx <= end
  }

  return (
    <div ref={containerRef} className="flex flex-row absolute inset-0">
      {range.map((slot, idx) => {
        const isToday = localizer.isSameDate(slot, now)
        const isOffRange = !localizer.isSameDate(slot, currentDate, "month")
        const { className: userClassName, style: userStyle } =
          getters.dayProp?.(slot) ?? {}

        return (
          <div
            key={idx}
            className={cn(
              "flex-1 border-l border-border/50 first:border-l-0",
              isToday && "bg-calendar-today",
              isOffRange && "bg-calendar-off-range",
              isInSelection(idx) && "bg-calendar-selected/30",
              selectable && "cursor-cell",
              userClassName,
            )}
            style={userStyle}
            onClick={() => handleCellClick(idx)}
            onDoubleClick={() => handleCellDoubleClick(idx)}
            onMouseDown={() => handleMouseDown(idx)}
            onMouseEnter={() => handleMouseEnter(idx)}
          />
        )
      })}
    </div>
  )
}
