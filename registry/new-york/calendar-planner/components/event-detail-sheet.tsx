"use client"

import * as React from "react"
import { useState, useCallback, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { CalendarEvent, EventDetailSheetProps, DateLocalizer } from "../types"

// ─── Helpers ──────────────────────────────────────────────────────
function formatTime(date: Date, localizer: DateLocalizer, culture?: string): string {
  try {
    return localizer.format(date, "h:mm a" as any, culture)
  } catch {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  }
}

function formatDate(date: Date, localizer: DateLocalizer, culture?: string): string {
  try {
    return localizer.format(date, "EEEE, MMMM d, yyyy" as any, culture)
  } catch {
    return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  }
}

function formatInputDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatInputTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${min}`
}

// ─── Default Event Detail Sheet ───────────────────────────────────
export function EventDetailSheet<TEvent extends CalendarEvent = CalendarEvent>({
  event,
  open,
  onOpenChange,
  title,
  start,
  end,
  isAllDay,
  localizer,
  onSave,
  onDelete,
  children,
  side = "right",
}: EventDetailSheetProps<TEvent>) {
  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [editDescription, setEditDescription] = useState(
    (event as Record<string, unknown>).desc as string ||
    (event as Record<string, unknown>).description as string ||
    "",
  )
  const [editDate, setEditDate] = useState(formatInputDate(start))
  const [editStartTime, setEditStartTime] = useState(formatInputTime(start))
  const [editEndTime, setEditEndTime] = useState(formatInputTime(end))
  const [editAllDay, setEditAllDay] = useState(isAllDay)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Reset edit state when event changes
  useEffect(() => {
    setEditTitle(title)
    setEditDescription(
      (event as Record<string, unknown>).desc as string ||
      (event as Record<string, unknown>).description as string ||
      "",
    )
    setEditDate(formatInputDate(start))
    setEditStartTime(formatInputTime(start))
    setEditEndTime(formatInputTime(end))
    setEditAllDay(isAllDay)
    setIsEditing(false)
    setValidationError(null)
  }, [event, title, start, end, isAllDay])

  const handleSave = useCallback(() => {
    if (!onSave) return

    // Parse date+time back
    const [yr, mo, dy] = editDate.split("-").map(Number)
    const [sh, sm] = editStartTime.split(":").map(Number)
    const [eh, em] = editEndTime.split(":").map(Number)

    const newStart = new Date(yr, mo - 1, dy, editAllDay ? 0 : sh, editAllDay ? 0 : sm)
    const newEnd = new Date(yr, mo - 1, dy, editAllDay ? 23 : eh, editAllDay ? 59 : em)

    // Validate: end must not be before start
    if (!editAllDay && newEnd <= newStart) {
      setValidationError("End time must be after start time.")
      return
    }
    setValidationError(null)

    const updated = {
      ...event,
      title: editTitle,
      desc: editDescription || undefined,
      description: editDescription || undefined,
      start: newStart,
      end: newEnd,
      allDay: editAllDay,
    } as TEvent

    onSave(updated, event)
    setIsEditing(false)
  }, [event, editTitle, editDescription, editDate, editStartTime, editEndTime, editAllDay, onSave])

  const handleDelete = useCallback(() => {
    onDelete?.(event)
    onOpenChange(false)
  }, [event, onDelete, onOpenChange])

  // Extra fields from the event (location, attendees, category, color, etc.)
  const location = (event as Record<string, unknown>).location as string | undefined
  const attendees = (event as Record<string, unknown>).attendees as string[] | undefined
  const category = (event as Record<string, unknown>).category as string | undefined
  const color = (event as Record<string, unknown>).color as string | undefined

  const timeDisplay = isAllDay
    ? "All day"
    : `${formatTime(start, localizer)} – ${formatTime(end, localizer)}`

  const dateDisplay = formatDate(start, localizer)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="flex flex-col overflow-y-auto">
        <SheetHeader>
          {/* Color accent bar */}
          {color && (
            <div
              className="h-1.5 w-full rounded-full -mt-1 mb-1"
              style={{ backgroundColor: color }}
            />
          )}

          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={cn(
                "w-full rounded-md border border-input bg-transparent px-3 py-2 text-lg font-semibold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              autoFocus
            />
          ) : (
            <SheetTitle className="text-lg">{title}</SheetTitle>
          )}

          <SheetDescription>
            {isEditing ? (
              <div className="space-y-3 mt-1">
                {/* Validation error */}
                {validationError && (
                  <p className="text-sm font-medium text-destructive" role="alert">
                    {validationError}
                  </p>
                )}

                {/* Date */}
                <div>
                  <label htmlFor="sheet-edit-date" className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
                  <input
                    id="sheet-edit-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className={cn(
                      "w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  />
                </div>

                {/* All-day toggle */}
                <label htmlFor="sheet-edit-allday" className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="sheet-edit-allday"
                    type="checkbox"
                    checked={editAllDay}
                    onChange={(e) => setEditAllDay(e.target.checked)}
                    className="rounded border-input accent-primary"
                  />
                  <span className="text-sm">All day</span>
                </label>

                {/* Time range (hidden if all-day) */}
                {!editAllDay && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="sheet-edit-start-time" className="text-xs font-medium text-muted-foreground block mb-1">Start</label>
                      <input
                        id="sheet-edit-start-time"
                        type="time"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className={cn(
                          "w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        )}
                      />
                    </div>
                    <div>
                      <label htmlFor="sheet-edit-end-time" className="text-xs font-medium text-muted-foreground block mb-1">End</label>
                      <input
                        id="sheet-edit-end-time"
                        type="time"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className={cn(
                          "w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label htmlFor="sheet-edit-description" className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                  <textarea
                    id="sheet-edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    placeholder="Add a description..."
                    className={cn(
                      "w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm resize-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-1">
                {/* Date & Time */}
                <div className="flex items-center gap-2 text-sm">
                  <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <div>
                    <span className="text-foreground">{dateDisplay}</span>
                    <span className="text-muted-foreground block">{timeDisplay}</span>
                  </div>
                </div>

                {/* Description */}
                {!!(editDescription || (event as Record<string, unknown>).desc || (event as Record<string, unknown>).description) && (
                  <div className="flex items-start gap-2 text-sm">
                    <svg className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="text-foreground/80">
                      {(event as Record<string, unknown>).desc as string || (event as Record<string, unknown>).description as string}
                    </p>
                  </div>
                )}

                {/* Location */}
                {location && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="text-foreground/80">{location}</span>
                  </div>
                )}

                {/* Attendees */}
                {attendees && attendees.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <svg className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <div className="flex flex-wrap gap-1.5">
                      {attendees.map((name) => (
                        <span
                          key={name}
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            "bg-secondary text-secondary-foreground",
                          )}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category */}
                {category && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                      {category}
                    </span>
                  </div>
                )}
              </div>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Custom content (from children or eventDetailContent callback) */}
        {children && (
          <div className="px-4 pb-2">
            {children}
          </div>
        )}

        {/* Footer with action buttons */}
        <SheetFooter>
          {isEditing ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setIsEditing(false)}
                className={cn(
                  "flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium",
                  "hover:bg-accent hover:text-accent-foreground transition-colors",
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={cn(
                  "flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium",
                  "hover:bg-primary/90 transition-colors",
                )}
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              {onSave && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    "flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium",
                    "hover:bg-accent hover:text-accent-foreground transition-colors",
                    "inline-flex items-center justify-center gap-1.5",
                  )}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className={cn(
                    "rounded-md border border-destructive/30 text-destructive px-4 py-2 text-sm font-medium",
                    "hover:bg-destructive/10 transition-colors",
                    "inline-flex items-center justify-center gap-1.5",
                  )}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete
                </button>
              )}
              <SheetClose
                className={cn(
                  "flex-1 rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium",
                  "hover:bg-secondary/80 transition-colors",
                )}
              >
                Close
              </SheetClose>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

EventDetailSheet.displayName = "EventDetailSheet"
