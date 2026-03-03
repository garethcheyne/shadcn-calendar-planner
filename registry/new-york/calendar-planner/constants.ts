import type { NavigateAction, View } from "./types"

export const navigate: Record<string, NavigateAction> = {
  PREVIOUS: "PREV",
  NEXT: "NEXT",
  TODAY: "TODAY",
  DATE: "DATE",
} as const

export const views: Record<string, View> = {
  MONTH: "month",
  WEEK: "week",
  WORK_WEEK: "work_week",
  DAY: "day",
  AGENDA: "agenda",
} as const
