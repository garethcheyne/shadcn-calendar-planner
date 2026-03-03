import type { ReactNode, CSSProperties, HTMLAttributes } from "react"

// ─── Navigation & Views ───────────────────────────────────────────────
export type NavigateAction = "PREV" | "NEXT" | "TODAY" | "DATE"

export type View = "month" | "week" | "work_week" | "day" | "agenda"

// ─── Event ────────────────────────────────────────────────────────────
export interface CalendarEvent {
  title?: string
  start?: Date
  end?: Date
  allDay?: boolean
  resource?: unknown
  [key: string]: unknown
}

// ─── Accessor ─────────────────────────────────────────────────────────
export type Accessor<TEvent, TValue> =
  | keyof TEvent
  | ((event: TEvent) => TValue)

// ─── Format ───────────────────────────────────────────────────────────
export type DateFormat = string | ((date: Date, culture?: string, localizer?: DateLocalizer) => string)

export type DateRangeFormat = (
  range: { start: Date; end: Date },
  culture?: string,
  localizer?: DateLocalizer,
) => string

// ─── Formats (all optional overrides) ─────────────────────────────────
export interface CalendarFormats {
  dateFormat?: DateFormat
  dayFormat?: DateFormat
  weekdayFormat?: DateFormat
  timeGutterFormat?: DateFormat
  monthHeaderFormat?: DateFormat
  dayRangeHeaderFormat?: DateRangeFormat
  dayHeaderFormat?: DateFormat
  agendaHeaderFormat?: DateRangeFormat
  selectRangeFormat?: DateRangeFormat
  eventTimeRangeFormat?: DateRangeFormat
  eventTimeRangeStartFormat?: DateRangeFormat
  eventTimeRangeEndFormat?: DateRangeFormat
  agendaDateFormat?: DateFormat
  agendaTimeFormat?: DateFormat
  agendaTimeRangeFormat?: DateRangeFormat
}

// ─── Messages (i18n) ──────────────────────────────────────────────────
export interface CalendarMessages {
  date?: string
  time?: string
  event?: string
  allDay?: string
  week?: string
  work_week?: string
  day?: string
  month?: string
  previous?: string
  next?: string
  yesterday?: string
  tomorrow?: string
  today?: string
  agenda?: string
  noEventsInRange?: string
  showMore?: (count: number) => string
}

// ─── Prop Getters ─────────────────────────────────────────────────────
export type EventPropGetter<TEvent = CalendarEvent> = (
  event: TEvent,
  start: Date,
  end: Date,
  isSelected: boolean,
) => { className?: string; style?: CSSProperties }

export type SlotPropGetter = (
  date: Date,
  resourceId?: string | number,
) => { className?: string; style?: CSSProperties }

export type DayPropGetter = (
  date: Date,
) => { className?: string; style?: CSSProperties }

// ─── Slot Info ────────────────────────────────────────────────────────
export interface SlotInfo {
  start: Date
  end: Date
  slots: Date[]
  action: "select" | "click" | "doubleClick"
  bounds?: { x: number; y: number; top: number; bottom: number; left: number; right: number }
  box?: { x: number; y: number; clientX: number; clientY: number }
  resourceId?: string | number
}

// ─── Components (overridable sub-components) ──────────────────────────
export interface CalendarComponents<TEvent = CalendarEvent> {
  event?: React.ComponentType<EventComponentProps<TEvent>>
  eventWrapper?: React.ComponentType<EventWrapperProps<TEvent>>
  eventContainerWrapper?: React.ComponentType<{ children: ReactNode }>
  dateCellWrapper?: React.ComponentType<{ children: ReactNode; value: Date; range: Date[] }>
  dayWrapper?: React.ComponentType<{ children: ReactNode }>
  timeSlotWrapper?: React.ComponentType<{ children: ReactNode; value: Date; resource?: unknown }>
  timeGutterWrapper?: React.ComponentType<{ children: ReactNode }>
  timeGutterHeader?: React.ComponentType<Record<string, never>>
  toolbar?: React.ComponentType<ToolbarProps>
  agenda?: {
    date?: React.ComponentType<{ day: Date; label: string }>
    time?: React.ComponentType<{ event: TEvent; day: Date; label: string }>
    event?: React.ComponentType<{ event: TEvent; title: string }>
  }
  day?: {
    header?: React.ComponentType<{ date: Date; label: string }>
    event?: React.ComponentType<EventComponentProps<TEvent>>
  }
  week?: {
    header?: React.ComponentType<{ date: Date; label: string }>
    event?: React.ComponentType<EventComponentProps<TEvent>>
  }
  month?: {
    header?: React.ComponentType<{ date: Date; label: string }>
    dateHeader?: React.ComponentType<DateHeaderProps>
    event?: React.ComponentType<EventComponentProps<TEvent>>
  }
  resourceHeader?: React.ComponentType<ResourceHeaderProps>
  header?: React.ComponentType<{ date: Date; label: string; localizer: DateLocalizer }>
}

