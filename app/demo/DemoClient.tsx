'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Chunk {
  text_id: string
  author: string
  work: string
  language: 'de' | 'en'
  content: string
  scene_description: string
}

export function DemoClient({ chunk }: { chunk: Chunk }) {
  const [step, setStep] = useState<'read' | 'write' | 'feedback'>('read')
  const [userText, setUserText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<null | {
    style_score: number
    style_distance: number | null
    deterministic: boolean
    llm_feedback: string
  }>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!userText.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/demo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunk_id: chunk.text_id,
          original_text: chunk.content,
          user_text: userText,
          language: chunk.language,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'request failed' }))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setFeedback(data)
      setStep('feedback')
    } catch (e: any) {
      setError(e.message || 'Etwas ist schiefgelaufen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'read') {
    return (
      <div className="space-y-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <p className="text-sm text-[var(--muted)] mb-2">{chunk.author} — <em>{chunk.work}</em></p>
          <p className="text-[var(--foreground)] text-lg leading-relaxed font-serif">{chunk.content}</p>
        </div>
        <button
          onClick={() => setStep('write')}
          className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Verstanden — jetzt schreiben →
        </button>
      </div>
    )
  }

  if (step === 'write') {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wide mb-2">Worum es geht (KI-Zusammenfassung)</p>
          <p className="text-sm text-[var(--foreground)]">{chunk.scene_description}</p>
        </div>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder="Schreib hier deinen Versuch im Stil des Originals…"
          rows={10}
          disabled={isSubmitting}
          className="w-full p-4 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg
                     focus:border-[var(--foreground)] focus:outline-none
                     text-[var(--foreground)] placeholder:text-[var(--muted)]
                     font-serif text-lg leading-relaxed resize-y disabled:opacity-50"
        />
        {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || userText.trim().length < 30}
          className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg
                     hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? 'Wird analysiert…' : 'Absenden → Vergleich'}
        </button>
        <p className="text-xs text-[var(--muted)] text-center">Mindestens 30 Zeichen. Wird nicht gespeichert.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
        <p className="text-sm text-[var(--muted)] uppercase tracking-wide">Dein Stilabstand</p>
        <p className="text-5xl font-bold text-[var(--foreground)] mt-2">{feedback?.style_score ?? '—'}/100</p>
        <p className="text-xs text-[var(--muted)] mt-2">
          {feedback?.deterministic
            ? `Burrows-Δ-Variante. Style-Distance: ${feedback?.style_distance?.toFixed(2)}`
            : 'NLP-Service nicht verfügbar — LLM-Fallback aktiv'}
        </p>
      </div>
      {feedback?.llm_feedback && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <p className="text-sm text-[var(--muted)] uppercase tracking-wide mb-2">Lektorat</p>
          <p className="text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{feedback.llm_feedback}</p>
        </div>
      )}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
        <p className="text-sm text-[var(--muted)] uppercase tracking-wide mb-2">Weiter?</p>
        <p className="text-[var(--foreground)] mb-4">
          Mit eigener Bibliothek + gespeichertem Fortschritt — kostenlos, kein Spam.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded hover:opacity-90"
        >
          Konto anlegen →
        </Link>
      </div>
    </div>
  )
}
