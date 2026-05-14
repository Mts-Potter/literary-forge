'use client'

import { useState, useTransition } from 'react'
import { FranklinEncodingPhase } from './modes/FranklinEncodingPhase'
import { FranklinRetrievalPhase } from './modes/FranklinRetrievalPhase'
import { ClozeDeletion } from './modes/ClozeDeletion'
import { FreeWriting } from './modes/FreeWriting'
import { ModeCycleButton, type TrainMode } from './ModeCycleButton'

type Phase = 'encoding' | 'retrieval' | 'mastered'

interface DispatchableChunk {
  text_id: string
  source_texts: any
  mode?: TrainMode | null
  phase?: Phase | null
  cloze_level?: number | null
}

export function TrainingInterface({
  initialChunk,
  userId,
  userDefaultMode = 'franklin',
}: {
  initialChunk: DispatchableChunk
  userId: string
  userDefaultMode?: TrainMode
}) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<TrainMode>(
    initialChunk.mode ?? userDefaultMode
  )

  const phase: Phase =
    initialChunk.phase ?? (mode === 'franklin' ? 'encoding' : 'retrieval')

  function handleModeChange(next: TrainMode) {
    // Lokaler State sofort, Persist asynchron. KEIN router.refresh() — der
    // würde einen neuen Chunk aus der SRS-Queue ziehen und die aktuelle
    // Karte verschieben. Default-Mode landet beim nächsten /train-Open.
    setMode(next)
    startTransition(async () => {
      try {
        await fetch('/api/user/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: next }),
        })
      } catch {
        // best-effort
      }
    })
  }

  function renderMode() {
    if (mode === 'franklin') {
      if (phase === 'encoding') {
        return (
          <FranklinEncodingPhase
            initialChunk={initialChunk as any}
            userId={userId}
          />
        )
      }
      return (
        <FranklinRetrievalPhase
          initialChunk={initialChunk as any}
          userId={userId}
        />
      )
    }
    if (mode === 'cloze') {
      return <ClozeDeletion initialChunk={initialChunk as any} userId={userId} />
    }
    return <FreeWriting initialChunk={initialChunk as any} userId={userId} />
  }

  const st = initialChunk.source_texts as {
    title?: string
    author?: { name: string } | { name: string }[]
    metrics?: { avg_sentence_length?: number }
  }
  const authorName = Array.isArray(st?.author) ? st.author[0]?.name : st?.author?.name
  const avgLen = st?.metrics?.avg_sentence_length

  return (
    <div className="space-y-8 pb-12">
      {(authorName || avgLen != null || st?.title) && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="bg-[var(--card)]/50 border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--muted)]">
            {authorName && (
              <span className="text-[var(--foreground)] font-semibold">{authorName}</span>
            )}
            {st?.title && (
              <> {authorName ? '·' : ''} <span className="italic">{st.title}</span></>
            )}
            {avgLen != null && (
              <> · ⌀ Satzlänge im Korpus: <span className="text-[var(--foreground)]">{avgLen.toFixed(1)} Wörter</span></>
            )}
          </div>
        </div>
      )}
      {renderMode()}
      <div className="flex justify-center pt-4 border-t border-[var(--border)]">
        <ModeCycleButton current={mode} onChange={handleModeChange} />
      </div>
      {isPending && (
        <p className="text-center text-xs text-[var(--muted)]">Wechsle Modus…</p>
      )}
    </div>
  )
}
