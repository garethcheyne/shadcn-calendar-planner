"use client"

import { useMemo, useCallback, useState, type ReactNode } from "react"
import * as Tabs from "@radix-ui/react-tabs"
import * as Popover from "@radix-ui/react-popover"
import { Calendar } from "@/registry/new-york/calendar-planner"
import { dateFnsLocalizer } from "@/registry/new-york/calendar-planner/localizers/date-fns"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import type {
  View,
  NavigateAction,
  CalendarEvent,
  EventComponentProps,
  Resource,
} from "@/registry/new-york/calendar-planner/types"
import { cn } from "@/lib/utils"

// ─── Localizer ───────────────────────────────────────────────────
const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// ─── Extended Event Type ─────────────────────────────────────────
interface MyEvent extends CalendarEvent {
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resourceId?: number | number[]
  desc?: string
  color?: string
  category?: string
  location?: string
  attendees?: string[]
  popoverContent?: ReactNode
}

// ─── Resources ───────────────────────────────────────────────────
const resources: Resource[] = [
  { id: 1, title: "Board Room" },
  { id: 2, title: "Training Room" },
  { id: 3, title: "Meeting Room A" },
  { id: 4, title: "Meeting Room B" },
]

// ─── Rich Sample Events ──────────────────────────────────────────
const now = new Date()
const y = now.getFullYear()
const m = now.getMonth()
const d = now.getDate()

const sampleEvents: MyEvent[] = [
  // ── All-day events ──
  {
    title: "Company Holiday",
    start: new Date(y, m, 1),
    end: new Date(y, m, 1),
    allDay: true,
    color: "#10b981",
    category: "holiday",
    desc: "National holiday — office closed",
  },
  {
    title: "Sprint Review Week",
    start: new Date(y, m, 7),
    end: new Date(y, m, 11),
    allDay: true,
    color: "#8b5cf6",
    category: "sprint",
    desc: "End-of-sprint demos and retrospectives across all teams",
  },

  // ── Multi-day conference ──
  {
    title: "Tech Conference",
    start: new Date(y, m, 11, 9, 0),
    end: new Date(y, m, 13, 17, 0),
    desc: "Annual tech conference with keynotes, workshops, and networking",
    location: "Convention Center, Hall A",
    attendees: ["Alice", "Bob", "Charlie", "Diana"],
    color: "#f59e0b",
    category: "conference",
  },

  // ── Typical workday meetings ──
  {
    title: "Daily Standup",
    start: new Date(y, m, d, 9, 0),
    end: new Date(y, m, d, 9, 15),
    desc: "Quick sync — what did you do, what will you do, blockers?",
    resourceId: 1,
    category: "standup",
    color: "#06b6d4",
  },
  {
    title: "Design Review",
    start: new Date(y, m, d, 10, 0),
    end: new Date(y, m, d, 11, 30),
    desc: "Review new dashboard mockups with the design team",
    resourceId: 3,
    attendees: ["Eve", "Frank"],
    category: "review",
    color: "#ec4899",
    location: "Meeting Room A",
  },
  {
    title: "Lunch Break",
    start: new Date(y, m, d, 12, 0),
    end: new Date(y, m, d, 13, 0),
    desc: "Team lunch at the café downstairs",
    category: "personal",
    color: "#84cc16",
  },
  {
    title: "Client Call",
    start: new Date(y, m, d, 14, 0),
    end: new Date(y, m, d, 15, 0),
    desc: "Quarterly progress review with Acme Corp",
    resourceId: 1,
    attendees: ["Grace", "Heidi"],
    category: "client",
    color: "#f97316",
    location: "Board Room (Zoom bridge available)",
  },
  {
    title: "Code Review Session",
    start: new Date(y, m, d, 15, 30),
    end: new Date(y, m, d, 16, 30),
    desc: "Review PRs #142, #143, #145 — authentication module",
    resourceId: 2,
    category: "review",
    color: "#6366f1",
  },

  // ── Overlapping events (stress test) ──
  {
    title: "Interview: Frontend Dev",
    start: new Date(y, m, d + 1, 10, 0),
    end: new Date(y, m, d + 1, 11, 0),
    desc: "Technical interview — React & TypeScript",
    resourceId: 3,
    category: "interview",
    color: "#14b8a6",
  },
  {
    title: "Interview: Backend Dev",
    start: new Date(y, m, d + 1, 10, 30),
    end: new Date(y, m, d + 1, 11, 30),
    desc: "Technical interview — Node.js & databases",
    resourceId: 4,
    category: "interview",
    color: "#14b8a6",
  },
  {
    title: "Product Sync",
    start: new Date(y, m, d + 1, 10, 0),
    end: new Date(y, m, d + 1, 10, 45),
    desc: "Align on Q2 roadmap priorities",
    resourceId: 1,
    category: "sync",
    color: "#a855f7",
  },

  // ── Short events (15-min) ──
  {
    title: "Quick 1:1",
    start: new Date(y, m, d, 9, 15),
    end: new Date(y, m, d, 9, 30),
    desc: "Check in with manager",
    category: "personal",
    color: "#64748b",
  },
  {
    title: "Coffee Chat",
    start: new Date(y, m, d + 2, 15, 0),
    end: new Date(y, m, d + 2, 15, 15),
    desc: "Informal coffee with the new hire",
    category: "personal",
    color: "#78716c",
  },

  // ── Cross-midnight event ──
  {
    title: "Server Maintenance",
    start: new Date(y, m, d + 3, 23, 0),
    end: new Date(y, m, d + 4, 3, 0),
    desc: "Scheduled downtime for database migration",
    category: "ops",
    color: "#ef4444",
    location: "Remote",
  },

  // ── Early morning ──
  {
    title: "Yoga Class",
    start: new Date(y, m, d + 1, 6, 0),
    end: new Date(y, m, d + 1, 7, 0),
    desc: "Morning yoga in the wellness room",
    category: "personal",
    color: "#22c55e",
    resourceId: 2,
  },

  // ── Late evening ──
  {
    title: "Team Dinner",
    start: new Date(y, m, d + 2, 19, 0),
    end: new Date(y, m, d + 2, 22, 0),
    desc: "End-of-month team celebration dinner",
    location: "The Italian Place, 5th Avenue",
    attendees: ["Alice", "Bob", "Charlie", "Diana", "Eve"],
    category: "social",
    color: "#f59e0b",
  },

  // ── Weekend event ──
  {
    title: "Hackathon",
    start: new Date(y, m, d + (6 - now.getDay()), 9, 0),
    end: new Date(y, m, d + (7 - now.getDay()), 18, 0),
    desc: "48-hour hackathon — build something awesome!",
    category: "hackathon",
    color: "#8b5cf6",
    location: "Office, Floor 3",
  },

  // ── Resource-specific recurring events ──
  ...Array.from({ length: 5 }, (_, i) => ({
    title: `Training Session ${i + 1}`,
    start: new Date(y, m, d + i, 13, 0),
    end: new Date(y, m, d + i, 14, 0),
    desc: `Module ${i + 1}: ${["Intro to TypeScript", "Advanced React", "Testing Best Practices", "CI/CD Pipelines", "Performance Optimization"][i]}`,
    resourceId: 2,
    category: "training",
    color: "#0ea5e9",
    location: "Training Room",
  })),

  // ── Multi-resource event ──
  {
    title: "All-Hands Meeting",
    start: new Date(y, m, d + 4, 11, 0),
    end: new Date(y, m, d + 4, 12, 0),
    desc: "Monthly all-hands — company updates and Q&A",
    resourceId: [1, 2, 3, 4],
    category: "company",
    color: "#7c3aed",
    attendees: ["Everyone"],
  },

  // ── Today (dynamic) ──
  {
    title: "Current Task Block",
    start: new Date(new Date().setHours(now.getHours() - 1, 0, 0, 0)),
    end: new Date(new Date().setHours(now.getHours() + 2, 0, 0, 0)),
    desc: "Deep work — no interruptions please",
    category: "focus",
    color: "#3b82f6",
  },
]

