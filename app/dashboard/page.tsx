import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { groupBooksByTitle, type GroupedBook } from '@/lib/utils/books'
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

  // Fetch user progress statistics
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('text_id, next_review, reps, difficulty')
    .eq('user_id', user.id)

  // Count statistics
  const totalStudied = progressData?.length || 0
  const dueToday = progressData?.filter(p =>
    new Date(p.next_review) <= new Date()
  ).length || 0
  const avgReps = progressData?.length
    ? Math.round(progressData.reduce((sum, p) => sum + p.reps, 0) / progressData.length)
    : 0

  // Fetch streak data
  const { data: streakData } = await supabase.rpc('calculate_user_streaks', {
    p_user_id: user.id
  })

  const currentStreak = streakData?.current_streak || 0
  const longestStreak = streakData?.longest_streak || 0

  // Fetch available books using database-side grouping to avoid 1000-row limit
  // Try RPC function first, fall back to client-side grouping if not available
  let books: GroupedBook[] = []

  try {
    const { data: groupedBooks, error: rpcError } = await supabase
      .rpc('get_grouped_books')

    if (rpcError) {
      console.log('RPC function not available, falling back to client-side grouping')

      // Fallback: Fetch all chunks in batches
      const allChunks: any[] = []
      const batchSize = 1000
      let offset = 0
      let hasMore = true

      while (hasMore) {
        const { data: batch, error: batchError } = await supabase
          .from('source_texts')
          .select(`
            id,
            title,
            author:authors(name),
            cefr_level,
            tags,
            language
          `)
          .order('title')
          .range(offset, offset + batchSize - 1)

        if (batchError) {
          console.error('Failed to fetch books batch:', batchError)
          break
        }

        if (batch && batch.length > 0) {
          allChunks.push(...batch)
          offset += batchSize
          hasMore = batch.length === batchSize
        } else {
          hasMore = false
        }
      }

      // Group chunks by base title
      books = groupBooksByTitle(allChunks)
    } else {
      // Use RPC result (already grouped)
      books = (groupedBooks || []).map((book: any): GroupedBook => ({
        title: book.title,
        author: book.author,
        cefr_level: book.cefr_level,
        tags: book.tags || [],
        language: book.language,
        chunkCount: Number(book.chunk_count)
      }))
    }
  } catch (error) {
    console.error('Error fetching books:', error)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4">
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

        {/* Quick Actions */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Schnellstart</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/train"
              className="px-6 py-4 bg-[var(--foreground)] text-[var(--background)] rounded-lg font-semibold
                         hover:opacity-90 transition-colors text-center"
            >
              {dueToday > 0 ? `${dueToday} Wiederholung${dueToday === 1 ? '' : 'en'} starten` : 'Neue Chunks lernen'}
            </Link>
            <Link
              href="/admin/ingest"
              className="px-6 py-4 border-2 border-[var(--border)] text-[var(--foreground)] rounded-lg font-semibold
                         hover:border-gray-400 hover:bg-[var(--card-hover)] transition-colors text-center"
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
