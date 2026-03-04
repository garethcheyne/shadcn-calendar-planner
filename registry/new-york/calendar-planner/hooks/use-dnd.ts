"use client"

import * as React from "react"
import { createContext, useContext, useRef, useCallback, useState, useEffect } from "react"
import type { CalendarEvent, EventInteractionArgs, Accessor } from "../types"

// ─── DnD State ────────────────────────────────────────────────────
export type DragAction = "move" | "resize"

export interface DragState<TEvent = CalendarEvent> {
  /** The event being dragged */
  event: TEvent
  /** Whether we're moving or resizing */
  action: DragAction
  /** For resize: direction (only "DOWN" for now) */
  direction?: "UP" | "DOWN"
  /** Accessor-resolved start of the event (set once at beginDrag) */
  resolvedStart?: Date
  /** Accessor-resolved end of the event (set once at beginDrag) */
  resolvedEnd?: Date
  /** Preview start date while dragging */
  previewStart?: Date
  /** Preview end date while dragging */
  previewEnd?: Date
  /** Resource column being hovered */
  previewResourceId?: string | number
}

export interface DnDContextValue<TEvent = CalendarEvent> {
  /** Current drag state, null if not dragging */
  dragState: DragState<TEvent> | null
  /** Start a drag operation */
  beginDrag: (event: TEvent, action: DragAction, direction?: "UP" | "DOWN", resolvedStart?: Date, resolvedEnd?: Date) => void
  /** Update the preview position during drag */
  updatePreview: (start: Date, end: Date, resourceId?: string | number) => void
  /** End drag — fires the callback */
  endDrag: () => void
  /** Cancel drag — no callback */
  cancelDrag: () => void
  /** Whether DnD is enabled */
  enabled: boolean
  /** Per-event: is this event draggable? */
  isDraggable: (event: TEvent) => boolean
  /** Per-event: is this event resizable? */
  isResizable: (event: TEvent) => boolean
  /** Callbacks */
  onEventDrop?: (args: EventInteractionArgs<TEvent>) => void
  onEventResize?: (args: EventInteractionArgs<TEvent>) => void
  onDragStart?: (args: { event: TEvent; action: DragAction; direction?: "UP" | "DOWN" }) => void
  onDragEnd?: (args: { event: TEvent; action: DragAction }) => void
}

const DnDContext = createContext<DnDContextValue<any>>({
  dragState: null,
  beginDrag: () => {},
  updatePreview: () => {},
  endDrag: () => {},
  cancelDrag: () => {},
  enabled: false,
  isDraggable: () => true,
  isResizable: () => true,
})

export function useDnD<TEvent extends CalendarEvent = CalendarEvent>() {
  return useContext(DnDContext) as DnDContextValue<TEvent>
}

// ─── Provider ─────────────────────────────────────────────────────
export interface DnDProviderProps<TEvent extends CalendarEvent = CalendarEvent> {
  children: React.ReactNode
  enabled: boolean
  draggableAccessor?: Accessor<TEvent, boolean>
  resizableAccessor?: Accessor<TEvent, boolean>
  onEventDrop?: (args: EventInteractionArgs<TEvent>) => void
  onEventResize?: (args: EventInteractionArgs<TEvent>) => void
  onDragStart?: (args: { event: TEvent; action: DragAction; direction?: "UP" | "DOWN" }) => void
  onDragEnd?: (args: { event: TEvent; action: DragAction }) => void
}

function resolveAccessor<TEvent, TVal>(acc: Accessor<TEvent, TVal> | undefined, event: TEvent, fallback: TVal): TVal {
  if (acc === undefined) return fallback
  if (typeof acc === "function") return (acc as (e: TEvent) => TVal)(event)
  if (typeof acc === "string" && event != null && typeof event === "object") {
    return (event as Record<string, unknown>)[acc as string] as TVal
  }
  return fallback
}

export function DnDProvider<TEvent extends CalendarEvent = CalendarEvent>({
  children,
  enabled,
  draggableAccessor,
  resizableAccessor,
  onEventDrop,
  onEventResize,
  onDragStart,
  onDragEnd,
}: DnDProviderProps<TEvent>) {
  const [dragState, setDragState] = useState<DragState<TEvent> | null>(null)
  const dragRef = useRef<DragState<TEvent> | null>(null)

  const beginDrag = useCallback(
    (event: TEvent, action: DragAction, direction?: "UP" | "DOWN", resolvedStart?: Date, resolvedEnd?: Date) => {
      const state: DragState<TEvent> = { event, action, direction, resolvedStart, resolvedEnd }
      dragRef.current = state
      setDragState(state)
      onDragStart?.({ event, action, direction })
    },
    [onDragStart],
  )

  const updatePreview = useCallback(
    (start: Date, end: Date, resourceId?: string | number) => {
      if (!dragRef.current) return
      const next = { ...dragRef.current, previewStart: start, previewEnd: end, previewResourceId: resourceId }
      dragRef.current = next
      setDragState(next)
    },
    [],
  )

  const endDrag = useCallback(() => {
    const state = dragRef.current
    if (!state) return
    const { event, action, previewStart, previewEnd, previewResourceId } = state

    if (previewStart && previewEnd) {
      const args: EventInteractionArgs<TEvent> = {
        event,
        start: previewStart,
        end: previewEnd,
        resourceId: previewResourceId,
      }
      if (action === "move") {
        onEventDrop?.(args)
      } else if (action === "resize") {
        onEventResize?.(args)
      }
    }

    onDragEnd?.({ event, action })
    dragRef.current = null
    setDragState(null)
  }, [onEventDrop, onEventResize, onDragEnd])

  const cancelDrag = useCallback(() => {
    const state = dragRef.current
    if (state) {
      onDragEnd?.({ event: state.event, action: state.action })
    }
    dragRef.current = null
    setDragState(null)
  }, [onDragEnd])

  const isDraggable = useCallback(
    (event: TEvent) => resolveAccessor(draggableAccessor, event, true),
    [draggableAccessor],
  )

  const isResizable = useCallback(
    (event: TEvent) => resolveAccessor(resizableAccessor, event, true),
    [resizableAccessor],
  )

  const value: DnDContextValue<TEvent> = {
    dragState,
    beginDrag,
    updatePreview,
    endDrag,
    cancelDrag,
    enabled,
    isDraggable,
    isResizable,
    onEventDrop,
    onEventResize,
    onDragStart,
    onDragEnd,
  }

  // Global pointer-up safety net: if the user releases outside any drop target
  // (e.g. outside calendar bounds during a month-view drag), clean up the drag state.
  useEffect(() => {
    if (!dragState) return
    const handleGlobalPointerUp = () => {
      // If there's an active drag with a preview, complete it; otherwise cancel.
      if (dragRef.current?.previewStart && dragRef.current?.previewEnd) {
        endDrag()
      } else {
        cancelDrag()
      }
    }
    window.addEventListener("pointerup", handleGlobalPointerUp)
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp)
  }, [dragState, endDrag, cancelDrag])

  return React.createElement(DnDContext.Provider, { value }, children)
}
