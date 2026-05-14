'use client'

interface FeedbackPayload {
  feedback: string
  scores: {
    structure: number
    vocabulary: number
    rhythm: number
    tone: number
  }
  overall_accuracy: number
  style_score?: number | null
  style_distance?: number | null
  deterministic?: boolean
  schedule?: {
    grade: number
    next_review: string
    interval_days: number
    message: string
  }
}

const RUBRIC_LABEL_DE: Record<keyof FeedbackPayload['scores'], string> = {
  structure: 'Struktur',
  vocabulary: 'Wortwahl',
  rhythm: 'Rhythmus',
  tone: 'Ton',
}

function scoreBand(score: number): { label: string; tone: string } {
  if (score >= 85) return { label: 'Sehr nah am Original', tone: 'text-green-400' }
  if (score >= 70) return { label: 'Nah am Original', tone: 'text-green-300' }
  if (score >= 50) return { label: 'Erkennbare Anlehnung', tone: 'text-yellow-300' }
  if (score >= 30) return { label: 'Andere stilistische Richtung', tone: 'text-orange-300' }
  return { label: 'Weit vom Original', tone: 'text-red-300' }
}

export function FeedbackView({
  original,
  user,
  feedback,
  onContinue,
}: {
  original: string
  user: string
  feedback: FeedbackPayload
  onContinue: () => void
}) {
  const {
    scores,
    overall_accuracy,
    feedback: feedbackText,
    schedule,
    style_score,
    style_distance,
    deterministic,
  } = feedback

  const primaryScore = style_score ?? overall_accuracy
  const band = scoreBand(primaryScore)

  return (
    <div className="bg-[var(--background)] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Stilabstand</h1>
              <p className={`text-base font-medium mt-1 ${band.tone}`}>{band.label}</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                {deterministic
                  ? 'Burrows-Δ-Variante: z-Score deines Versuchs gegen das Autorenprofil (deterministisch)'
                  : 'KI-Schätzung (Autorenprofil aktuell nicht verfügbar)'}
              </p>
            </div>
            <div className="px-6 py-3 rounded-lg font-bold text-4xl text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)]">
              {Math.round(primaryScore)}/100
            </div>
          </div>

          {style_distance != null && (
            <p className="text-sm text-[var(--muted)]">
              Roher Stilabstand = {style_distance.toFixed(2)} (kleiner = näher am Autor; Skala 0-5)
            </p>
          )}

          {/* FSRS Schedule */}
          {schedule && (
            <div className="mt-4 flex items-center gap-4 p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg">
              <div className="text-3xl">📅</div>
              <div>
                <p className="font-semibold text-[var(--foreground)] text-base mb-1">{schedule.message}</p>
                <p className="text-base text-[var(--muted)]">
                  Note: {schedule.grade}/4 · Nächste Wiederholung:{' '}
                  {new Date(schedule.next_review).toLocaleDateString('de-DE')}
                  {schedule.interval_days > 0 &&
                    ` (in ${schedule.interval_days} ${schedule.interval_days === 1 ? 'Tag' : 'Tagen'})`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* LLM Sub-Scores */}
        {scores && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">Qualitative Einschätzung</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              KI-Schätzung pro Kategorie — sekundär zum deterministischen Stilabstand oben.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['structure', 'vocabulary', 'rhythm', 'tone'] as const).map((category) => (
                <div
                  key={category}
                  className="text-center p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]"
                >
                  <p className="text-base text-[var(--muted)] mb-2">{RUBRIC_LABEL_DE[category]}</p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">{scores[category]}/100</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LLM Feedback */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Lektorat</h2>
          <div className="text-lg text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
            {feedbackText}
          </div>
        </div>

        {/* Text Comparison */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Text-Vergleich</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--muted)] mb-3">Original</h3>
              <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <p className="text-[var(--foreground)] text-lg leading-relaxed font-serif">{original}</p>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">Dein Versuch</h3>
              <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <p className="text-[var(--foreground)] text-lg leading-relaxed font-serif">{user}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <p className="text-base text-[var(--muted)] mb-1">Original Wörter</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {original.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <p className="text-base text-[var(--muted)] mb-1">Deine Wörter</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {user.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <p className="text-base text-[var(--muted)] mb-1">Original Sätze</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {original.split(/[.!?]+/).filter((s) => s.trim().length > 0).length}
              </p>
            </div>
            <div className="text-center p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <p className="text-base text-[var(--muted)] mb-1">Deine Sätze</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {user.split(/[.!?]+/).filter((s) => s.trim().length > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-lg font-semibold rounded-lg hover:opacity-90 transition-colors"
          >
            Weiter zum nächsten Chunk →
          </button>
        </div>
      </div>
    </div>
  )
}
