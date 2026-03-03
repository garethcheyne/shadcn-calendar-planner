"use client"

import * as React from "react"
import { createContext, useContext, useRef, useCallback, useState } from "react"
import type { CalendarEvent, EventInteractionArgs } from "../types"

// ─── DnD State ────────────────────────────────────────────────────
export type DragAction = "move" | "resize"

export interface DragState<TEvent = CalendarEvent> {
  /** The event being dragged */
  event: TEvent
  /** Whether we're moving or resizing */
  action: DragAction
  /** For resize: direction (only "DOWN" for now) */
  direction?: "UP" | "DOWN"
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
  beginDrag: (event: TEvent, action: DragAction, direction?: "UP" | "DOWN") => void
  /** Update the preview position during drag */
  updatePreview: (start: Date, end: Date, resourceId?: string | number) => void
  /** End drag — fires the callback */
  endDrag: () => void
  /** Cancel drag — no callback */
  cancelDrag: () => void
  /** Whether DnD is enabled */
  enabled: boolean
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
})

export function useDnD<TEvent extends CalendarEvent = CalendarEvent>() {
  return useContext(DnDContext) as DnDContextValue<TEvent>
}

// ─── Provider ─────────────────────────────────────────────────────
export interface DnDProviderProps<TEvent extends CalendarEvent = CalendarEvent> {
  children: React.ReactNode
  enabled: boolean
  onEventDrop?: (args: EventInteractionArgs<TEvent>) => void
  onEventResize?: (args: EventInteractionArgs<TEvent>) => void
  onDragStart?: (args: { event: TEvent; action: DragAction; direction?: "UP" | "DOWN" }) => void
  onDragEnd?: (args: { event: TEvent; action: DragAction }) => void
}

export function DnDProvider<TEvent extends CalendarEvent = CalendarEvent>({
  children,
  enabled,
  onEventDrop,
  onEventResize,
  onDragStart,
  onDragEnd,
}: DnDProviderProps<TEvent>) {
  const [dragState, setDragState] = useState<DragState<TEvent> | null>(null)
  const dragRef = useRef<DragState<TEvent> | null>(null)

  const beginDrag = useCallback(
    (event: TEvent, action: DragAction, direction?: "UP" | "DOWN") => {
      const state: DragState<TEvent> = { event, action, direction }
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

  const value: DnDContextValue<TEvent> = {
    dragState,
    beginDrag,
    updatePreview,
    endDrag,
    cancelDrag,
    enabled,
    onEventDrop,
    onEventResize,
    onDragStart,
    onDragEnd,
  }

  return React.createElement(DnDContext.Provider, { value }, children)
}
