'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleSignUp = async () => {
    setIsLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setError('Check your email for confirmation link!')
      setIsLoading(false)
    }
  }

  const isSuccess = error.includes('Check your email')

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Literary Forge</h1>
          <p className="text-[var(--muted)]">Anmelden oder Registrieren</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg
                         focus:border-[var(--foreground)] focus:outline-none
                         text-[var(--foreground)] placeholder:text-[var(--muted)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={8}
              className="w-full px-4 py-2 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg
                         focus:border-[var(--foreground)] focus:outline-none
                         text-[var(--foreground)] placeholder:text-[var(--muted)]"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">Mindestens 8 Zeichen für neue Konten.</p>
          </div>

          {error && (
            <div
              role="alert"
              className={`p-3 rounded-lg text-sm border ${
                isSuccess
                  ? 'border-green-700/50 bg-green-900/20 text-green-300 dark:text-green-300'
                  : 'border-red-700/50 bg-red-900/20 text-red-300 dark:text-red-300'
              }`}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg
                         hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? 'Lade…' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border-2 border-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                         hover:bg-[var(--card-hover)] disabled:opacity-50 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
