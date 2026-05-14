import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { groupBooksByTitle, type GroupedBook } from '@/lib/utils/books'
import { fetchLast7Days } from '@/lib/dashboard/streak-calendar'
import { NlpPreWarm } from '@/components/training/NlpPreWarm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Dashboard | The Franklin Method",
  description: "Dein Trainings-Dashboard. Fortschritt, fällige Reviews und Streak im Blick.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Alle DB-Calls parallel (Phase qol-F: ~5x sequenziell → 1x parallel)
  const [
    progressDataResult,
    streakResult,
    userSettingsResult,
    last7,
    progressByChunkResult,
    groupedBooksResult,
  ] = await Promise.all([
    supabase.from('user_progress').select('text_id, next_review, reps, difficulty').eq('user_id', user.id),
    supabase.rpc('calculate_user_streaks', { p_user_id: user.id }),
    supabase.from('user_settings').select('default_mode').eq('user_id', user.id).single(),
    fetchLast7Days(supabase, user.id),
    supabase.from('user_progress').select('text_id, source_texts!inner(title)').eq('user_id', user.id),
    supabase.rpc('get_grouped_books'),
  ])

  const progressData = progressDataResult.data
  const streakData = streakResult.data as { current_streak?: number; longest_streak?: number } | null
  const userSettings = userSettingsResult.data
  const progressByChunk = progressByChunkResult.data

  // Stats
  const totalStudied = progressData?.length || 0
  const dueToday = progressData?.filter(p =>
    new Date(p.next_review) <= new Date()
  ).length || 0
  const avgReps = progressData?.length
    ? Math.round(progressData.reduce((sum, p) => sum + p.reps, 0) / progressData.length)
    : 0

  const currentStreak = streakData?.current_streak || 0
  const longestStreak = streakData?.longest_streak || 0

  const userDefaultMode = ((userSettings?.default_mode ?? 'franklin') as 'franklin' | 'cloze' | 'free')
  const modeLabel = userDefaultMode === 'franklin' ? 'Franklin' : userDefaultMode === 'cloze' ? 'Cloze' : 'Free'

  const last7Max = Math.max(...last7.map(d => d.reviews), 1)

  // Trainierte Chunks pro Buch (Base-Title-Aggregation)
  const trainedByTitle = new Map<string, number>()
  for (const row of progressByChunk ?? []) {
    const title = (row as { source_texts?: { title?: string } | { title?: string }[] }).source_texts
    const t = Array.isArray(title) ? title[0]?.title : title?.title
    if (!t) continue
    const baseTitle = t.includes(' (Teil ') ? t.split(' (Teil ')[0] : t
    trainedByTitle.set(baseTitle, (trainedByTitle.get(baseTitle) ?? 0) + 1)
  }

  // Bücher: bevorzugt RPC-Ergebnis, sonst client-side Fallback
  let books: GroupedBook[] = []
  if (!groupedBooksResult.error && groupedBooksResult.data) {
    books = (groupedBooksResult.data as Array<{
      title: string; author: string; cefr_level: string | null;
      tags: string[] | null; language: string; chunk_count: number
    }>).map((book): GroupedBook => ({
      title: book.title,
      author: book.author,
      cefr_level: book.cefr_level,
      tags: book.tags || [],
      language: book.language,
      chunkCount: Number(book.chunk_count)
    }))
  } else {
    console.log('RPC not available — fallback to client-side grouping')
    const allChunks: Array<{ id: string; title: string; author: { name: string }[]; cefr_level: string | null; tags: string[] | null; language: string }> = []
    const batchSize = 1000
    let offset = 0
    let hasMore = true
    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('source_texts')
        .select('id, title, author:authors(name), cefr_level, tags, language')
        .order('title')
        .range(offset, offset + batchSize - 1)
      if (batchError) {
        console.error('Failed to fetch books batch:', batchError)
        break
      }
      if (batch && batch.length > 0) {
        allChunks.push(...(batch as typeof allChunks))
        offset += batchSize
        hasMore = batch.length === batchSize
      } else {
        hasMore = false
      }
    }
    books = groupBooksByTitle(allChunks)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4">
      <NlpPreWarm />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-1">Dashboard</h1>
          <p className="text-[var(--muted)] text-sm">
            Willkommen zurück. Dein aktueller Lernstand auf einen Blick.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Studied */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)] mb-1">Trainierte Chunks</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">{totalStudied}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          {/* Due Today */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)] mb-1">Heute fällig</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">{dueToday}</p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>

          {/* Average Reps */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)] mb-1">⌀ Wiederholungen</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">{avgReps}</p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)] mb-1">Aktuelle Serie</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {currentStreak}
                  <span className="text-lg text-[var(--muted)] ml-1">
                    {currentStreak === 1 ? 'Tag' : 'Tage'}
                  </span>
                </p>
                {longestStreak > currentStreak && (
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Bestwert: {longestStreak} {longestStreak === 1 ? 'Tag' : 'Tage'}
                  </p>
                )}
              </div>
              <div className="text-4xl">
                {currentStreak === 0 ? '😴' : currentStreak >= 7 ? '🔥' : '⚡'}
              </div>
            </div>
          </div>
        </div>

        {/* 7-Tage-Streak-Strip */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-8">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">Letzte 7 Tage</h2>
          <div className="flex items-end gap-2 h-16">
            {last7.map(d => {
              const h = (d.reviews / last7Max) * 100
              const dateObj = new Date(d.date)
              const labelDay = dateObj.toLocaleDateString('de-DE', { weekday: 'short' })
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${labelDay} ${d.date}: ${d.reviews} Reviews`}
                >
                  <div
                    className={`w-full rounded-t ${d.reviews > 0 ? 'bg-[var(--foreground)]' : 'bg-[var(--border)]'}`}
                    style={{ height: `${Math.max(h, 6)}%` }}
                  />
                  <span className="text-xs text-[var(--muted)]">{labelDay[0]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions — 3-Mode Direct-Start */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">Schnellstart</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Direkt in einen Modus starten — dein Standard ist <strong className="text-[var(--foreground)]">{modeLabel}</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {(['franklin', 'cloze', 'free'] as const).map(m => {
              const active = m === userDefaultMode
              const label = m === 'franklin' ? 'Franklin' : m === 'cloze' ? 'Cloze' : 'Free'
              return (
                <Link
                  key={m}
                  href={`/train?mode=${m}`}
                  className={`px-4 py-3 rounded-lg font-semibold text-center transition-colors
                    ${active
                      ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
                      : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)]'}`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">
              {dueToday > 0 ? `${dueToday} Wiederholung${dueToday === 1 ? '' : 'en'} heute fällig` : 'Keine Wiederholungen fällig'}
            </span>
            <Link
              href="/admin/ingest"
              className="text-[var(--muted)] hover:text-[var(--foreground)] underline"
            >
              📚 Bücher importieren
            </Link>
          </div>
        </div>

        {/* Available Books */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Verfügbare Bücher</h2>

          {books.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)]">
              <p className="mb-4">Noch keine Bücher importiert.</p>
              <Link
                href="/admin/ingest"
                className="inline-block px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-lg font-semibold
                           hover:opacity-90 transition-colors"
              >
                Erstes Buch importieren
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book, idx) => (
                <div
                  key={idx}
                  className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 hover:border-[var(--muted)] transition-colors"
                >
                  {/* Book Title */}
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 line-clamp-2">
                    {book.title}
                  </h3>

                  {/* Author */}
                  <p className="text-[var(--muted)] mb-4">{book.author}</p>

                  {/* Metadata */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted)]">Sprache:</span>
                      <span className="text-[var(--foreground)]">
                        {book.language === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 Englisch'}
                      </span>
                    </div>

                    {book.cefr_level && (
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--muted)]">CEFR:</span>
                        <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs font-semibold">
                          {book.cefr_level}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted)]">Chunks:</span>
                      <span className="text-[var(--foreground)]">{book.chunkCount}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {book.tags && book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {book.tags.slice(0, 3).map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-[var(--border)] text-[var(--foreground)] rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {book.tags.length > 3 && (
                        <span className="px-2 py-1 text-[var(--muted)] text-xs">
                          +{book.tags.length - 3} weitere
                        </span>
                      )}
                    </div>
                  )}

                  {/* Fortschrittsbalken */}
                  {(() => {
                    const trained = trainedByTitle.get(book.title) ?? 0
                    const pct = book.chunkCount > 0
                      ? Math.min(100, Math.round((trained / book.chunkCount) * 100))
                      : 0
                    return (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                          <span>Fortschritt</span>
                          <span>{trained}/{book.chunkCount}</span>
                        </div>
                        <div className="h-2 bg-[var(--background)] border border-[var(--border)] rounded overflow-hidden">
                          <div
                            className="h-full bg-[var(--foreground)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })()}

                  {/* Action Button */}
                  <Link
                    href={`/train?book=${encodeURIComponent(book.title)}`}
                    className="block w-full px-4 py-2 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 transition-colors text-center"
                  >
                    Mit diesem Buch üben
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
