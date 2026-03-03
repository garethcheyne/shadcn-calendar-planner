"use client"

import { createContext, useContext } from "react"
import type {
  Accessors,
  CalendarComponents,
  CalendarEvent,
  DateLocalizer,
  Getters,
} from "./types"

export interface CalendarContextValue<TEvent extends CalendarEvent = CalendarEvent> {
  localizer: DateLocalizer
  accessors: Accessors<TEvent>
  getters: Getters<TEvent>
  components: CalendarComponents<TEvent>
  rtl?: boolean
}

const CalendarContext = createContext<CalendarContextValue | null>(null)

export function CalendarProvider<TEvent extends CalendarEvent = CalendarEvent>({
  children,
  value,
}: {
  children: React.ReactNode
  value: CalendarContextValue<TEvent>
}) {
  return (
    <CalendarContext.Provider value={value as unknown as CalendarContextValue}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendarContext<
  TEvent extends CalendarEvent = CalendarEvent,
>(): CalendarContextValue<TEvent> {
  const ctx = useContext(CalendarContext)
  if (!ctx) {
    throw new Error("useCalendarContext must be used within a <CalendarProvider>")
  }
  return ctx as unknown as CalendarContextValue<TEvent>
}

export default CalendarContext
