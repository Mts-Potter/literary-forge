'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type TrainMode = 'franklin' | 'cloze' | 'free'

export function SettingsClient({
  userEmail,
  userId,
  createdAt,
  initialEnableSRS,
  initialDefaultMode,
}: {
  userEmail: string
  userId: string
  createdAt: string
  initialEnableSRS: boolean
  initialDefaultMode: TrainMode
}) {
  const [enableSRS, setEnableSRS] = useState(initialEnableSRS)
  const [defaultMode, setDefaultMode] = useState<TrainMode>(initialDefaultMode)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function toggleSRS(enabled: boolean) {
    try {
      setSaving(true)
      setEnableSRS(enabled)
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: userId,
            enable_srs: enabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
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

  async function changeMode(next: TrainMode) {
    const prev = defaultMode
    setDefaultMode(next)
    setSaving(true)
    try {
      const res = await fetch('/api/user/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: next }),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      setDefaultMode(prev)
      alert('Fehler beim Speichern des Modus')
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

  return (
    <div className="min-h-screen bg-[var(--background)] py-6 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm mb-3 inline-block"
          >
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Einstellungen</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Passe dein Lernerlebnis an
          </p>
        </div>

        {/* Default-Mode Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
            Standard-Trainings-Modus
          </h3>
          <p className="text-sm text-[var(--muted)] mb-3">
            Wird beim Öffnen von /train verwendet. Du kannst auch direkt aus dem Dashboard in einen Modus starten oder im Training per Button wechseln.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['franklin', 'cloze', 'free'] as const).map(m => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                disabled={saving}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors
                  ${defaultMode === m
                    ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                    : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--card-hover)]'}
                  disabled:opacity-50`}
              >
                {m === 'franklin' ? 'Franklin' : m === 'cloze' ? 'Cloze' : 'Free'}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            Franklin: Lesen → Hints → Rekonstruktion · Cloze: Lückentext (in Arbeit) · Free: lesen, dann frei imitieren
          </p>
        </div>

        {/* SRS Settings Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  🔄 Verteiltes Wiederholen (SRS)
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
            <div>
              <label className="text-xs text-[var(--muted)] block mb-1">
                Email-Adresse
              </label>
              <div className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]">
                {userEmail}
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--muted)] block mb-1">
                Benutzer-ID
              </label>
              <div className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--muted)] font-mono">
                {userId}
              </div>
            </div>

            {createdAt && (
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1">
                  Konto erstellt am
                </label>
                <div className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]">
                  {new Date(createdAt).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full mt-2 px-4 py-2 bg-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-semibold
                         hover:bg-[var(--card-hover)] transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? 'Wird abgemeldet...' : 'Abmelden'}
            </button>

            <Link
              href="/settings/data"
              className="block text-center w-full mt-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-semibold hover:bg-[var(--card-hover)] transition-colors"
            >
              Daten exportieren oder löschen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
