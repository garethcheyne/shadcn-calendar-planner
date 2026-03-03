"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { View, NavigateAction, DateLocalizer } from "../types"
import { navigate } from "../constants"
import { views as viewConstants } from "../constants"

export interface ToolbarProps {
  date: Date
  view: View
  views: View[]
  label: string
  localizer: DateLocalizer
  onNavigate: (action: NavigateAction, date?: Date) => void
  onView: (view: View) => void
  messages?: {
    today?: string
    previous?: string
    next?: string
    month?: string
    week?: string
    work_week?: string
    day?: string
    agenda?: string
  }
  onZoomIn?: () => void
  onZoomOut?: () => void
  canZoomIn?: boolean
  canZoomOut?: boolean
}

const defaultMessages = {
  today: "Today",
  previous: "Back",
  next: "Next",
  month: "Month",
  week: "Week",
  work_week: "Work Week",
  day: "Day",
  agenda: "Agenda",
}

export function Toolbar({
  date,
  view,
  views,
  label,
  localizer,
  onNavigate,
  onView,
  messages: messagesProp,
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
}: ToolbarProps) {
  const messages = { ...defaultMessages, ...messagesProp }
  const showZoom = view === "week" || view === "work_week" || view === "day"

  return (
    <div className="flex items-center justify-between gap-4 px-2 py-2">
      {/* Left: navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onNavigate(navigate.TODAY as NavigateAction)}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "transition-colors",
          )}
        >
          {messages.today}
        </button>
        <button
          type="button"
          onClick={() => onNavigate(navigate.PREVIOUS as NavigateAction)}
          className={cn(
            "inline-flex items-center justify-center rounded-md h-8 w-8",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "transition-colors",
          )}
          aria-label={messages.previous}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate(navigate.NEXT as NavigateAction)}
          className={cn(
            "inline-flex items-center justify-center rounded-md h-8 w-8",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "transition-colors",
          )}
          aria-label={messages.next}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Center: label + zoom */}
      <div className="flex items-center gap-2">
        {showZoom && onZoomIn && (
          <button
            type="button"
            disabled={!canZoomIn}
            onClick={onZoomIn}
            className={cn(
              "inline-flex items-center justify-center rounded-md h-7 w-7",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors",
              !canZoomIn && "opacity-40 pointer-events-none",
            )}
            aria-label="Zoom in"
            title="Zoom in (finer time slots)"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        )}
        <h2 className="text-base font-semibold text-foreground whitespace-nowrap">
          {label}
        </h2>
        {showZoom && onZoomOut && (
          <button
            type="button"
            disabled={!canZoomOut}
            onClick={onZoomOut}
            className={cn(
              "inline-flex items-center justify-center rounded-md h-7 w-7",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors",
              !canZoomOut && "opacity-40 pointer-events-none",
            )}
            aria-label="Zoom out"
            title="Zoom out (coarser time slots)"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Right: view switcher */}
      <ToggleGroupPrimitive.Root
        type="single"
        value={view}
        onValueChange={(value: string) => {
          if (value) onView(value as View)
        }}
        className="inline-flex items-center rounded-md border border-input bg-background"
      >
        {views.map((v) => (
          <ToggleGroupPrimitive.Item
            key={v}
            value={v}
            className={cn(
              "inline-flex items-center justify-center text-sm font-medium h-8 px-3",
              "first:rounded-l-md last:rounded-r-md",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "transition-colors",
              "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
            )}
          >
            {messages[v as keyof typeof messages] || v}
          </ToggleGroupPrimitive.Item>
        ))}
      </ToggleGroupPrimitive.Root>
    </div>
  )
}
