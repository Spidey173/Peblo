import { useEffect, useRef, useCallback } from 'react'

/**
 * Robust debounced function hook.
 * Uses a callback ref so the returned debounced function reference stays stable
 * and never closes over stale state or triggers unwanted effect runs.
 *
 * @param {Function} callback
 * @param {number} delay - ms
 */
export function useDebounce(callback, delay) {
  const callbackRef = useRef(callback)
  const timerRef = useRef(null)

  useEffect(() => {
    callbackRef.current = callback
  })

  const debounced = useCallback(
    (...args) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        callbackRef.current?.(...args)
      }, delay)
    },
    [delay]
  )

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return debounced
}
