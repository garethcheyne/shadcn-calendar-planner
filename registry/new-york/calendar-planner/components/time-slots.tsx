"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { DateLocalizer } from "../types"

export interface TimeSlotGroupProps {
  group: Date[]
  resource?: unknown
  renderSlot?: (value: Date, index: number) => React.ReactNode
  getters?: {
    slotProp?: (date: Date, resourceId?: string | number) => {
      className?: string
      style?: React.CSSProperties
    }
  }
  resourceId?: string | number
}

export function TimeSlotGroup({
  group,
  renderSlot,
  getters,
  resourceId,
}: TimeSlotGroupProps) {
  return (
    <div className="flex flex-col border-b border-border/50 min-h-10">
      {group.map((value, idx) => {
        const slotProps = getters?.slotProp?.(value, resourceId) ?? {}
        return (
          <div
            key={idx}
            className={cn(
              "flex-1",
              idx > 0 && "border-t border-border/30 border-dashed",
              slotProps.className,
            )}
            style={slotProps.style}
          >
            {renderSlot?.(value, idx)}
          </div>
        )
      })}
    </div>
  )
}

export interface TimeGutterProps {
  min: Date
  max: Date
  step: number
  timeslots: number
  localizer: DateLocalizer
  getNow: () => Date
  resource?: unknown
  gutterRef?: React.Ref<HTMLDivElement>
}

export function TimeGutter({
  min,
  max,
  step,
  timeslots,
  localizer,
  getNow,
  gutterRef,
}: TimeGutterProps) {
  const totalMin = 1 + localizer.getTotalMin(min, max)
  const minutesFromMidnight = localizer.getMinutesFromMidnight(min)
  const numGroups = Math.ceil((totalMin - 1) / (step * timeslots))

  const groups: Date[][] = []
  for (let grp = 0; grp < numGroups; grp++) {
    const group: Date[] = []
    for (let slot = 0; slot < timeslots; slot++) {
      const slotIdx = grp * timeslots + slot
      const minFromStart = slotIdx * step
      group.push(localizer.getSlotDate(min, minutesFromMidnight, minFromStart))
    }
    groups.push(group)
  }

  return (
    <div ref={gutterRef} className="flex flex-col w-16 shrink-0 border-r border-border select-none">
      {groups.map((group, idx) => (
        <TimeSlotGroup
          key={idx}
          group={group}
          renderSlot={(value, slotIdx) =>
            slotIdx === 0 ? (
              <span className="block -mt-2.5 pr-2 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                {localizer.format(value, "timeGutterFormat")}
              </span>
            ) : null
          }
        />
      ))}
    </div>
  )
}
