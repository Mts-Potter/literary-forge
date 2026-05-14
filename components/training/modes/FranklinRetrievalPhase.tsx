'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/client'
import { DiffView } from '../shared/DiffView'

/**
 * Franklin Retrieval Phase (Tag +1 bis +30)
 *
 * Schritt 2 des Franklin-Loops: User hat nur seine eigenen Hints aus der
 * Encoding-Phase. Er schreibt den Text aus dem Gedächtnis nach. Submit
 * → /api/train/submit liefert Score + Feedback. Diff-View vergleicht
 * Versuch mit Original.
 */

interface Chunk {
  text_id: string
  source_texts: {
    id: string
    title: string
    content: string
    author?: { name: string } | { name: string }[]
  }
}

interface HintRecord {
  sentence_idx: number
  sentence: string
  hint: string
}

export function FranklinRetrievalPhase({
  initialChunk,
  userId
}: {
  initialChunk: Chunk
  userId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [hints, setHints] = useState<HintRecord[] | null>(null)
  const [userText, setUserText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Hints laden + NLP-Service vor-wärmen
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('user_hints')
        .select('hints')
        .eq('user_id', userId)
        .eq('text_id', initialChunk.text_id)
        .single()

      if (cancelled) return
      if (error || !data) {
        setError('Keine Hints gefunden. Erst Encoding-Phase abschließen.')
        return
      }
      setHints(data.hints as HintRecord[])
    }
    load()
    // Pre-warm NLP service
    fetch('/api/nlp/warm').catch(() => {})
    return () => {
      cancelled = true
    }
  }, [supabase, userId, initialChunk.text_id])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  async function handleSubmit() {
    if (!userText.trim()) return
    setIsSubmitting(true)
    setError(null)
    const token = uuidv4()
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/train/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': token
        },
        body: JSON.stringify({
          text_id: initialChunk.text_id,
          user_text: userText,
          idempotency_token: token
        }),
        signal: abortRef.current.signal
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Submission failed (${res.status})`)
      }
      const result = await res.json()
      setFeedback(result)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Submission failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleContinue() {
    router.push(`/train?exclude=${initialChunk.text_id}`)
    router.refresh()
  }

  // Feedback-View (nach Submit)
  if (feedback) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Style Distance</h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                {feedback.deterministic
                  ? 'Burrows-Delta z-score (deterministic)'
                  : 'AI estimate (no author profile yet)'}
              </p>
            </div>
            <div className="text-4xl font-bold text-[var(--foreground)]">
              {(feedback.style_score ?? feedback.overall_accuracy).toFixed(0)}%
            </div>
          </div>
          {feedback.schedule && (
            <p className="text-sm text-[var(--muted)] mt-3">
              📅 {feedback.schedule.message}
            </p>
          )}
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">Word-Level Diff</h2>
          <DiffView original={initialChunk.source_texts.content} attempt={userText} />
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">Feedback</h2>
          <p className="text-[var(--foreground)] whitespace-pre-wrap">{feedback.feedback}</p>
        </div>

        <button
          onClick={handleContinue}
          className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-lg font-semibold rounded-lg
                     hover:opacity-90"
        >
          Weiter zur nächsten Karte →
        </button>
      </div>
    )
  }

  // Writing view (vor Submit)
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Phase 3: Rekonstruktion aus deinen Hints
        </h1>
        <p className="text-base text-[var(--muted)]">
          Nur deine Hints von neulich sind sichtbar. Schreib den Text neu,
          versuche Stil und Rhythmus aus dem Gedächtnis zu treffen.
        </p>
      </div>

      {hints && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wide">
            Deine Hints
          </h2>
          <ol className="space-y-2 list-decimal list-inside text-[var(--foreground)]">
            {hints.map((h, idx) => (
              <li key={idx} className="font-serif text-lg">{h.hint}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
        <textarea
          value={userText}
          onChange={e => setUserText(e.target.value)}
          disabled={isSubmitting}
          placeholder="Schreib den Text aus dem Gedächtnis..."
          rows={14}
          spellCheck={false}
          autoFocus
          className="w-full p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg
                     text-[var(--foreground)] text-lg leading-relaxed font-serif
                     focus:border-gray-400 focus:outline-none
                     disabled:opacity-50"
        />
        <div className="mt-3 flex justify-between items-center text-sm text-[var(--muted)]">
          <span>
            {userText.split(/\s+/).filter(Boolean).length} Wörter ·{' '}
            {userText.length} Zeichen
          </span>
          <span>⌘+Enter zum Absenden</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !userText.trim() || !hints}
        className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-lg font-semibold rounded-lg
                   hover:opacity-90 disabled:bg-[var(--border)] disabled:text-[var(--muted)]
                   disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Analysiere...' : 'Absenden + Vergleichen'}
      </button>
    </div>
  )
}
