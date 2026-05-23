import { useEffect, useRef } from 'react'

/**
 * Returns a debounced version of the callback.
 * @param {Function} callback
 * @param {number} delay - ms
 */
export function useDebounce(callback, delay) {
  const timerRef = useRef(null)

  const debounced = (...args) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => callback(...args), delay)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return debounced
}
