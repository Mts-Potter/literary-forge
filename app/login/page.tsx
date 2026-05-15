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
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-md p-10 w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-[family-name:var(--font-fraunces)] font-light text-4xl text-[var(--foreground)] mb-1 tracking-tight">
            The Franklin Method
          </h1>
          <p className="font-[family-name:var(--font-fraunces)] italic text-sm text-[var(--muted)]">
            Anmelden oder Konto anlegen
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md
                         focus:border-[var(--accent)] focus:outline-none
                         text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={8}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md
                         focus:border-[var(--accent)] focus:outline-none
                         text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">Mindestens 8 Zeichen für neue Konten.</p>
          </div>

          {error && (
            <div
              role="alert"
              className={`px-3 py-2 rounded-md text-sm border ${
                isSuccess
                  ? 'border-[var(--accent)] bg-[var(--card-hover)] text-[var(--foreground)]'
                  : 'border-red-700/40 bg-red-900/10 text-red-300/90'
              }`}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-medium rounded-md
                         hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? 'Lade…' : 'Anmelden'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-md
                         hover:bg-[var(--card-hover)] hover:border-[var(--accent)] disabled:opacity-50 transition-colors"
            >
              Registrieren
            </button>
          </div>
        </form>

        <p className="font-[family-name:var(--font-fraunces)] italic text-xs text-[var(--muted)] text-center mt-8">
          Eine Anmeldung genügt für alle drei Modi.
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
