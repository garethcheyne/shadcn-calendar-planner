"use client"

import { useEffect, useRef } from "react"

/**
 * Hook that triggers a callback when a click occurs outside the referenced element.
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callbackRef.current()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [ref])
}
