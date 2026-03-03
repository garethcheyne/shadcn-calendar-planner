/**
 * No-overlap layout algorithm — resizes events so they don't visually overlap.
 * Ported from react-big-calendar to TypeScript.
 */

import type { Accessors, CalendarEvent, StyledEvent } from "../../types"
import type { ITimeSlotMetrics } from "../time-slot-metrics"
import overlapLayout from "./overlap"

interface StyledNode extends StyledEvent {
  friends: StyledNode[]
  idx?: number
  size?: number
}

function getMaxIdxDFS(node: StyledNode, maxIdx: number, visited: StyledNode[]): number {
  for (const friend of node.friends) {
    if (visited.includes(friend)) continue
    maxIdx = Math.max(maxIdx, friend.idx ?? 0)
    visited.push(friend)
    const newIdx = getMaxIdxDFS(friend, maxIdx, visited)
    maxIdx = Math.max(maxIdx, newIdx)
  }
  return maxIdx
}

export default function noOverlapLayout({
  events,
  minimumStartDifference,
  slotMetrics,
  accessors,
}: {
  events: CalendarEvent[]
  minimumStartDifference: number
  slotMetrics: ITimeSlotMetrics
  accessors: Accessors
}): StyledEvent[] {
  const styledEvents: StyledNode[] = overlapLayout({
    events,
    minimumStartDifference,
    slotMetrics,
    accessors,
  }).map((se) => ({
    ...se,
    friends: [],
  }))

  // Sort by top position, then by height
  styledEvents.sort((a, b) => {
    if (a.style.top !== b.style.top) return a.style.top > b.style.top ? 1 : -1
    if (a.style.height !== b.style.height)
      return a.style.top + a.style.height < b.style.top + b.style.height ? 1 : -1
    return 0
  })

  // Reset properties
  for (const se of styledEvents) {
    se.friends = []
    delete se.idx
    delete se.size
  }

  // Find overlapping friends
  for (let i = 0; i < styledEvents.length - 1; i++) {
    const se1 = styledEvents[i]
    const y1 = se1.style.top
    const y2 = se1.style.top + se1.style.height

    for (let j = i + 1; j < styledEvents.length; j++) {
      const se2 = styledEvents[j]
      const y3 = se2.style.top
      const y4 = se2.style.top + se2.style.height

      if ((y3 >= y1 && y4 <= y2) || (y4 > y1 && y4 <= y2) || (y3 >= y1 && y3 < y2)) {
        se1.friends.push(se2)
        se2.friends.push(se1)
      }
    }
  }

  // Assign column indices via bitmap
  for (const se of styledEvents) {
    const bitmap = new Array(100).fill(1)
    for (const friend of se.friends) {
      if (friend.idx !== undefined) bitmap[friend.idx] = 0
    }
    se.idx = bitmap.indexOf(1)
  }

  // Calculate sizes
  for (const se of styledEvents) {
    if (se.size) continue
    const allFriends: StyledNode[] = []
    const maxIdx = getMaxIdxDFS(se, 0, allFriends)
    const size = 100 / (maxIdx + 1)
    se.size = size
    for (const friend of allFriends) friend.size = size
  }

  // Apply final styles
  for (const e of styledEvents) {
    e.style.xOffset = (e.idx ?? 0) * (e.size ?? 100)
    e.style.width = e.size ?? 100

    // Stretch to max width when possible
    let maxIdx = 0
    for (const friend of e.friends) {
      maxIdx = Math.max(maxIdx, friend.idx ?? 0)
    }
    if (maxIdx <= (e.idx ?? 0)) {
      e.style.width = 100 - e.style.xOffset
    }
  }

  return styledEvents.map(({ event, style }) => ({ event, style }))
}
