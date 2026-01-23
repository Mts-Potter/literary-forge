'use client'

import { useLocalStorage } from './use-local-storage'
import { useEffect, useState } from 'react'

/**
 * Global dark mode hook
 * Syncs theme across all components via localStorage
 *
 * FIX: Prevents hydration mismatch by using mounted state
 */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('dark-mode', false)
  const [mounted, setMounted] = useState(false)

  // Only enable dark mode after client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync with document root for global CSS (optional)
  useEffect(() => {
    if (!mounted) return

    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode, mounted])

  // Return false during SSR to match server render
  return [mounted ? isDarkMode : false, setIsDarkMode] as const
}
