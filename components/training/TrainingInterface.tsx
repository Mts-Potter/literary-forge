'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<TrainMode>(
    initialChunk.mode ?? userDefaultMode
  )

  const phase: Phase =
    initialChunk.phase ?? (mode === 'franklin' ? 'encoding' : 'retrieval')

  function handleModeChange(next: TrainMode) {
    setMode(next)
    startTransition(async () => {
      try {
        await fetch('/api/user/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: next }),
        })
      } catch {
        // best-effort; the new mode is already shown locally
      }
      router.refresh()
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

  return (
    <div className="space-y-8 pb-12">
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
