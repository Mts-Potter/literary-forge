'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StyleMarkerOverlay } from '../shared/StyleMarkerOverlay'
import { NlpPreWarm } from '../NlpPreWarm'

/**
 * Franklin Encoding Phase (Tag 0)
 *
 * Schritt 1 des Franklin-Loops: User liest das Original mit visualisierten
 * Stilmarkern und schreibt zu jedem Satz EINEN kurzen Inhalts-Hinweis
 * (4-8 Wörter). Diese Hints werden gespeichert und sind die einzige Vorlage
 * für die spätere Rekonstruktionsphase.
 *
 * Nach Submit: phase wechselt zu 'retrieval', next_review = morgen.
 */

interface Chunk {
  text_id: string
  source_texts: {
    id: string
    title: string
    content: string
    metrics: any
    author?: { name: string } | { name: string }[]
  }
}

export function FranklinEncodingPhase({
  initialChunk,
  userId
}: {
  initialChunk: Chunk
  userId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const text = initialChunk.source_texts.content
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)

  const [hints, setHints] = useState<string[]>(() => sentences.map(() => ''))
  const [step, setStep] = useState<'reading' | 'hinting'>('reading')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previousHints, setPreviousHints] = useState<{ sentence: string; hint: string }[] | null>(null)
  const [showPrevious, setShowPrevious] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadPrev() {
      const { data } = await supabase
        .from('user_hints')
        .select('hints')
        .eq('user_id', userId)
        .eq('text_id', initialChunk.text_id)
        .single()
      if (!cancelled && data?.hints) {
        setPreviousHints(data.hints as { sentence: string; hint: string }[])
      }
    }
    loadPrev()
    return () => { cancelled = true }
  }, [supabase, userId, initialChunk.text_id])

  // Hint-length formula: relative to sentence length, not a static 4-8 range.
  // target = clamp(2, floor(sentence_words / 3), 8); min = max(1, target-1); max = target + 2.
  function hintRangeFor(sentence: string): { min: number; max: number } {
    const words = sentence.trim().split(/\s+/).filter(Boolean).length
    const target = Math.max(2, Math.min(8, Math.floor(words / 3)))
    return { min: Math.max(1, target - 1), max: target + 2 }
  }

  const allHintsFilled = hints.every((h, idx) => {
    const w = h.trim().split(/\s+/).filter(Boolean).length
    return w >= hintRangeFor(sentences[idx]).min
  })

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      const hintsPayload = hints.map((hint, idx) => ({
        sentence_idx: idx,
        sentence: sentences[idx],
        hint: hint.trim()
      }))

      const { error: upsertErr } = await supabase
        .from('user_hints')
        .upsert(
          {
            user_id: userId,
            text_id: initialChunk.text_id,
            hints: hintsPayload,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,text_id' }
        )

      if (upsertErr) throw upsertErr

      // Schedule retrieval phase for tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { error: progressErr } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: userId,
            text_id: initialChunk.text_id,
            mode: 'franklin',
            phase: 'retrieval',
            difficulty: 5.0,
            stability: 0,
            state: 1,
            scheduled_days: 1,
            next_review: tomorrow.toISOString(),
            last_review_date: new Date().toISOString().split('T')[0],
            total_attempts: 0
          },
          { onConflict: 'user_id,text_id' }
        )

      if (progressErr) throw progressErr

      router.push(`/train?exclude=${initialChunk.text_id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save hints')
    } finally {
      setIsSaving(false)
    }
  }

  if (step === 'reading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <NlpPreWarm />
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Phase 1: Lesen + Stilmuster wahrnehmen
          </h1>
          <p className="text-base text-[var(--muted)] mb-4">
            Lies das Original aufmerksam. Achte auf Satzbau, Wortwahl, Rhythmus —
            nicht auf die Handlung. Die Stilmarker unten zeigen objektive Eigenschaften.
          </p>
          <StyleMarkerOverlay text={text} metrics={initialChunk.source_texts.metrics} />
        </div>

        <button
          onClick={() => setStep('hinting')}
          className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-lg font-semibold rounded-lg
                     hover:opacity-90 transition-colors"
        >
          Weiter zur Hint-Phase →
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <NlpPreWarm />
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Phase 2: Hints zu jedem Satz
        </h1>
        <p className="text-base text-[var(--muted)] mb-4">
          Schreib zu jedem Satz <strong className="text-[var(--foreground)]">EINEN kurzen Hinweis</strong>{' '}
          zum <em>Inhalt</em>, nicht zur Form. Hint-Länge passt sich der Satz-Länge an. Diese Hints
          sind morgen deine einzige Vorlage zum Rekonstruieren — der Stil muss aus deinem Gedächtnis kommen.
        </p>

        {previousHints && previousHints.length > 0 && (
          <div className="mb-4 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <button
              onClick={() => setShowPrevious(v => !v)}
              className="text-sm text-[var(--foreground)] underline"
            >
              {showPrevious ? '▼ Alte Hints ausblenden' : '▶ Deine alten Hints zu diesem Chunk anzeigen'}
            </button>
            {showPrevious && (
              <ol className="mt-3 space-y-2 list-decimal list-inside text-sm text-[var(--muted)] font-serif">
                {previousHints.map((h, idx) => (
                  <li key={idx}><span className="text-[var(--foreground)]">{h.hint}</span></li>
                ))}
              </ol>
            )}
          </div>
        )}

        <div className="space-y-4">
          {sentences.map((sentence, idx) => {
            const range = hintRangeFor(sentence)
            return (
              <div key={idx} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                <p className="text-base text-[var(--foreground)] mb-2 font-serif italic">
                  "{sentence}"
                </p>
                <input
                  type="text"
                  value={hints[idx]}
                  onChange={e => {
                    const next = [...hints]
                    next[idx] = e.target.value
                    setHints(next)
                  }}
                  placeholder={`dein Hinweis (${range.min}-${range.max} Worte)`}
                  disabled={isSaving}
                  className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)]
                             text-[var(--foreground)] placeholder-gray-500 rounded
                             focus:border-gray-400 focus:outline-none
                             disabled:opacity-50"
                />
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep('reading')}
          disabled={isSaving}
          className="px-6 py-3 border border-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                     hover:bg-[var(--card-hover)] disabled:opacity-50"
        >
          ← Zurück zum Lesen
        </button>
        <button
          onClick={handleSave}
          disabled={!allHintsFilled || isSaving}
          className="flex-1 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-lg font-semibold rounded-lg
                     hover:opacity-90 disabled:bg-[var(--border)] disabled:text-[var(--muted)]
                     disabled:cursor-not-allowed"
        >
          {isSaving ? 'Speichere...' : 'Hints speichern + Inkubation starten'}
        </button>
      </div>
    </div>
  )
}
