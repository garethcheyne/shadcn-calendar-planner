"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"
import type {
  CalendarEvent,
  Accessors,
  Getters,
  DateLocalizer,
  CalendarComponents,
} from "../types"
import { EventCell } from "./event-cell"

export interface EventPopupProps<TEvent extends CalendarEvent = CalendarEvent> {
  events: TEvent[]
  date: Date
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorRef: React.RefObject<HTMLElement | null>
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  localizer: DateLocalizer
  components: CalendarComponents<TEvent>
  selected?: TEvent
  onSelect?: (event: TEvent, e: React.SyntheticEvent) => void
  onDoubleClick?: (event: TEvent, e: React.SyntheticEvent) => void
  onKeyPress?: (event: TEvent, e: React.KeyboardEvent) => void
}

export function EventPopup<TEvent extends CalendarEvent = CalendarEvent>({
  events,
  date,
  open,
  onOpenChange,
  anchorRef,
  accessors,
  getters,
  localizer,
  components,
  selected,
  onSelect,
  onDoubleClick,
  onKeyPress,
}: EventPopupProps<TEvent>) {
  const label = localizer.format(date, "dayHeaderFormat")

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Anchor
        ref={anchorRef as React.RefObject<HTMLDivElement>}
        className="absolute"
      />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-60 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover p-3 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <div className="mb-2">
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </div>
          <div className="flex flex-col gap-1">
            {events.map((event, idx) => (
              <EventCell
                key={idx}
                event={event}
                selected={selected}
                accessors={accessors}
                getters={getters}
                localizer={localizer}
                components={components}
                onSelect={onSelect}
                onDoubleClick={onDoubleClick}
                onKeyPress={onKeyPress}
              />
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