// ─── Sub-component Props ──────────────────────────────────────────────
export interface EventComponentProps<TEvent = CalendarEvent> {
  event: TEvent
  title: string
  isAllDay?: boolean
  localizer: DateLocalizer
  slotStart?: Date
  slotEnd?: Date
  continuesPrior?: boolean
  continuesAfter?: boolean
}

export interface EventWrapperProps<TEvent = CalendarEvent> {
  event: TEvent
  children: ReactNode
  continuesPrior?: boolean
  continuesAfter?: boolean
  isAllDay?: boolean
  selected?: boolean
  label?: string
  onSelect?: (event: TEvent, e: React.SyntheticEvent) => void
  onDoubleClick?: (event: TEvent, e: React.SyntheticEvent) => void
}

export interface DateHeaderProps {
  date: Date
  label: string
  drilldownView?: View
  isOffRange?: boolean
  onDrillDown?: (date: Date, view: View) => void
}

export interface ResourceHeaderProps {
  label: ReactNode
  index: number
  resource: Resource
}

export interface ToolbarProps {
  date: Date
  view: View
  views: View[]
  label: string
  localizer: DateLocalizer
  onNavigate: (action: NavigateAction) => void
  onView: (view: View) => void
  messages?: Partial<CalendarMessages>
  children?: ReactNode
  /** Zoom in (decrease step) */
  onZoomIn?: () => void
  /** Zoom out (increase step) */
  onZoomOut?: () => void
  /** Whether zoom-in is allowed */
  canZoomIn?: boolean
  /** Whether zoom-out is allowed */
  canZoomOut?: boolean
}

// ─── Resource ─────────────────────────────────────────────────────────
export interface Resource {
  id: string | number
  title: string
  [key: string]: unknown
}

// ─── Localizer ────────────────────────────────────────────────────────
export interface DateLocalizer {
  formats: CalendarFormats
  messages: Required<CalendarMessages>

  format(value: Date, formatStr: DateFormat, culture?: string): string
  format(value: { start: Date; end: Date }, formatStr: string, culture?: string): string
  parse?(value: string, format: string, culture?: string): Date

  startOfWeek(culture?: string): number
  merge(date: Date, time: Date): Date
  inRange(day: Date, min: Date, max: Date, unit?: string): boolean
  lt(a: Date, b: Date, unit?: string): boolean
  lte(a: Date, b: Date, unit?: string): boolean
  gt(a: Date, b: Date, unit?: string): boolean
  gte(a: Date, b: Date, unit?: string): boolean
  eq(a: Date, b: Date, unit?: string): boolean
  neq(a: Date, b: Date, unit?: string): boolean
  add(date: Date, amount: number, unit: string): Date
  startOf(date: Date, unit: string): Date
  endOf(date: Date, unit: string): Date
  range(start: Date, end: Date, unit?: string): Date[]
  diff(a: Date, b: Date, unit?: string): number
  ceil(date: Date, unit: string): Date
  min(a: Date, b: Date): Date
  max(a: Date, b: Date): Date
  minutes(date: Date): number

  firstVisibleDay(date: Date, localizer?: DateLocalizer): Date
  lastVisibleDay(date: Date, localizer?: DateLocalizer): Date
  visibleDays(date: Date, localizer?: DateLocalizer): Date[]

  getSlotDate(date: Date, minutesFromMidnight: number, offset: number): Date
  getTimezoneOffset(date: Date): number
  getDstOffset(start: Date, end: Date): number
  getTotalMin(start: Date, end: Date): number
  getMinutesFromMidnight(date: Date): number

  continuesPrior(start: Date, first: Date): boolean
  continuesAfter(start: Date, end: Date, last: Date): boolean

  sortEvents(eventA: CalendarEvent, eventB: CalendarEvent, accessors: Accessors): number
  inEventRange(event: CalendarEvent, range: { start: Date; end: Date }, accessors: Accessors): boolean
  isSameDate(a: Date, b: Date, unit?: string): boolean
  startAndEndAreDateOnly(start: Date, end: Date): boolean

  segmentOffset?: number
}

