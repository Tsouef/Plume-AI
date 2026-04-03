import { useRef, useEffect } from 'react'

/**
 * Returns a ref that always holds the latest value of the given argument.
 * Use this to read up-to-date callbacks inside effects/event handlers
 * without adding them to dependency arrays.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
