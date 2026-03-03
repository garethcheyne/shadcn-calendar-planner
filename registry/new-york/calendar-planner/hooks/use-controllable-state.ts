"use client"

import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from "react"

/**
 * Hook for controlled/uncontrolled state — replacement for the old `uncontrollable` library.
 * If `controlledValue` is provided, it acts as a controlled component.
 * Otherwise, it manages its own internal state starting from `defaultValue`.
 */
export function useControllableState<T>(
  controlledValue: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, Dispatch<SetStateAction<T>>] {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = controlledValue !== undefined

  const value = isControlled ? controlledValue : internal

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const resolved = typeof newValue === "function"
        ? (newValue as (prev: T) => T)(value)
        : newValue

      if (!isControlled) {
        setInternal(resolved)
      }
      onChange?.(resolved)
    },
    [isControlled, onChange, value],
  )

  return [value, setValue]
}
