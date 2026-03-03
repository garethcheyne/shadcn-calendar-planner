"use client"

import * as React from "react"
import { useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import type {
  CalendarEvent,
  Accessors,
  Getters,
  DateLocalizer,
  CalendarComponents,
} from "../types"
import { isSelected as checkSelected } from "../helpers"
import { useDnD } from "../hooks/use-dnd"

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
  const { enabled: dndEnabled, dragState, beginDrag } = useDnD<TEvent>()
  const isDragging = dragState?.event === event

  const EventComponent = components.event

  // Month-view drag: start a "move" on pointerDown
  const pointerOrigin = useRef<{ x: number; y: number } | null>(null)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!dndEnabled) return
      pointerOrigin.current = { x: e.clientX, y: e.clientY }
    },
    [dndEnabled],
  )
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dndEnabled || !pointerOrigin.current) return
      const dx = Math.abs(e.clientX - pointerOrigin.current.x)
      const dy = Math.abs(e.clientY - pointerOrigin.current.y)
      if (dx + dy > 5) {
        beginDrag(event, "move")
        pointerOrigin.current = null
      }
    },
    [dndEnabled, beginDrag, event],
  )
  const handlePointerUp = useCallback(() => {
    pointerOrigin.current = null
  }, [])

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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
        dndEnabled && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-primary",
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
  /** The column date for this event (used for DnD calculations) */
  columnDate?: Date
  /** The min/max of the day column (for DnD time resolution) */
  columnMin?: Date
  columnMax?: Date
  /** Step in minutes */
  step?: number
  /** Resource id of the column */
  resource?: string | number
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
  columnMin,
  columnMax,
  step = 30,
  resource,
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

  const { enabled: dndEnabled, dragState, beginDrag, updatePreview, endDrag, cancelDrag } = useDnD<TEvent>()
  const isDragging = dragState?.event === event
  const eventRef = useRef<HTMLDivElement>(null)
  const dragOriginRef = useRef<{ y: number; action: "move" | "resize"; startTop: number; startHeight: number } | null>(null)

  const EventComponent = components.day?.event ?? components.event

  // ── Drag-to-move: pointer handlers on the event body ──
  const handleMovePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!dndEnabled || isBackgroundEvent) return
      // Ignore if clicking the resize handle
      if ((e.target as HTMLElement).dataset.resizeHandle) return
      e.stopPropagation()
      dragOriginRef.current = { y: e.clientY, action: "move", startTop: style.top, startHeight: style.height }
    },
    [dndEnabled, isBackgroundEvent, style.top, style.height],
  )

  const handleMovePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragOriginRef.current || dragOriginRef.current.action !== "move") return
      const dy = Math.abs(e.clientY - dragOriginRef.current.y)
      if (dy < 5 && !isDragging) return // deadzone

      if (!isDragging) {
        beginDrag(event, "move")
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      }

      // Calculate new time based on pointer position in the column
      const column = eventRef.current?.parentElement
      if (!column || !columnMin || !columnMax) return
      const bounds = column.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (e.clientY - bounds.top) / bounds.height))
      const totalMinutes = (columnMax.getTime() - columnMin.getTime()) / 60000
      const minuteOffset = Math.round((pct * totalMinutes) / step) * step
      const newStart = new Date(columnMin.getTime() + minuteOffset * 60000)
      const duration = end.getTime() - start.getTime()
      const newEnd = new Date(newStart.getTime() + duration)

      updatePreview(newStart, newEnd, resource)
    },
    [isDragging, beginDrag, event, updatePreview, columnMin, columnMax, step, start, end, resource],
  )

  const handleMovePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragOriginRef.current) return
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
      if (isDragging) {
        endDrag()
      }
      dragOriginRef.current = null
    },
    [isDragging, endDrag],
  )

  // ── Drag-to-resize: pointer handlers on the bottom handle ──
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!dndEnabled || isBackgroundEvent) return
      e.stopPropagation()
      e.preventDefault()
      dragOriginRef.current = { y: e.clientY, action: "resize", startTop: style.top, startHeight: style.height }
      beginDrag(event, "resize", "DOWN")
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [dndEnabled, isBackgroundEvent, style.top, style.height, beginDrag, event],
  )

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragOriginRef.current || dragOriginRef.current.action !== "resize") return
      const column = eventRef.current?.parentElement
      if (!column || !columnMin || !columnMax) return

      const bounds = column.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (e.clientY - bounds.top) / bounds.height))
      const totalMinutes = (columnMax.getTime() - columnMin.getTime()) / 60000
      const minuteOffset = Math.round((pct * totalMinutes) / step) * step
      const newEnd = new Date(columnMin.getTime() + minuteOffset * 60000)
      // Don't allow resize to before start + one step
      const minEnd = new Date(start.getTime() + step * 60000)
      const clampedEnd = newEnd < minEnd ? minEnd : newEnd

      updatePreview(start, clampedEnd, resource)
    },
    [columnMin, columnMax, step, start, updatePreview, resource],
  )

  const handleResizePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragOriginRef.current || dragOriginRef.current.action !== "resize") return
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      endDrag()
      dragOriginRef.current = null
    },
    [endDrag],
  )

  // Escape to cancel
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && isDragging) {
        cancelDrag()
        dragOriginRef.current = null
        return
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onSelect?.(event, e)
      }
      onKeyPress?.(event, e)
    },
    [isDragging, cancelDrag, onSelect, onKeyPress, event],
  )

  // ── Compute displayed position (use preview when dragging) ──
  let displayTop = style.top
  let displayHeight = style.height
  if (isDragging && dragState?.previewStart && dragState?.previewEnd && columnMin && columnMax) {
    const totalMs = columnMax.getTime() - columnMin.getTime()
    if (totalMs > 0) {
      const previewTopMs = dragState.previewStart.getTime() - columnMin.getTime()
      const previewEndMs = dragState.previewEnd.getTime() - columnMin.getTime()
      displayTop = Math.max(0, (previewTopMs / totalMs) * 100)
      displayHeight = Math.max(0, ((previewEndMs - previewTopMs) / totalMs) * 100)
    }
  }

  const inlineStyle: React.CSSProperties = {
    ...userStyle,
    top: `${displayTop}%`,
    height: `${displayHeight}%`,
    width: `${style.width}%`,
    [rtl ? "right" : "left"]: `${style.xOffset}%`,
  }

  return (
    <div
      ref={eventRef}
      data-event
      tabIndex={0}
      title={tooltip || title}
      onClick={(e) => {
        if (isDragging) return
        e.stopPropagation()
        onSelect?.(event, e)
      }}
      onDoubleClick={(e) => {
        if (isDragging) return
        e.stopPropagation()
        onDoubleClick?.(event, e)
      }}
      onKeyDown={handleKeyDown}
      onPointerDown={handleMovePointerDown}
      onPointerMove={handleMovePointerMove}
      onPointerUp={handleMovePointerUp}
      style={inlineStyle}
      className={cn(
        "absolute z-10 overflow-hidden rounded-md border px-1.5 py-0.5 text-xs leading-tight",
        isBackgroundEvent
          ? "bg-calendar-event/20 border-calendar-event/30 text-foreground pointer-events-none z-0"
          : "bg-calendar-event text-calendar-event-foreground border-calendar-event/50",
        "hover:opacity-90 transition-opacity",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelectedEvent && "ring-2 ring-ring z-20",
        continuesPrior && "rounded-t-none border-t-0",
        continuesAfter && "rounded-b-none border-b-0",
        dndEnabled && !isBackgroundEvent && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-70 ring-2 ring-primary z-30 shadow-lg",
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

      {/* ── Resize handle (bottom edge) ── */}
      {dndEnabled && !isBackgroundEvent && !continuesAfter && (
        <div
          data-resize-handle="true"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          className={cn(
            "absolute bottom-0 left-0 right-0 h-2 cursor-s-resize z-40",
            "after:content-[''] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2",
            "after:w-6 after:h-0.5 after:rounded-full after:bg-current after:opacity-0",
            "hover:after:opacity-40",
          )}
        />
      )}
    </div>
  )
}
