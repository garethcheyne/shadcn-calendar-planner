// Calendar Planner - shadcn/ui registry component
// A full-featured calendar built with Radix UI, Tailwind CSS, and date-fns

export { Calendar } from "./calendar"
export { CalendarProvider, useCalendarContext } from "./calendar-context"

// Views
export { MonthView } from "./views/month"
export { WeekView } from "./views/week"
export { DayView } from "./views/day"
export { WorkWeekView } from "./views/work-week"
export { AgendaView } from "./views/agenda"

// Components (for custom compositions)
export { Toolbar } from "./components/toolbar"
export { EventCell, TimeGridEvent } from "./components/event-cell"
export { EventPopup } from "./components/event-popup"
export { Header, DateHeader, ResourceHeader } from "./components/headers"
export { TimeGrid } from "./components/time-grid"
export { TimeGridHeader } from "./components/time-grid-header"
export { DayColumn } from "./components/day-column"
export { DateContentRow } from "./components/date-content-row"
export { BackgroundCells } from "./components/background-cells"
export { EventRow, EventEndingRow } from "./components/event-row"
export { TimeSlotGroup, TimeGutter } from "./components/time-slots"

// Localizer
export { DateLocalizer, mergeWithDefaults } from "./localizer"
export { dateFnsLocalizer } from "./localizers/date-fns"

// Utilities
export { navigate, views } from "./constants"
export * from "./helpers"
export * as dates from "./lib/dates"

// Layout algorithms
export { getStyledEvents } from "./lib/day-event-layout"
export { default as overlapAlgorithm } from "./lib/layout-algorithms/overlap"
export { default as noOverlapAlgorithm } from "./lib/layout-algorithms/no-overlap"

// Types
export type {
  CalendarEvent,
  CalendarProps,
  View,
  NavigateAction,
  DateLocalizer as IDateLocalizer,
  Accessors,
  Getters,
  CalendarComponents,
  EventSegment,
  StyledEvent,
  SlotInfo,
  DayLayoutAlgorithm,
} from "./types"
