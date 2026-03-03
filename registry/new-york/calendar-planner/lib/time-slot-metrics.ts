/**
 * TimeSlotMetrics — computes slot positions for time-based views (day/week).
 */

import type { DateLocalizer } from "../types"

export interface TimeSlotMetricsOptions {
  min: Date
  max: Date
  step: number
  timeslots: number
  localizer: DateLocalizer
}

export interface ITimeSlotMetrics {
  groups: Date[][]
  update(args: TimeSlotMetricsOptions): ITimeSlotMetrics
  dateIsInGroup(date: Date, groupIndex: number): boolean
  nextSlot(slot: Date): Date
  closestSlotToPosition(percent: number): Date
  closestSlotFromPoint(point: { y: number }, boundaryRect: DOMRect): Date
  closestSlotFromDate(date: Date, offset?: number): Date
  startsBeforeDay(date: Date): boolean
  startsAfterDay(date: Date): boolean
  startsBefore(date: Date): boolean
  startsAfter(date: Date): boolean
  getRange(
    rangeStart: Date,
    rangeEnd: Date,
    ignoreMin?: boolean,
    ignoreMax?: boolean,
  ): {
    top: number
    height: number
    start: number
    startDate: Date
    end: number
    endDate: Date
  }
  getCurrentTimePosition(now: Date): number
}

function getKey({ min, max, step, timeslots, localizer }: TimeSlotMetricsOptions): string {
  return `${+localizer.startOf(min, "minutes")}${+localizer.startOf(max, "minutes")}${step}-${timeslots}`
}

export function getTimeSlotMetrics(options: TimeSlotMetricsOptions): ITimeSlotMetrics {
  const { min: start, max: end, step, timeslots, localizer } = options
  const key = getKey(options)

  const totalMin = 1 + localizer.getTotalMin(start, end)
  const minutesFromMidnight = localizer.getMinutesFromMidnight(start)
  const numGroups = Math.ceil((totalMin - 1) / (step * timeslots))
  const numSlots = numGroups * timeslots

  const groups: Date[][] = new Array(numGroups)
  const slots: Date[] = new Array(numSlots)

  for (let grp = 0; grp < numGroups; grp++) {
    groups[grp] = new Array(timeslots)
    for (let slot = 0; slot < timeslots; slot++) {
      const slotIdx = grp * timeslots + slot
      const minFromStart = slotIdx * step
      slots[slotIdx] = groups[grp][slot] = localizer.getSlotDate(
        start,
        minutesFromMidnight,
        minFromStart,
      )
    }
  }

  // Extra slot at the end for selection up to day end
  const lastSlotMinFromStart = slots.length * step
  slots.push(localizer.getSlotDate(start, minutesFromMidnight, lastSlotMinFromStart))

  function positionFromDate(date: Date): number {
    const d = localizer.diff(start, date, "minutes") + localizer.getDstOffset(start, date)
    return Math.min(d, totalMin)
  }

  return {
    groups,

    update(args: TimeSlotMetricsOptions) {
      if (getKey(args) !== key) return getTimeSlotMetrics(args)
      return this
    },

    dateIsInGroup(date: Date, groupIndex: number) {
      const nextGroup = groups[groupIndex + 1]
      return localizer.inRange(
        date,
        groups[groupIndex][0],
        nextGroup ? nextGroup[0] : end,
        "minutes",
      )
    },

    nextSlot(slot: Date) {
      const idx = slots.findIndex((s) => s === slot || localizer.eq(s, slot))
      let next = slots[Math.min(idx + 1, slots.length - 1)]
      if (localizer.eq(next, slot)) {
        next = localizer.add(slot, step, "minutes")
      }
      return next
    },

    closestSlotToPosition(percent: number) {
      const slot = Math.min(slots.length - 1, Math.max(0, Math.floor(percent * numSlots)))
      return slots[slot]
    },

    closestSlotFromPoint(point: { y: number }, boundaryRect: DOMRect) {
      const range = Math.abs(boundaryRect.top - boundaryRect.bottom)
      return this.closestSlotToPosition((point.y - boundaryRect.top) / range)
    },

    closestSlotFromDate(date: Date, offset: number = 0) {
      if (localizer.lt(date, start, "minutes")) return slots[0]
      if (localizer.gt(date, end, "minutes")) return slots[slots.length - 1]
      const diffMins = localizer.diff(start, date, "minutes")
      return slots[(diffMins - (diffMins % step)) / step + offset]
    },

    startsBeforeDay(date: Date) {
      return localizer.lt(date, start, "day")
    },

    startsAfterDay(date: Date) {
      return localizer.gt(date, end, "day")
    },

    startsBefore(date: Date) {
      return localizer.lt(localizer.merge(start, date), start, "minutes")
    },

    startsAfter(date: Date) {
      return localizer.gt(localizer.merge(end, date), end, "minutes")
    },

    getRange(rangeStart: Date, rangeEnd: Date, ignoreMin?: boolean, ignoreMax?: boolean) {
      if (!ignoreMin) rangeStart = localizer.min(end, localizer.max(start, rangeStart))
      if (!ignoreMax) rangeEnd = localizer.min(end, localizer.max(start, rangeEnd))

      const rangeStartMin = positionFromDate(rangeStart)
      const rangeEndMin = positionFromDate(rangeEnd)
      const top =
        rangeEndMin > step * numSlots && !localizer.eq(end, rangeEnd)
          ? ((rangeStartMin - step) / (step * numSlots)) * 100
          : (rangeStartMin / (step * numSlots)) * 100

      return {
        top,
        height: (rangeEndMin / (step * numSlots)) * 100 - top,
        start: positionFromDate(rangeStart),
        startDate: rangeStart,
        end: positionFromDate(rangeEnd),
        endDate: rangeEnd,
      }
    },

    getCurrentTimePosition(now: Date) {
      const rangeStartMin = positionFromDate(now)
      return (rangeStartMin / (step * numSlots)) * 100
    },
  }
}
