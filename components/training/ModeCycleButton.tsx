'use client'

import { RefreshCw } from 'lucide-react'

export type TrainMode = 'franklin' | 'cloze' | 'free'

const ORDER: TrainMode[] = ['franklin', 'cloze', 'free']

const LABELS: Record<TrainMode, string> = {
  franklin: 'Franklin',
  cloze: 'Cloze',
  free: 'Free',
}

const DESCRIPTIONS: Record<TrainMode, string> = {
  franklin: 'Lesen → Hints → Inkubation → Rekonstruktion',
  cloze: 'Lückentext-Übung, gestuft',
  free: 'Lesen, dann frei imitieren',
}

export function ModeCycleButton({
  current,
  onChange,
}: {
  current: TrainMode
  onChange: (next: TrainMode) => void
}) {
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(next)}
        title={`Nächster Modus: ${LABELS[next]} — ${DESCRIPTIONS[next]}`}
        aria-label={`Modus wechseln zu ${LABELS[next]}`}
        className="inline-flex items-center gap-3 px-5 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors text-[var(--foreground)]"
      >
        <RefreshCw size={18} className="text-[var(--muted)]" />
        <span className="font-medium">Modus: {LABELS[current]}</span>
        <span className="text-xs text-[var(--muted)]">→ {LABELS[next]}</span>
      </button>
      <p className="text-xs text-[var(--muted)] text-center max-w-xs">
        {DESCRIPTIONS[current]}
      </p>
    </div>
  )
}