// ─── Accessors (resolved functions) ───────────────────────────────────
export interface Accessors<TEvent = CalendarEvent> {
  start: (event: TEvent) => Date
  end: (event: TEvent) => Date
  title: (event: TEvent) => string
  tooltip: (event: TEvent) => string
  allDay: (event: TEvent) => boolean
  resource?: (event: TEvent) => unknown
  resourceId?: (event: TEvent) => string | number
  eventId?: (event: TEvent) => string | number
}

// ─── Getters ──────────────────────────────────────────────────────────
export interface Getters<TEvent = CalendarEvent> {
  eventProp: (event: TEvent, start: Date, end: Date, isSelected: boolean) => { className?: string; style?: CSSProperties }
  slotProp: (date: Date, resourceId?: string | number) => { className?: string; style?: CSSProperties }
  dayProp: (date: Date) => { className?: string; style?: CSSProperties }
  slotGroupProp: () => { className?: string; style?: CSSProperties }
}

// ─── Event Segment ────────────────────────────────────────────────────
export interface EventSegment<TEvent = CalendarEvent> {
  event: TEvent
  span: number
  left: number
  right: number
}

// ─── Day Layout Algorithm ─────────────────────────────────────────────
export type DayLayoutAlgorithm = "overlap" | "no-overlap" | DayLayoutFunction

export type DayLayoutFunction = (args: {
  events: StyledEvent[]
  minimumStartDifference: number
  slotMetrics: TimeSlotMetrics
  accessors: Accessors
}) => StyledEvent[]

export interface StyledEvent<TEvent = CalendarEvent> {
  event: TEvent
  style: {
    top: number
    height: number
    width: number
    xOffset: number
  }
}

// ─── Time Slot Metrics ────────────────────────────────────────────────
export interface TimeSlotMetrics {
  groups: Date[][]
  update(args: { min: Date; max: Date; step: number; timeslots: number }): TimeSlotMetrics
  dateIsInGroup(date: Date, groupIndex: number): boolean
  nextSlot(slot: Date): Date
  closestSlotToPosition(percent: number): Date
  closestSlotFromPoint(point: { x: number; y: number }, boundaryRect: DOMRect): Date
  closestSlotFromDate(date: Date, offset?: number): Date
  startsBeforeDay(date: Date): boolean
  startsAfterDay(date: Date): boolean
  startsBefore(date: Date): boolean
  startsAfter(date: Date): boolean
  getRange(startDate: Date, endDate: Date, ignoreMax?: boolean, ignoreMin?: boolean): { top: number; height: number; start: number; startDate: Date; end: number; endDate: Date }
  getCurrentTimePosition(now: Date): number
  slotCount: number
  totalMin: number
  first: Date
  last: Date
}

// ─── Date Slot Metrics ────────────────────────────────────────────────
export interface DateSlotMetrics<TEvent = CalendarEvent> {
  first: Date
  last: Date
  levels: EventSegment<TEvent>[][]
  extra: EventSegment<TEvent>[]
  range: Date[]
  slots: number
  clone(args: { range: Date[]; events: TEvent[]; maxRows: number; minRows: number; accessors: Accessors<TEvent>; localizer: DateLocalizer }): DateSlotMetrics<TEvent>
  getDateForSlot(slotNumber: number): Date
  getSlotForDate(date: Date): number
  getEventsForSlot(slot: number): TEvent[]
  continuesPrior(event: TEvent): boolean
  continuesAfter(event: TEvent): boolean
}

