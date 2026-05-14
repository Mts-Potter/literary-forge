'use client'

/**
 * Cloze-Deletion Mode (Skeleton, Phase 4-Stub)
 *
 * MVP-Platzhalter. Vollständige Implementierung in einem späteren Sub-Sprint:
 * - 4 Stufen (Funktionswörter → Verben → Adjektive → nur Gerüst)
 * - Automatischer Upgrade nach FSRS-Performance
 * - Bewertung: exakter Wort-Match pro Lücke
 */

import { useRouter } from 'next/navigation'

interface Chunk {
  text_id: string
  source_texts: { title: string; content: string }
  cloze_level?: number
}

export function ClozeDeletion({
  initialChunk
}: {
  initialChunk: Chunk
  userId: string
}) {
  const router = useRouter()
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Cloze-Modus (in Arbeit)
        </h1>
        <p className="text-[var(--muted)] mb-4">
          Dieser Modus wird im nächsten Sub-Sprint implementiert. Stufe 1
          (Funktionswörter verdeckt) wird der MVP-Stand sein. Im Moment
          wechselst du am besten zurück zum Franklin- oder Free-Writing-Modus.
        </p>
        <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg mb-4">
          <p className="text-sm text-[var(--muted)] mb-2">Aktuelle Karte:</p>
          <p className="text-lg text-[var(--foreground)] font-serif">{initialChunk.source_texts.title}</p>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90"
        >
          Modus in Settings ändern
        </button>
      </div>
    </div>
  )
}
