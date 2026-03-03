/**
 * Resource grouping utilities.
 */

import type { Accessors, CalendarEvent, Resource } from "../types"

export const NONE = {} as Resource

export interface ResourceManager<TEvent extends CalendarEvent = CalendarEvent> {
  map<T>(fn: (resource: [string | number | typeof NONE, Resource | null], index: number) => T): T[]
  groupEvents(events: TEvent[]): Map<string | number | typeof NONE, TEvent[]>
}

export function Resources<TEvent extends CalendarEvent>(
  resources: Resource[] | undefined,
  accessors: Accessors<TEvent>,
): ResourceManager<TEvent> {
  return {
    map<T>(fn: (resource: [string | number | typeof NONE, Resource | null], index: number) => T): T[] {
      if (!resources) return [fn([NONE as unknown as string, null], 0)]
      return resources.map((resource, idx) =>
        fn([accessors.resourceId?.(resource as unknown as TEvent) ?? (resource.id as string), resource], idx),
      )
    },

    groupEvents(events: TEvent[]) {
      const eventsByResource = new Map<string | number | typeof NONE, TEvent[]>()

      if (!resources) {
        eventsByResource.set(NONE as unknown as string, events)
        return eventsByResource
      }

      for (const event of events) {
        const id = (accessors.resource?.(event) as string | number | Array<string | number>) || NONE
        if (Array.isArray(id)) {
          for (const item of id) {
            const resourceEvents = eventsByResource.get(item) || []
            resourceEvents.push(event)
            eventsByResource.set(item, resourceEvents)
          }
        } else {
          const resourceEvents = eventsByResource.get(id as string | number) || []
          resourceEvents.push(event)
          eventsByResource.set(id as string | number, resourceEvents)
        }
      }
      return eventsByResource
    },
  }
}
