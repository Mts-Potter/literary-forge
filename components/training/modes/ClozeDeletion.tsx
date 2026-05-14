'use client'

/**
 * Cloze-Deletion Mode (Skeleton, Phase 4-Stub)
 *
 * MVP-Platzhalter. Vollständige Implementierung in einem späteren Sub-Sprint:
 * - 4 Stufen (Funktionswörter → Verben → Adjektive → nur Gerüst)
 * - Automatischer Upgrade nach FSRS-Performance
 * - Bewertung: exakter Wort-Match pro Lücke
 */

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
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-500/20 text-yellow-300 rounded">
            IN ARBEIT
          </span>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Cloze-Modus (Vorschau)
          </h1>
        </div>
        <p className="text-[var(--foreground)] mb-4">
          Der Cloze-Modus (Lückentext, gestuft) ist noch nicht fertig implementiert. Aktuell siehst du nur die Karten-Info ohne Übungs-Interaktion. Wechsle mit dem Modus-Button unten zurück zu Franklin oder Free, um zu trainieren.
        </p>
        <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg mb-4">
          <p className="text-sm text-[var(--muted)] mb-1">Aktuelle Karte:</p>
          <p className="text-lg text-[var(--foreground)] font-serif">{initialChunk.source_texts.title}</p>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Tipp: Mit dem Modus-Button unten wechselst du nahtlos — die Karte bleibt erhalten.
        </p>
      </div>
    </div>
  )
}
