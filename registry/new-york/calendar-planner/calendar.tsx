"use client"

import * as React from "react"
import { useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import type {
  CalendarEvent,
  CalendarProps,
  View,
  NavigateAction,
  Accessors,
  Getters,
  CalendarComponents,
  DateLocalizer,
} from "./types"
import { navigate, views } from "./constants"
import { wrapAccessor, mergeMessages } from "./helpers"
import { useControllableState } from "./hooks/use-controllable-state"
import { CalendarProvider } from "./calendar-context"
import { DnDProvider } from "./hooks/use-dnd"
import { Toolbar } from "./components/toolbar"
import { Header, DateHeader, ResourceHeader } from "./components/headers"
import { EventDetailSheet } from "./components/event-detail-sheet"
import { NoopWrapper } from "./helpers"

// Views
import { MonthView } from "./views/month"
import { WeekView } from "./views/week"
import { DayView } from "./views/day"
import { WorkWeekView } from "./views/work-week"
import { AgendaView } from "./views/agenda"

// ─── Default view map ──────────────────────────────────────────────
const VIEWS: Record<string, React.ComponentType<any>> = {
  [views.MONTH]: MonthView,
  [views.WEEK]: WeekView,
  [views.WORK_WEEK]: WorkWeekView,
  [views.DAY]: DayView,
  [views.AGENDA]: AgendaView,
}

// ─── Default messages ──────────────────────────────────────────────
const defaultMessages = {
  date: "Date",
  time: "Time",
  event: "Event",
  allDay: "All Day",
  week: "Week",
  work_week: "Work Week",
  day: "Day",
  month: "Month",
  agenda: "Agenda",
  previous: "Back",
  next: "Next",
  today: "Today",
  noEventsInRange: "There are no events in this range.",
  showMore: (total: number) => `+${total} more`,
}

// ─── Calendar ──────────────────────────────────────────────────────

export function Calendar<TEvent extends CalendarEvent = CalendarEvent>({
  events = [] as unknown as TEvent[],
  backgroundEvents = [] as unknown as TEvent[],
  date: dateProp,
  defaultDate,
  view: viewProp,
  defaultView = views.MONTH as View,
  onNavigate,
  onView,
  getNow = () => new Date(),
  localizer,

  // Event accessors
  titleAccessor = "title" as keyof TEvent,
  tooltipAccessor = "title" as keyof TEvent,
  startAccessor = "start" as keyof TEvent,
  endAccessor = "end" as keyof TEvent,
  allDayAccessor = "allDay" as keyof TEvent,
  resourceAccessor,
  resourceIdAccessor,
  resourceTitleAccessor,
  resources,

  // Behavior
  selectable = false,
  longPressThreshold = 250,
  step = 30,
  timeslots = 2,
  min: minProp,
  max: maxProp,
  scrollToTime,
  rtl = false,
  popup = false,
  popupOffset,
  length = 30,
  dayLayoutAlgorithm = "overlap",

  // Style getters
  eventPropGetter,
  slotPropGetter,
  slotGroupPropGetter,
  dayPropGetter,

  // Callbacks
  onSelectEvent,
  onDoubleClickEvent,
  onKeyPressEvent,
  onSelectSlot,
  onDrillDown: onDrillDownProp,
  onRangeChange,
  onShowMore,

  // Zoom
  onZoomIn,
  onZoomOut,
  canZoomIn,
  canZoomOut,

  // Drag & Drop
  draggable = false,
  draggableAccessor,
  resizableAccessor,
  onEventDrop,
  onEventResize,
  onDragStart,
  onDragEnd,
  dragFromOutsideItem: _dragFromOutsideItem,

  // Event Detail Sheet
  onEventSave,
  onEventDelete,
  eventDetailContent,
  eventDetailSide = "right",

  // Component overrides
  components: componentsProp = {} as Partial<CalendarComponents<TEvent>>,

  // Messages
  messages: messagesProp,

  // Views override
  views: viewsProp = [views.MONTH, views.WEEK, views.WORK_WEEK, views.DAY, views.AGENDA] as View[],

  // Toolbar
  toolbar = true,

  // Declared but not yet implemented (destructured to keep out of DOM)
  formats: _formats,
  selected: _selected,
  enableAutoScroll: _enableAutoScroll,
  showMultiDayTimes: _showMultiDayTimes,
  allDayMaxRows: _allDayMaxRows,
  showAllEvents: _showAllEvents,
  doShowMoreDrillDown: _doShowMoreDrillDown,
  drilldownView: _drilldownView,
  getDrilldownView: _getDrilldownView,
  eventIdAccessor: _eventIdAccessor,
  resourceGroupingLayout: _resourceGroupingLayout,
  culture: _culture,

  // Classname
  className,
  style,

  // Extra props (elementProps)
  ...elementProps
}: CalendarProps<TEvent>) {
  // Controllable state for date and view
  // ── Event detail sheet state ──
  const [sheetEvent, setSheetEvent] = React.useState<TEvent | null>(null)
  const sheetOpen = sheetEvent !== null

  const [currentDate, setCurrentDate] = useControllableState<Date>(
    dateProp,
    defaultDate || getNow(),
    (d: Date) => onNavigate?.(d, currentView ?? defaultView, navigate.DATE as NavigateAction),
  )

  const [currentView, setCurrentView] = useControllableState<View>(
    viewProp,
    defaultView,
    (v: View) => onView?.(v),
  )

  // Build accessors
  const accessors: Accessors<TEvent> = useMemo(
    () => ({
      title: wrapAccessor(titleAccessor),
      tooltip: wrapAccessor(tooltipAccessor),
      start: wrapAccessor(startAccessor),
      end: wrapAccessor(endAccessor),
      allDay: wrapAccessor(allDayAccessor),
      resource: resourceAccessor ? wrapAccessor(resourceAccessor) : undefined,
    }),
    [titleAccessor, tooltipAccessor, startAccessor, endAccessor, allDayAccessor, resourceAccessor],
  )

  // Build getters
  const getters: Getters<TEvent> = useMemo(
    () => ({
      eventProp: (event, start, end, isSelected) =>
        eventPropGetter?.(event, start, end, isSelected) ?? {},
      slotProp: (date, resourceId) =>
        slotPropGetter?.(date, resourceId) ?? {},
      slotGroupProp: () => slotGroupPropGetter?.() ?? {},
      dayProp: (date) => dayPropGetter?.(date) ?? {},
    }),
    [eventPropGetter, slotPropGetter, slotGroupPropGetter, dayPropGetter],
  )

  // Build components
  const calendarComponents: CalendarComponents<TEvent> = useMemo(
    () => ({
      event: componentsProp.event,
      eventWrapper: componentsProp.eventWrapper ?? NoopWrapper,
      dayWrapper: componentsProp.dayWrapper ?? NoopWrapper,
      dateCellWrapper: componentsProp.dateCellWrapper ?? NoopWrapper,
      timeSlotWrapper: componentsProp.timeSlotWrapper ?? NoopWrapper,
      timeGutterHeader: componentsProp.timeGutterHeader,
      resourceHeader: componentsProp.resourceHeader ?? ResourceHeader,
      toolbar: componentsProp.toolbar ?? Toolbar,
      header: componentsProp.header ?? Header,
      week: componentsProp.week,
      day: componentsProp.day,
      month: componentsProp.month,
      agenda: componentsProp.agenda,
      eventDetailSheet: componentsProp.eventDetailSheet,
    }),
    [componentsProp],
  )

  // Messages
  const messages = useMemo(
    () => mergeMessages(defaultMessages, messagesProp),
    [messagesProp],
  )

  // Resolve the active view component
  const viewNamesMap = useMemo(() => {
    if (Array.isArray(viewsProp)) {
      const map: Record<string, React.ComponentType<any>> = {}
      for (const v of viewsProp) {
        map[v] = VIEWS[v]
      }
      return map
    }
    return viewsProp as Record<string, React.ComponentType<any>>
  }, [viewsProp])

  const ViewComponent = viewNamesMap[currentView] ?? MonthView
  const viewNames = Object.keys(viewNamesMap) as View[]

  // Navigation handler
  const handleNavigate = useCallback(
    (action: NavigateAction, newDate?: Date) => {
      let nextDate = newDate || currentDate

      if (action === navigate.TODAY) {
        nextDate = getNow()
      } else if (action === navigate.DATE) {
        nextDate = newDate || currentDate
      } else {
        const viewComponent = ViewComponent as any
        if (viewComponent.navigate) {
          nextDate = viewComponent.navigate(currentDate, action, localizer)
        }
      }

      setCurrentDate(nextDate)
      onNavigate?.(nextDate, currentView, action)

      const viewComponent = ViewComponent as any
      if (onRangeChange && viewComponent.range) {
        const range = viewComponent.range(nextDate, localizer)
        onRangeChange(
          Array.isArray(range) ? range : [range.start, range.end],
          currentView,
        )
      }
    },
    [currentDate, currentView, getNow, localizer, ViewComponent, setCurrentDate, onNavigate, onRangeChange],
  )

  // View change handler
  const handleViewChange = useCallback(
    (newView: View) => {
      setCurrentView(newView)
      onView?.(newView)
    },
    [setCurrentView, onView],
  )

  // Double-click handler (open event detail sheet)
  const handleDoubleClickEvent = useCallback(
    (event: TEvent, e: React.SyntheticEvent) => {
      // Open the detail sheet
      setSheetEvent(event)
      // Also fire the user's callback if provided
      onDoubleClickEvent?.(event, e)
    },
    [onDoubleClickEvent],
  )

  // Sheet save handler
  const handleSheetSave = useCallback(
    (updatedEvent: TEvent, originalEvent: TEvent) => {
      onEventSave?.(updatedEvent, originalEvent)
      setSheetEvent(null)
    },
    [onEventSave],
  )

  // Sheet delete handler
  const handleSheetDelete = useCallback(
    (event: TEvent) => {
      onEventDelete?.(event)
      setSheetEvent(null)
    },
    [onEventDelete],
  )

  // Drill down handler
  const handleDrillDown = useCallback(
    (date: Date, view?: string) => {
      if (onDrillDownProp) {
        onDrillDownProp(date, view || views.DAY)
      } else {
        const targetView = (view || views.DAY) as View
        if (viewNamesMap[targetView]) {
          handleViewChange(targetView)
          setCurrentDate(date)
        }
      }
    },
    [onDrillDownProp, viewNamesMap, handleViewChange, setCurrentDate],
  )

  // Title for toolbar
  const viewComponent = ViewComponent as any
  const label = viewComponent.title
    ? viewComponent.title(currentDate, localizer, length)
    : ""

  // Default min/max for time-based views
  const minDate = useMemo(() => {
    if (minProp) return minProp
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [minProp])

  const maxDate = useMemo(() => {
    if (maxProp) return maxProp
    const d = new Date()
    d.setHours(23, 59, 59, 999)
    return d
  }, [maxProp])

  // Resources
  const resourceList = useMemo(() => {
    if (!resources) return undefined
    const getId = typeof resourceIdAccessor === 'function'
      ? resourceIdAccessor
      : (r: Record<string, unknown>) => r[resourceIdAccessor as string ?? 'id'] as string | number
    const getTitle = typeof resourceTitleAccessor === 'function'
      ? resourceTitleAccessor
      : (r: Record<string, unknown>) => r[resourceTitleAccessor as string ?? 'title'] as string
    return resources.map((r) => ({
      id: getId(r as any),
      title: getTitle(r as any),
    }))
  }, [resources, resourceIdAccessor, resourceTitleAccessor])

  return (
    <DnDProvider
      enabled={draggable}
      draggableAccessor={draggableAccessor}
      resizableAccessor={resizableAccessor}
      onEventDrop={onEventDrop}
      onEventResize={onEventResize}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
    <CalendarProvider
      value={{ localizer, accessors, getters, components: calendarComponents, rtl }}
    >
      <div
        className={cn(
          "flex flex-col h-full rounded-lg border border-border bg-background text-foreground overflow-hidden",
          rtl && "direction-rtl",
          className,
        )}
        style={style}
        {...elementProps}
      >
        {/* Toolbar */}
        {toolbar && (
          <div className="border-b border-border">
            {React.createElement(calendarComponents.toolbar ?? Toolbar, {
              date: currentDate,
              view: currentView,
              views: viewNames,
              label,
              localizer,
              onNavigate: handleNavigate,
              onView: handleViewChange,
              messages,
              onZoomIn,
              onZoomOut,
              canZoomIn,
              canZoomOut,
            })}
          </div>
        )}

        {/* View */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ViewComponent
            date={currentDate}
            events={events}
            backgroundEvents={backgroundEvents}
            getNow={getNow}
            selected={undefined}
            selectable={selectable}
            longPressThreshold={longPressThreshold}
            step={step}
            timeslots={timeslots}
            min={minDate}
            max={maxDate}
            scrollToTime={scrollToTime}
            length={length}
            popup={popup}
            popupOffset={popupOffset}
            accessors={accessors}
            getters={getters}
            localizer={localizer}
            components={calendarComponents}
            rtl={rtl}
            resources={resourceList}
            resourceAccessor={resourceAccessor}
            dayLayoutAlgorithm={dayLayoutAlgorithm}
            onSelectSlot={onSelectSlot}
            onSelect={onSelectEvent}
            onDoubleClick={handleDoubleClickEvent}
            onKeyPress={onKeyPressEvent}
            onShowMore={onShowMore}
            onDrillDown={handleDrillDown}
            onNavigate={handleNavigate}
            messages={messages}
          />
        </div>
      </div>
    </CalendarProvider>

    {/* ── Event Detail Sheet ── */}
    {sheetEvent && (() => {
      const SheetComp = calendarComponents.eventDetailSheet ?? EventDetailSheet
      const sheetEventStart = accessors.start(sheetEvent)
      const sheetEventEnd = accessors.end(sheetEvent)
      const sheetEventTitle = accessors.title(sheetEvent)
      const sheetEventAllDay = accessors.allDay(sheetEvent)
      return (
        <SheetComp
          event={sheetEvent}
          open={sheetOpen}
          onOpenChange={(open: boolean) => { if (!open) setSheetEvent(null) }}
          title={sheetEventTitle}
          start={sheetEventStart}
          end={sheetEventEnd}
          isAllDay={sheetEventAllDay}
          localizer={localizer}
          onSave={onEventSave ? handleSheetSave : undefined}
          onDelete={onEventDelete ? handleSheetDelete : undefined}
          side={eventDetailSide}
        >
          {eventDetailContent?.(sheetEvent)}
        </SheetComp>
      )
    })()}
    </DnDProvider>
  )
}

Calendar.displayName = "Calendar"