// ─── Event color getter ──────────────────────────────────────────
function eventPropGetter(event: MyEvent) {
  const style: React.CSSProperties = {}
  if (event.color) {
    style.backgroundColor = event.color
    style.borderColor = event.color
  }
  return { style, className: "" }
}

// ─── Zoom step levels ────────────────────────────────────────────
const ZOOM_STEPS = [5, 10, 15, 20, 30, 60, 120] // minutes

// ─── Event Popover Component ─────────────────────────────────────
function EventWithPopover({ event, title }: EventComponentProps<MyEvent>) {
  const start = event.start
  const end = event.end
  const timeStr = event.allDay
    ? "All day"
    : `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <span className="truncate cursor-pointer">{title}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          sideOffset={8}
          className={cn(
            "z-50 w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
            "p-4 space-y-2",
            "animate-in fade-in-0 zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color bar */}
          {event.color && (
            <div className="h-1 w-full rounded-full mb-2" style={{ backgroundColor: event.color }} />
          )}

          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight">{title}</h3>

          {/* Time */}
          <p className="text-xs text-muted-foreground">{timeStr}</p>

          {/* Description */}
          {event.desc && (
            <p className="text-xs text-foreground/80">{event.desc}</p>
          )}

          {/* Custom popover content */}
          {event.popoverContent && (
            <div className="text-xs">{event.popoverContent}</div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <svg className="h-3 w-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.attendees.join(", ")}</span>
            </div>
          )}

          {/* Category badge */}
          {event.category && (
            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground">
              {event.category}
            </span>
          )}

          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// ─── Tab Definitions ─────────────────────────────────────────────
const tabs = [
  { value: "default", label: "Month / Week / Day" },
  { value: "resources", label: "Resource Groups" },
  { value: "agenda", label: "Agenda" },
  { value: "dense", label: "Dense Week" },
] as const

// ─── Page Component ──────────────────────────────────────────────
export default function DemoPage() {
  const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null)
  const [step, setStep] = useState(30)
  const [activeTab, setActiveTab] = useState<string>("default")

  const zoomStepIndex = ZOOM_STEPS.indexOf(step)
  const canZoomIn = zoomStepIndex > 0
  const canZoomOut = zoomStepIndex < ZOOM_STEPS.length - 1

  const handleZoomIn = useCallback(() => {
    setStep((prev) => {
      const idx = ZOOM_STEPS.indexOf(prev)
      return idx > 0 ? ZOOM_STEPS[idx - 1] : prev
    })
  }, [])

  const handleZoomOut = useCallback(() => {
    setStep((prev) => {
      const idx = ZOOM_STEPS.indexOf(prev)
      return idx < ZOOM_STEPS.length - 1 ? ZOOM_STEPS[idx + 1] : prev
    })
  }, [])

  const handleSelectEvent = useCallback((event: MyEvent) => {
    setSelectedEvent(event)
  }, [])

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; slots: Date[]; action: string }) => {
      if (slotInfo.action === "select" || slotInfo.action === "click") {
        const title = window.prompt("New Event name")
        if (title) {
          console.log("New event:", { title, start: slotInfo.start, end: slotInfo.end })
        }
      }
    },
    [],
  )

  // Timeslots adjusts with step to keep group height consistent
  const timeslots = step <= 10 ? 6 : step <= 15 ? 4 : step <= 30 ? 2 : 1

  return (
    <main className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Calendar Planner</h1>
          <p className="text-xs text-muted-foreground">
            shadcn/ui &bull; Radix UI &bull; Tailwind CSS &bull; date-fns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Zoom: {step}min slots
          </span>
          {selectedEvent && (
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* Tabs + Calendar */}
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <Tabs.List className="flex border-b border-border bg-muted/30 px-4">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                "border-b-2 border-transparent -mb-px",
                "text-muted-foreground hover:text-foreground",
                "data-[state=active]:border-primary data-[state=active]:text-foreground",
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* ── Default: Month/Week/Day ── */}
        <Tabs.Content value="default" className="flex-1 min-h-0 p-2">
          <Calendar<MyEvent>
            localizer={localizer}
            events={sampleEvents}
            defaultView="month"
            selectable
            popup
            step={step}
            timeslots={timeslots}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventPropGetter}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            components={{
              event: EventWithPopover as any,
            }}
            style={{ height: "100%" }}
          />
        </Tabs.Content>

        {/* ── Resource Groups ── */}
        <Tabs.Content value="resources" className="flex-1 min-h-0 p-2">
          <Calendar<MyEvent>
            localizer={localizer}
            events={sampleEvents}
            defaultView="day"
            views={["day", "work_week"] as any}
            resources={resources}
            resourceIdAccessor="id"
            resourceTitleAccessor="title"
            resourceAccessor={(event: MyEvent) => event.resourceId as any}
            selectable
            step={step}
            timeslots={timeslots}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventPropGetter}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            components={{
              event: EventWithPopover as any,
            }}
            style={{ height: "100%" }}
          />
        </Tabs.Content>

        {/* ── Agenda ── */}
        <Tabs.Content value="agenda" className="flex-1 min-h-0 p-2">
          <Calendar<MyEvent>
            localizer={localizer}
            events={sampleEvents}
            defaultView="agenda"
            views={["agenda", "month"] as any}
            length={30}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            components={{
              event: EventWithPopover as any,
            }}
            style={{ height: "100%" }}
          />
        </Tabs.Content>

        {/* ── Dense Week ── */}
        <Tabs.Content value="dense" className="flex-1 min-h-0 p-2">
          <Calendar<MyEvent>
            localizer={localizer}
            events={sampleEvents}
            defaultView="week"
            views={["week", "work_week"] as any}
            step={step}
            timeslots={timeslots}
            selectable
            min={new Date(y, m, d, 6, 0)}
            max={new Date(y, m, d, 22, 0)}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventPropGetter}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            dayLayoutAlgorithm="no-overlap"
            components={{
              event: EventWithPopover as any,
            }}
            style={{ height: "100%" }}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* Selected event detail bar */}
      {selectedEvent && (
        <div className="border-t border-border bg-card px-4 py-2.5 flex items-center gap-3 text-sm">
          {selectedEvent.color && (
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: selectedEvent.color }} />
          )}
          <strong className="truncate">{selectedEvent.title}</strong>
          {selectedEvent.desc && (
            <span className="text-muted-foreground truncate">&mdash; {selectedEvent.desc}</span>
          )}
          {selectedEvent.location && (
            <span className="text-muted-foreground text-xs ml-auto shrink-0">
              📍 {selectedEvent.location}
            </span>
          )}
        </div>
      )}
    </main>
  )
}
