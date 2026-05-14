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

export function FeedbackView({
  original,
  user,
  feedback,
  onContinue
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
    deterministic
  } = feedback

  // Primärer Score: deterministisch wenn vorhanden, sonst LLM-Fallback
  const primaryScore = style_score ?? overall_accuracy

  return (
    <div className="bg-[var(--background)] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Style Distance</h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                {deterministic
                  ? 'Burrows-Delta z-score against author profile (deterministic)'
                  : 'AI estimate (author profile not available — run reprocessing)'}
              </p>
            </div>
            <div className="px-6 py-3 rounded-lg font-bold text-4xl text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)]">
              {primaryScore.toFixed(0)}%
            </div>
          </div>

          {style_distance != null && (
            <p className="text-sm text-[var(--muted)]">
              raw style_distance = {style_distance.toFixed(2)} (lower = closer to author)
            </p>
          )}

          {/* FSRS Schedule Info */}
          {schedule && (
            <div className="mt-4 flex items-center gap-4 p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg">
              <div className="text-3xl">📅</div>
              <div>
                <p className="font-semibold text-[var(--foreground)] text-base mb-1">{schedule.message}</p>
                <p className="text-base text-[var(--muted)]">
                  Grade: {schedule.grade}/4 • Next:{' '}
                  {new Date(schedule.next_review).toLocaleDateString('en-US')}
                  {schedule.interval_days > 0 &&
                    ` (in ${schedule.interval_days} ${schedule.interval_days === 1 ? 'day' : 'days'})`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* LLM-Sub-Scores (qualitative impression, not the main number) */}
        {scores && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">Qualitative Impression</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              AI-estimated rubrics — secondary to the deterministic style score above.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['structure', 'vocabulary', 'rhythm', 'tone'] as const).map(category => (
                <div
                  key={category}
                  className="text-center p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]"
                >
                  <p className="text-base text-[var(--muted)] capitalize mb-2">{category}</p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">{scores[category]}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LLM Feedback */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Expert Feedback</h2>
          <div className="text-lg text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
            {feedbackText}
          </div>
        </div>

        {/* Text Comparison */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Text Comparison</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--muted)] mb-3">Original</h3>
              <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <p className="text-[var(--foreground)] text-lg leading-relaxed font-serif">{original}</p>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">Your Attempt</h3>
              <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <p className="text-[var(--foreground)] text-lg leading-relaxed font-serif">{user}</p>
              </div>
            </div>
          </div>

          {/* Statistics — FIX: sentence split bug (was using \s+) */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <p className="text-base text-[var(--muted)] mb-1">Original Words</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {original.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <p className="text-base text-[var(--muted)] mb-1">Your Words</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {user.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <p className="text-base text-[var(--muted)] mb-1">Original Sentences</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {original.split(/[.!?]+/).filter(s => s.trim().length > 0).length}
              </p>
            </div>
            <div className="text-center p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <p className="text-base text-[var(--muted)] mb-1">Your Sentences</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {user.split(/[.!?]+/).filter(s => s.trim().length > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-lg font-semibold rounded-lg
                       hover:opacity-90 transition-colors"
          >
            Continue to Next Review →
          </button>
        </div>
      </div>
    </div>
  )
}
