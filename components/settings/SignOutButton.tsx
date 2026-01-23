'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
        alert('Fehler beim Abmelden. Bitte versuche es erneut.')
        setIsLoading(false)
        return
      }

      // Redirect to home page
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      alert('Fehler beim Abmelden. Bitte versuche es erneut.')
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold
                 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Wird abgemeldet...' : 'Abmelden'}
    </button>
  )
}
