'use client'

/**
 * Word-Level Diff zwischen Original und User-Versuch.
 *
 * Einfache LCS-basierte Implementierung — keine externe Library nötig.
 * Performant für ~300 Wörter (typische Chunk-Größe). Bei längeren Texten
 * O(n*m) Memory; für Stilmetrik-Imitation ausreichend.
 */

type DiffOp = { type: 'match' | 'missing' | 'added'; text: string }

function tokenize(s: string): string[] {
  return s.split(/(\s+)/).filter(t => t.length > 0)
}

function diffWords(a: string[], b: string[]): DiffOp[] {
  // LCS-Matrix
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  // Backtrace
  const ops: DiffOp[] = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
      ops.push({ type: 'match', text: a[i - 1] })
      i--; j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ type: 'missing', text: a[i - 1] })
      i--
    } else {
      ops.push({ type: 'added', text: b[j - 1] })
      j--
    }
  }
  while (i > 0) { ops.push({ type: 'missing', text: a[--i + 1] ?? a[0] }); }
  while (j > 0) { ops.push({ type: 'added', text: b[--j + 1] ?? b[0] }); }
  return ops.reverse()
}

export function DiffView({ original, attempt }: { original: string; attempt: string }) {
  const ops = diffWords(tokenize(original), tokenize(attempt))

  return (
    <div className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
      {ops.map((op, idx) => {
        if (op.type === 'match') {
          return <span key={idx} className="text-[var(--foreground)]">{op.text}</span>
        }
        if (op.type === 'missing') {
          return (
            <span
              key={idx}
              className="bg-red-900/30 text-red-300 line-through"
              title="In Original, missing in your attempt"
            >
              {op.text}
            </span>
          )
        }
        return (
          <span
            key={idx}
            className="bg-green-900/30 text-green-300"
            title="In your attempt, not in original"
          >
            {op.text}
          </span>
        )
      })}
    </div>
  )
}
