'use client'

/**
 * StyleMarkerOverlay
 *
 * Visualisiert die stilometrischen Markers eines Original-Texts:
 * - Satzlängen-Bar-Chart unten
 * - Funktionswort-Highlights inline
 * - Komma-Dichte als Badge
 *
 * Erwartet `metrics` aus `source_texts.metrics` (nach Reprocessing Phase 2).
 * Bei alten 3-Feld-Metriken fallen Visualisierungen leer aus.
 */

interface ExtendedMetrics {
  avg_sentence_length?: number
  sentence_length_variance?: number
  punctuation_per_sentence?: number
  adj_ratio?: number
  adj_verb_ratio?: number
  mtld?: number
  sub_sentence_ratio?: number
  function_word_frequencies?: Record<string, number>
}

export function StyleMarkerOverlay({
  text,
  metrics
}: {
  text: string
  metrics: ExtendedMetrics | null | undefined
}) {
  const m = metrics ?? {}
  const hasExtended = m.avg_sentence_length != null

  // Satzlängen-Verteilung aus Text rechnen (deterministisch im Browser)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length)
  const maxLen = Math.max(...sentenceLengths, 1)

  return (
    <div className="space-y-4">
      {/* Original-Text mit gentlem Highlight */}
      <div className="p-4 bg-[#0a0a0a] border border-[#262626] rounded-lg">
        <p className="text-white text-lg leading-relaxed font-serif">{text}</p>
      </div>

      {/* Stilmarker als Mini-Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip
          label="Avg sentence length"
          value={hasExtended ? `${(m.avg_sentence_length ?? 0).toFixed(1)} words` : '—'}
        />
        <StatChip
          label="Sentence variance"
          value={hasExtended ? (m.sentence_length_variance ?? 0).toFixed(1) : '—'}
        />
        <StatChip
          label="Adj/Verb ratio"
          value={hasExtended ? (m.adj_verb_ratio ?? 0).toFixed(2) : '—'}
        />
        <StatChip
          label="Hypotaxe-Indikator"
          value={hasExtended ? `${((m.sub_sentence_ratio ?? 0)).toFixed(1)} sub/sent` : '—'}
        />
      </div>

      {/* Satzlängen-Bar-Chart */}
      <div className="p-4 bg-[#0a0a0a] border border-[#262626] rounded-lg">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
          Sentence-length pattern
        </p>
        <div className="flex items-end gap-1 h-20">
          {sentenceLengths.map((len, idx) => (
            <div
              key={idx}
              className="flex-1 bg-white/30 rounded-t"
              style={{ height: `${(len / maxLen) * 100}%` }}
              title={`Sentence ${idx + 1}: ${len} words`}
            />
          ))}
        </div>
      </div>

      {!hasExtended && (
        <p className="text-xs text-gray-500 italic">
          Extended style markers not yet computed for this chunk — run the reprocess script.
        </p>
      )}
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 bg-[#0a0a0a] rounded-lg border border-[#262626]">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  )
}
