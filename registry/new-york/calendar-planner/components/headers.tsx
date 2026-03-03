"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { DateLocalizer } from "../types"

export interface HeaderProps {
  date: Date
  label: string
  localizer: DateLocalizer
}

export function Header({ label }: HeaderProps) {
  return (
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {label}
    </span>
  )
}

export interface DateHeaderProps {
  date: Date
  label: string
  drilldownView?: string | null
  isOffRange?: boolean
  isToday?: boolean
  onDrillDown?: () => void
}

export function DateHeader({
  label,
  drilldownView,
  isOffRange,
  isToday,
  onDrillDown,
}: DateHeaderProps) {
  if (drilldownView) {
    return (
      <button
        type="button"
        onClick={onDrillDown}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOffRange && "text-muted-foreground/50",
          isToday && "bg-primary text-primary-foreground font-semibold",
        )}
      >
        {label}
      </button>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
        isOffRange && "text-muted-foreground/50",
        isToday && "bg-primary text-primary-foreground font-semibold",
      )}
    >
      {label}
    </span>
  )
}

export interface ResourceHeaderProps {
  label: React.ReactNode
  index: number
  resource: unknown
}

export function ResourceHeader({ label }: ResourceHeaderProps) {
  return (
    <span className="text-xs font-medium text-foreground truncate">
      {label}
    </span>
  )
}
