import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StyleMarkerOverlay } from '@/components/training/shared/StyleMarkerOverlay'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lesen | The Franklin Method',
  robots: { index: false, follow: false }
}

/**
 * Lesemodus (Phase 6.2)
 *
 * Reines Lesen, kein Schreibzwang. Zeigt alle Chunks eines Buchs nacheinander
 * mit Stilmarker-Overlay. Für User die einen Autor erst kennenlernen wollen,
 * bevor sie ihn imitieren (Franklin-Prinzip "Vorbild zuerst").
 */
export default async function ReadBookPage({
  params,
  searchParams
}: {
  params: Promise<{ bookId: string }>
  searchParams: Promise<{ chunk?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { bookId } = await params
  const { chunk: chunkParam } = await searchParams
  const decodedTitle = decodeURIComponent(bookId)

  const { data: chunks } = await supabase
    .from('source_texts')
    .select('id, title, content, metrics, author:authors(name), cefr_level')
    .or(`title.eq.${decodedTitle},title.like.${decodedTitle} (Teil %)`)
    .order('title')

  if (!chunks || chunks.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center text-[var(--foreground)]">
          <h1 className="text-2xl font-bold mb-3">Buch nicht gefunden</h1>
          <Link href="/dashboard" className="underline">Zurück zum Dashboard</Link>
        </div>
      </div>
    )
  }

  const idx = chunkParam ? Math.max(0, Math.min(chunks.length - 1, parseInt(chunkParam) - 1)) : 0
  const current = chunks[idx]
  const author = Array.isArray(current.author) ? current.author[0]?.name : (current.author as any)?.name

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            ← Dashboard
          </Link>
          <div className="text-sm text-[var(--muted)]">
            {idx + 1} / {chunks.length}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-4">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-1">{current.title}</h1>
          <p className="text-[var(--muted)] mb-6">{author}</p>
          <StyleMarkerOverlay text={current.content} metrics={current.metrics} />
        </div>

        <div className="flex justify-between gap-3">
          {idx > 0 ? (
            <Link
              href={`/read/${encodeURIComponent(decodedTitle)}?chunk=${idx}`}
              className="px-5 py-3 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--card-hover)]"
            >
              ← Vorheriger Abschnitt
            </Link>
          ) : <div />}

          {idx < chunks.length - 1 ? (
            <Link
              href={`/read/${encodeURIComponent(decodedTitle)}?chunk=${idx + 2}`}
              className="px-5 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90"
            >
              Nächster Abschnitt →
            </Link>
          ) : (
            <Link
              href={`/train?book=${encodeURIComponent(decodedTitle)}`}
              className="px-5 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90"
            >
              Mit diesem Buch trainieren →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
