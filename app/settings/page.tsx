'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const [enableSRS, setEnableSRS] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      // Set user info
      setUserEmail(user.email || '')
      setUserId(user.id)
      setCreatedAt(user.created_at || '')

      // Load SRS setting
      const { data, error } = await supabase
        .from('user_settings')
        .select('enable_srs')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error)
      }

      if (data) {
        setEnableSRS(data.enable_srs)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleSRS(enabled: boolean) {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEnableSRS(enabled)

      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            enable_srs: enabled,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id'
          }
        )

      if (error) {
        console.error('Failed to save settings:', error)
        alert('Fehler beim Speichern der Einstellungen')
        setEnableSRS(!enabled)
      }
    } catch (error) {
      console.error('Error toggling SRS:', error)
      alert('Fehler beim Speichern der Einstellungen')
      setEnableSRS(!enabled)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      alert('Fehler beim Abmelden. Bitte versuche es erneut.')
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--muted)]">Lädt Einstellungen...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-6 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm mb-3 inline-block"
          >
            ← Zurück
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Einstellungen</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Passe dein Lernerlebnis an
          </p>
        </div>

        {/* SRS Settings Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  🔄 Spaced Repetition System (SRS)
                </h3>
                {saving && (
                  <span className="text-xs text-[var(--muted)] italic">
                    Speichert...
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Anki-ähnlicher Algorithmus für optimales Langzeitlernen.
              </p>
            </div>
            <button
              onClick={() => toggleSRS(!enableSRS)}
              disabled={saving}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors focus:outline-none
                ${enableSRS ? 'bg-[var(--foreground)]' : 'bg-[var(--border)]'}
                ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-label="Toggle Spaced Repetition"
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full
                  transition-transform
                  ${enableSRS ? 'translate-x-6 bg-black' : 'translate-x-1 bg-gray-600'}
                `}
              />
            </button>
          </div>

          {/* Mode Description */}
          <div className="text-xs text-[var(--muted)] bg-[var(--background)] border-l-2 border-white p-3 rounded">
            {enableSRS ? (
              <div>
                <p className="font-semibold text-[var(--foreground)] mb-1">✅ SRS Modus aktiv</p>
                <p className="text-[var(--muted)]">
                  Texte erscheinen basierend auf Lernintervallen (10 Min → 6h → 1 Tag → 4 Tage...).
                  Optimiert für langfristige Retention.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-[var(--foreground)] mb-1">📚 Linearer Modus aktiv</p>
                <p className="text-[var(--muted)]">
                  Texte werden der Reihe nach durchgegangen. Ideal zum "Durchpowern" neuer Bücher.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account Settings Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">
            👤 Konto
          </h3>

          <div className="space-y-3">
            {/* Email */}
            <div>
              <label className="text-xs text-[var(--muted)] block mb-1">
                Email-Adresse
              </label>
              <div className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]">
                {userEmail}
              </div>
            </div>

            {/* User ID */}
            <div>
              <label className="text-xs text-[var(--muted)] block mb-1">
                Benutzer-ID
              </label>
              <div className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--muted)] font-mono">
                {userId}
              </div>
            </div>

            {/* Account created */}
            {createdAt && (
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1">
                  Konto erstellt am
                </label>
                <div className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]">
                  {new Date(createdAt).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full mt-2 px-4 py-2 bg-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-semibold
                         hover:bg-[var(--card-hover)] transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? 'Wird abgemeldet...' : 'Abmelden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
