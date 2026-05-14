'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/client'
import { ZenEditor } from '../ZenEditor'
import { FeedbackView } from '../FeedbackView'
import { StyleMarkerOverlay } from '../shared/StyleMarkerOverlay'

/**
 * Free-Writing Mode
 *
 * Refactored aus dem bisherigen TrainingInterface. Wesentliche Änderung:
 * Lese-Phase wird VOR dem Schreiben gezeigt (Plan-Punkt 5.1: Original-zuerst).
 * Plot-Beschreibung bleibt als orientierender Anker, ist aber sekundär.
 */

type Phase = 'reading' | 'writing' | 'feedback'

interface Chunk {
  text_id: string
  source_texts: {
    id: string
    title: string
    content: string
    metrics: any
    author?: { name: string } | { name: string }[]
    cefr_level?: string | null
  }
}

export function FreeWriting({
  initialChunk,
  userId
}: {
  initialChunk: Chunk
  userId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [phase, setPhase] = useState<Phase>('reading')
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [history, setHistory] = useState<{ created_at: string; accuracy_score: number }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Pre-warm NLP service so it's hot when user submits
    fetch('/api/nlp/warm').catch(() => {})
    localStorage.removeItem('zen-editor-draft')
    return () => abortRef.current?.abort()
  }, [])

  async function handleSubmit(text: string) {
    setIsSubmitting(true)
    setError(null)
    setUserText(text)
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
          text_id: initialChunk.source_texts.id,
          user_text: text,
          idempotency_token: token
        }),
        signal: abortRef.current.signal
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Submission failed (${res.status})`)
      }
      const result = await res.json()
      const { data: histRows } = await supabase
        .from('review_history')
        .select('created_at, accuracy_score')
        .eq('user_id', userId)
        .eq('text_id', initialChunk.source_texts.id)
        .order('created_at', { ascending: true })
        .limit(5)
      setHistory((histRows ?? []) as { created_at: string; accuracy_score: number }[])
      setFeedback(result)
      setPhase('feedback')
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Submission failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleContinue() {
    localStorage.removeItem('zen-editor-draft')
    router.push(`/train?exclude=${initialChunk.source_texts.id}`)
    router.refresh()
  }

  const authorName = Array.isArray(initialChunk.source_texts.author)
    ? initialChunk.source_texts.author[0]?.name
    : initialChunk.source_texts.author?.name

  if (phase === 'reading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
            Lese-Phase
          </h1>
          <p className="text-base text-[var(--muted)] mb-4">
            "{initialChunk.source_texts.title}" — {authorName || 'Unbekannt'}.
            Lies aufmerksam, dann schreibe deine Stil-Imitation.
          </p>
          <StyleMarkerOverlay
            text={initialChunk.source_texts.content}
            metrics={initialChunk.source_texts.metrics}
          />
        </div>
        <button
          onClick={() => setPhase('writing')}
          className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-lg font-semibold rounded-lg
                     hover:opacity-90"
        >
          Weiter zur Schreib-Phase →
        </button>
      </div>
    )
  }

  if (phase === 'writing') {
    const prompt = `Imitiere den Stil von "${initialChunk.source_texts.title}" (${authorName || 'der Autor'}) in einem eigenen kurzen Text. Achte auf Satzbau, Rhythmus, Wortwahl, Ton.`
    const scene = initialChunk.source_texts.content.substring(0, 200) + '...'
    return (
      <>
        <ZenEditor
          prompt={prompt}
          sceneDescription={scene}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
        {error && (
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <FeedbackView
      original={initialChunk.source_texts.content}
      user={userText}
      feedback={feedback}
      history={history}
      onContinue={handleContinue}
    />
  )
}
