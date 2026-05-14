'use client'

import { FranklinEncodingPhase } from './modes/FranklinEncodingPhase'
import { FranklinRetrievalPhase } from './modes/FranklinRetrievalPhase'
import { ClozeDeletion } from './modes/ClozeDeletion'
import { FreeWriting } from './modes/FreeWriting'

/**
 * Mode Dispatcher (Phase 4)
 *
 * Liest mode + phase aus dem user_progress-Eintrag (oder Default für neue Karten)
 * und rendert die passende Komponente.
 */

type Mode = 'franklin' | 'cloze' | 'free'
type Phase = 'encoding' | 'retrieval' | 'mastered'

interface DispatchableChunk {
  text_id: string
  source_texts: any
  mode?: Mode | null
  phase?: Phase | null
  cloze_level?: number | null
}

export function TrainingInterface({
  initialChunk,
  userId,
  userDefaultMode = 'franklin'
}: {
  initialChunk: DispatchableChunk
  userId: string
  userDefaultMode?: Mode
}) {
  const mode: Mode = initialChunk.mode ?? userDefaultMode
  const phase: Phase = initialChunk.phase ?? (mode === 'franklin' ? 'encoding' : 'retrieval')

  if (mode === 'franklin') {
    if (phase === 'encoding') {
      return <FranklinEncodingPhase initialChunk={initialChunk as any} userId={userId} />
    }
    return <FranklinRetrievalPhase initialChunk={initialChunk as any} userId={userId} />
  }

  if (mode === 'cloze') {
    return <ClozeDeletion initialChunk={initialChunk as any} userId={userId} />
  }

  return <FreeWriting initialChunk={initialChunk as any} userId={userId} />
}
