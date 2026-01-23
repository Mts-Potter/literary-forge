'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SettingsPage() {
  const [enableSRS, setEnableSRS] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

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

      const { data, error } = await supabase
        .from('user_settings')
        .select('enable_srs')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (first time user)
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
        // Revert on error
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-lg text-gray-400">Lädt Einstellungen...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors text-sm mb-4 inline-block"
          >
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-3xl font-bold text-white">Einstellungen</h1>
          <p className="text-gray-400 mt-2">
            Passe dein Lernerlebnis an deine Bedürfnisse an
          </p>
        </div>

        {/* Settings Card */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-6 space-y-6">
          {/* SRS Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">
                  🔄 Spaced Repetition System (SRS)
                </h3>
                {saving && (
                  <span className="text-xs text-gray-500 italic">
                    Speichert...
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Anki-ähnlicher Algorithmus für optimales Langzeitlernen.
                Texte werden basierend auf deiner Performance automatisch wiederholt.
              </p>
            </div>
            <button
              onClick={() => toggleSRS(!enableSRS)}
              disabled={saving}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#171717]
                ${enableSRS ? 'bg-white' : 'bg-[#262626]'}
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
          <div className="text-sm text-gray-300 bg-[#0a0a0a] border-l-4 border-white p-4 rounded">
            {enableSRS ? (
              <div>
                <p className="font-semibold text-white mb-2">
                  ✅ SRS Modus aktiv
                </p>
                <ul className="space-y-1 text-gray-400">
                  <li>• Texte erscheinen basierend auf Lernintervallen</li>
                  <li>• Anki-ähnliche Zeitabstände: 10 Min → 6h → 1 Tag → 4 Tage...</li>
                  <li>• Automatisches Scheduling basierend auf deinem Score</li>
                  <li>• Optimiert für langfristige Retention</li>
                </ul>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-white mb-2">
                  📚 Linearer Modus aktiv
                </p>
                <ul className="space-y-1 text-gray-400">
                  <li>• Texte werden einfach der Reihe nach durchgegangen</li>
                  <li>• Kein Scheduling oder Wiederholungen</li>
                  <li>• Gut für schnellen Überblick über alle Inhalte</li>
                  <li>• Ideal zum "Durchpowern" neuer Bücher</li>
                </ul>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="text-xs text-gray-400 bg-[#0a0a0a] p-3 rounded border border-[#262626]">
            <p className="font-semibold text-white mb-1">💡 Tipp:</p>
            <p className="text-gray-400">
              Du kannst jederzeit zwischen den Modi wechseln. Dein Fortschritt bleibt
              in beiden Modi erhalten. Im SRS-Modus werden bereits gesehene Texte
              basierend auf deiner Performance wiederholt.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
