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
      <div className="bg-[#171717] border border-[#262626] rounded-lg p-6 mb-4">
        <h1 className="text-2xl font-bold text-white mb-2">
          Cloze-Modus (in Arbeit)
        </h1>
        <p className="text-gray-400 mb-4">
          Dieser Modus wird im nächsten Sub-Sprint implementiert. Stufe 1
          (Funktionswörter verdeckt) wird der MVP-Stand sein. Im Moment
          wechselst du am besten zurück zum Franklin- oder Free-Writing-Modus.
        </p>
        <div className="p-4 bg-[#0a0a0a] border border-[#262626] rounded-lg mb-4">
          <p className="text-sm text-gray-400 mb-2">Aktuelle Karte:</p>
          <p className="text-lg text-white font-serif">{initialChunk.source_texts.title}</p>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200"
        >
          Modus in Settings ändern
        </button>
      </div>
    </div>
  )
}
