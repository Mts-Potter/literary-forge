'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Onboarding-Flow (Phase 6.3)
 *
 * 3-Schritt-Wizard für neue User:
 *  1. Erklärung Franklin-Methode
 *  2. Modus-Wahl (Default-Modus für neue Karten)
 *  3. Erstes Buch wählen oder ins Training
 *
 * Setzt user_settings.onboarded_at am Ende, sodass Navbar/Dashboard das
 * Onboarding nicht erneut anzeigen.
 */
export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'franklin' | 'cloze' | 'free'>('franklin')
  const [saving, setSaving] = useState(false)

  async function finish() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            default_mode: mode,
            onboarded_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
      router.push('/train')
      router.refresh()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="mb-6 flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`flex-1 h-1 rounded ${i <= step ? 'bg-[var(--foreground)]' : 'bg-[var(--border)]'}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">Willkommen bei Literary Forge</h1>
            <p className="text-[var(--foreground)] leading-relaxed mb-4">
              Diese App lernt dir Schreibstil mit der Methode, die Benjamin Franklin
              vor 230 Jahren erfand und die moderne Lernforschung bestätigt hat:
            </p>
            <ol className="space-y-3 text-[var(--foreground)] leading-relaxed list-decimal list-inside mb-6">
              <li><strong className="text-[var(--foreground)]">Lesen</strong> — Original aufmerksam mit Stilmarkern</li>
              <li><strong className="text-[var(--foreground)]">Hints</strong> — pro Satz einen Inhalts-Hinweis schreiben</li>
              <li><strong className="text-[var(--foreground)]">Vergessen</strong> — SRS plant die Wiederholung</li>
              <li><strong className="text-[var(--foreground)]">Rekonstruieren</strong> — aus den Hints den Stil zurückholen</li>
              <li><strong className="text-[var(--foreground)]">Vergleichen</strong> — messbare Stildistanz + Diff</li>
            </ol>
            <button
              onClick={() => setStep(1)}
              className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90"
            >
              Weiter →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">Welcher Default-Modus?</h1>
            <p className="text-[var(--muted)] mb-6">Du kannst das jederzeit in den Einstellungen ändern.</p>
            <div className="space-y-3">
              {([
                {
                  value: 'franklin',
                  label: 'Franklin-Loop (Empfehlung)',
                  desc: 'Lesen → Hints → Inkubation → Rekonstruktion. Diszipliniert, aber wirksam.'
                },
                {
                  value: 'cloze',
                  label: 'Cloze (Lückentext)',
                  desc: 'Anki-Stil mit zunehmend mehr Lücken. Aktuell in Arbeit.'
                },
                {
                  value: 'free',
                  label: 'Free-Writing',
                  desc: 'Original lesen, dann frei imitieren. Niedrigste Disziplin, hohe Freiheit.'
                }
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                    mode === opt.value
                      ? 'border-white bg-[var(--card-hover)]'
                      : 'border-[var(--border)] hover:border-[var(--muted)]'
                  }`}
                >
                  <div className="font-semibold text-[var(--foreground)]">{opt.label}</div>
                  <div className="text-sm text-[var(--muted)] mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(0)}
                className="px-5 py-3 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--card-hover)]"
              >
                ← Zurück
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90"
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">Du bist bereit.</h1>
            <p className="text-[var(--foreground)] leading-relaxed mb-6">
              Wir starten mit einem zufälligen Chunk aus deiner Bibliothek. Du
              kannst jederzeit über <strong className="text-[var(--foreground)]">/books</strong> ein bestimmtes Buch wählen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={saving}
                className="px-5 py-3 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--card-hover)]"
              >
                ← Zurück
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Speichere...' : 'Training starten →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
