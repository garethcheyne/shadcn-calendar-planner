/**
 * Selection — low-level pointer interaction engine for calendar.
 * Handles mouse/touch click, drag-select, double-click, and long-press.
 * Fully TypeScript, no external dependencies.
 */

type SelectionHandler = (...args: unknown[]) => void

interface Point {
  x: number
  y: number
  clientX: number
  clientY: number
}

export interface SelectionBounds {
  top: number
  left: number
  right: number
  bottom: number
  x: number
  y: number
}

export function getBoundsForNode(node: HTMLElement): SelectionBounds {
  const rect = node.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

export function getEventNodeFromPoint(
  node: HTMLElement,
  point: { clientX: number; clientY: number },
): HTMLElement | null {
  const target = document.elementFromPoint(point.clientX, point.clientY)
  return target?.closest?.("[data-event]") as HTMLElement | null
}

export function getShowMoreNodeFromPoint(
  node: HTMLElement,
  point: { clientX: number; clientY: number },
): HTMLElement | null {
  const target = document.elementFromPoint(point.clientX, point.clientY)
  return target?.closest?.("[data-show-more]") as HTMLElement | null
}

export function isEvent(node: HTMLElement, point: { clientX: number; clientY: number }): boolean {
  return !!getEventNodeFromPoint(node, point)
}

export function isShowMore(node: HTMLElement, point: { clientX: number; clientY: number }): boolean {
  return !!getShowMoreNodeFromPoint(node, point)
}

export function objectsCollide(
  nodeA: SelectionBounds,
  nodeB: SelectionBounds,
  tolerance: number = 0,
): boolean {
  return !(
    nodeA.bottom - tolerance < nodeB.top ||
    nodeA.top + tolerance > nodeB.bottom ||
    nodeA.right - tolerance < nodeB.left ||
    nodeA.left + tolerance > nodeB.right
  )
}

function pointInBox(box: SelectionBounds, point: { x: number; y: number }): boolean {
  return point.y >= box.top && point.y <= box.bottom && point.x >= box.left && point.x <= box.right
}

function getEventCoordinates(e: MouseEvent | TouchEvent): Point {
  if ("touches" in e && e.touches.length > 0) {
    const touch = e.touches[0]
    return { x: touch.pageX, y: touch.pageY, clientX: touch.clientX, clientY: touch.clientY }
  }
  if ("changedTouches" in e && e.changedTouches.length > 0) {
    const touch = e.changedTouches[0]
    return { x: touch.pageX, y: touch.pageY, clientX: touch.clientX, clientY: touch.clientY }
  }
  const mouse = e as MouseEvent
  return { x: mouse.pageX, y: mouse.pageY, clientX: mouse.clientX, clientY: mouse.clientY }
}

const CLICK_THRESHOLD = 5
const LONG_PRESS_THRESHOLD = 250

export class Selection {
  private node: HTMLElement
  private longPressThreshold: number
  private listeners: Map<string, Set<SelectionHandler>>
  private cleanups: Array<() => void>
  private selecting: boolean
  private initialPoint: Point | null
  private longPressTimer: ReturnType<typeof setTimeout> | null

  constructor(
    node: HTMLElement,
    options: { longPressThreshold?: number } = {},
  ) {
    this.node = node
    this.longPressThreshold = options.longPressThreshold ?? LONG_PRESS_THRESHOLD
    this.listeners = new Map()
    this.cleanups = []
    this.selecting = false
    this.initialPoint = null
    this.longPressTimer = null

    this._addListeners()
  }

  on(type: string, handler: SelectionHandler): this {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(handler)
    return this
  }

  off(type: string, handler: SelectionHandler): this {
    this.listeners.get(type)?.delete(handler)
    return this
  }

  emit(type: string, ...args: unknown[]): void {
    this.listeners.get(type)?.forEach((fn) => fn(...args))
  }

  teardown(): void {
    this._clearLongPress()
    this.cleanups.forEach((fn) => fn())
    this.cleanups = []
    this.listeners.clear()
    this.selecting = false
  }

  isSelected(node: HTMLElement): boolean {
    return false // placeholder for external use
  }

  private _listen(
    target: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ): void {
    target.addEventListener(event, handler, options)
    this.cleanups.push(() => target.removeEventListener(event, handler, options))
  }

  private _addListeners(): void {
    this._listen(this.node, "mousedown", this._onMouseDown as EventListener)
    this._listen(this.node, "touchstart", this._onTouchStart as EventListener, { passive: false })

    // Keyboard escape
    this._listen(document, "keydown", ((e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.selecting = false
        this._clearLongPress()
        this.emit("reset")
      }
    }) as EventListener)
  }

  private _onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return // left button only

    const point = getEventCoordinates(e)
    this.initialPoint = point

    const onMove = (e: MouseEvent) => {
      const current = getEventCoordinates(e)
      if (!this.selecting && this._isClick(this.initialPoint!, current)) return

      if (!this.selecting) {
        this.selecting = true
        this.emit("selectStart", this.initialPoint)
      }
      this.emit("selecting", {
        ...current,
        initial: this.initialPoint,
      })
    }

    const onUp = (e: MouseEvent) => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)

      const point = getEventCoordinates(e)

      if (this.selecting) {
        this.selecting = false
        this.emit("select", {
          ...point,
          initial: this.initialPoint,
        })
        this.emit("reset")
      } else {
        // It's a click
        if (!this._isClick(this.initialPoint!, point)) return
        this.emit("click", point)
      }
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  private _onTouchStart = (e: TouchEvent): void => {
    const point = getEventCoordinates(e)
    this.initialPoint = point

    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.selecting = true
      this.emit("selectStart", point)
    }, this.longPressThreshold)

    const onMove = (e: TouchEvent) => {
      const current = getEventCoordinates(e)
      this._clearLongPress()

      if (!this.selecting && !this._isClick(this.initialPoint!, current)) {
        // Scrolling, not selecting
        return
      }

      if (this.selecting) {
        e.preventDefault()
        this.emit("selecting", {
          ...current,
          initial: this.initialPoint,
        })
      }
    }

    const onEnd = (e: TouchEvent) => {
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend", onEnd)
      this._clearLongPress()

      const point = getEventCoordinates(e)

      if (this.selecting) {
        this.selecting = false
        this.emit("select", {
          ...point,
          initial: this.initialPoint,
        })
        this.emit("reset")
      } else {
        this.emit("click", point)
      }
    }

    document.addEventListener("touchmove", onMove, { passive: false })
    document.addEventListener("touchend", onEnd)
  }

  private _clearLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  private _isClick(initial: Point, current: Point): boolean {
    return (
      Math.abs(current.x - initial.x) <= CLICK_THRESHOLD &&
      Math.abs(current.y - initial.y) <= CLICK_THRESHOLD
    )
  }
}

// ─── Selection helpers for date cells ─────────────────────────────────

export function slotWidth(rowBox: SelectionBounds, slots: number): number {
  return (rowBox.right - rowBox.left) / slots
}

export function getSlotAtX(
  rowBox: SelectionBounds,
  x: number,
  rtl: boolean,
  slots: number,
): number {
  const cellWidth = slotWidth(rowBox, slots)
  return rtl
    ? slots - 1 - Math.floor((x - rowBox.left) / cellWidth)
    : Math.floor((x - rowBox.left) / cellWidth)
}

export function dateCellSelection(
  start: number,
  rowBox: SelectionBounds,
  box: { x: number; y: number },
  slots: number,
  rtl: boolean,
): { startIdx: number; endIdx: number } {
  let stIdx = start
  let endIdx = getSlotAtX(rowBox, box.x, rtl, slots)

  if (stIdx > endIdx) {
    ;[stIdx, endIdx] = [endIdx, stIdx]
  }

  stIdx = Math.max(stIdx, 0)
  endIdx = Math.min(endIdx, slots - 1)

  return { startIdx: stIdx, endIdx }
}
