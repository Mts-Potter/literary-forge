import { useState, useEffect } from 'react'

/**
 * Custom hook for persisting state to localStorage
 * Automatically syncs state changes to localStorage and retrieves on mount
 *
 * @param key - localStorage key
 * @param initialValue - Default value if no stored value exists
 * @returns [value, setValue] tuple similar to useState
 *
 * @example
 * const [text, setText] = useLocalStorage('draft-text', '')
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Initialize state with value from localStorage or initial value
  const [value, setValue] = useState<T>(() => {
    // Only access localStorage on client-side
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Sync state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Error saving to localStorage key "${key}":`, error)
      }
    }
  }, [key, value])

  return [value, setValue] as const
}