// ─── Main Calendar Props ──────────────────────────────────────────────
export interface CalendarProps<TEvent extends CalendarEvent = CalendarEvent> extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Required: the localizer (e.g. dateFnsLocalizer) */
  localizer: DateLocalizer

  /** The events to display */
  events?: TEvent[]

  /** Background events (shown behind regular events) */
  backgroundEvents?: TEvent[]

  /** Current date value (controlled) */
  date?: Date

  /** Default date when uncontrolled */
  defaultDate?: Date

  /** Current view (controlled) */
  view?: View

  /** Default view when uncontrolled */
  defaultView?: View

  /** Which views are available. Array or object { month: true, week: true } */
  views?: View[] | Partial<Record<View, boolean>>

  /** Called when date changes */
  onNavigate?: (newDate: Date, view: View, action: NavigateAction) => void

  /** Called when view changes */
  onView?: (view: View) => void

  /** Called when an event is selected */
  onSelectEvent?: (event: TEvent, e: React.SyntheticEvent) => void

  /** Called when a slot is selected */
  onSelectSlot?: (slotInfo: SlotInfo) => void

  /** Called when an event is double-clicked */
  onDoubleClickEvent?: (event: TEvent, e: React.SyntheticEvent) => void

  /** Called when a key is pressed on an event */
  onKeyPressEvent?: (event: TEvent, e: React.KeyboardEvent) => void

  /** Called on range change */
  onRangeChange?: (range: Date[] | { start: Date; end: Date }, view?: View) => void

  /** Called when drill-down navigates */
  onDrillDown?: (date: Date, view: View | string) => void

  /** Called when "show more" is clicked */
  onShowMore?: (events: TEvent[], date: Date, cell: HTMLElement, slot: number) => void

  /** Whether the user can select time slots */
  selectable?: boolean | "ignoreEvents"

  /** The currently selected event */
  selected?: TEvent

  /** Custom format overrides */
  formats?: CalendarFormats

  /** Custom message overrides (i18n) */
  messages?: Partial<CalendarMessages>

  /** Step in minutes for time slots */
  step?: number

  /** Number of time slots per group */
  timeslots?: number

  /** Earliest time (in day view) */
  min?: Date

  /** Latest time (in day view) */
  max?: Date

  /** Function returning current time */
  getNow?: () => Date

  /** Scroll to this time on mount */
  scrollToTime?: Date

  /** Auto-scroll to current time */
  enableAutoScroll?: boolean

  /** Show toolbar */
  toolbar?: boolean

  /** Show popup on "show more" click */
  popup?: boolean

  /** Popup offset */
  popupOffset?: number | { x: number; y: number }

  /** View to navigate to when clicking a date/header */
  drilldownView?: View | null

  /** Custom drilldown view resolver */
  getDrilldownView?: (targetDate: Date, currentViewName: View, configuredViewNames: View[]) => View | null

  /** Day layout algorithm */
  dayLayoutAlgorithm?: DayLayoutAlgorithm

  /** Style accessor for events */
  eventPropGetter?: EventPropGetter<TEvent>

  /** Style accessor for slots */
  slotPropGetter?: SlotPropGetter

  /** Style accessor for day backgrounds */
  dayPropGetter?: DayPropGetter

  /** Style accessor for slot groups */
  slotGroupPropGetter?: () => { className?: string; style?: CSSProperties }

  /** Custom components */
  components?: CalendarComponents<TEvent>

  /** Accessor for event start */
  startAccessor?: Accessor<TEvent, Date>

  /** Accessor for event end */
  endAccessor?: Accessor<TEvent, Date>

  /** Accessor for event title */
  titleAccessor?: Accessor<TEvent, string>

  /** Accessor for event tooltip */
  tooltipAccessor?: Accessor<TEvent, string>

  /** Accessor for all-day flag */
  allDayAccessor?: Accessor<TEvent, boolean>

  /** Accessor for event resource */
  resourceAccessor?: Accessor<TEvent, unknown>

  /** Resource ID accessor */
  resourceIdAccessor?: Accessor<Resource, string | number>

  /** Resource title accessor */
  resourceTitleAccessor?: Accessor<Resource, string>

  /** Event ID accessor */
  eventIdAccessor?: Accessor<TEvent, string | number>

  /** Resources for resource view */
  resources?: Resource[]

  /** Show multi-day events in time view */
  showMultiDayTimes?: boolean

  /** Max rows for all-day events */
  allDayMaxRows?: number

  /** Show all events (no "show more") */
  showAllEvents?: boolean

  /** Whether "show more" drills down */
  doShowMoreDrillDown?: boolean

  /** Long press threshold in ms */
  longPressThreshold?: number

  /** Agenda length in days */
  length?: number

  /** Culture string */
  culture?: string

  /** Right-to-left */
  rtl?: boolean

  /** Resource grouping layout (ranges under resources) */
  resourceGroupingLayout?: boolean

  /** Zoom in callback (decrease step for finer time slots) */
  onZoomIn?: () => void

  /** Zoom out callback (increase step for coarser time slots) */
  onZoomOut?: () => void

  /** Whether further zoom-in is available */
  canZoomIn?: boolean

  /** Whether further zoom-out is available */
  canZoomOut?: boolean
}

// ─── View Component Static Interface ──────────────────────────────────
export interface ViewStatic {
  range(date: Date, props: { localizer: DateLocalizer }): Date[]
  navigate(date: Date, action: NavigateAction, props: { localizer: DateLocalizer }): Date
  title(date: Date, props: { localizer: DateLocalizer }): string
}
