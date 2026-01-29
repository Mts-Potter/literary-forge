import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { groupBooksByTitle, type GroupedBook } from '@/lib/utils/books'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Dashboard | Literary Forge",
  description: "Ihr persönliches Schreibtraining Dashboard. Verfolgen Sie Ihren Fortschritt und starten Sie neue Trainingseinheiten.",
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
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm">
            Welcome back! Here's your learning overview.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Studied */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Chunks Studied</p>
                <p className="text-3xl font-bold text-white">{totalStudied}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          {/* Due Today */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Due Today</p>
                <p className="text-3xl font-bold text-white">{dueToday}</p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>

          {/* Average Reps */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Avg. Repetitions</p>
                <p className="text-3xl font-bold text-white">{avgReps}</p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Streak</p>
                <p className="text-3xl font-bold text-white">
                  {currentStreak}
                  <span className="text-lg text-gray-400 ml-1">
                    {currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </p>
                {longestStreak > currentStreak && (
                  <p className="text-xs text-gray-500 mt-1">
                    Best: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
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
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/train"
              className="px-6 py-4 bg-white text-black rounded-lg font-semibold
                         hover:bg-gray-200 transition-colors text-center"
            >
              {dueToday > 0 ? `Start ${dueToday} Reviews` : 'Learn New Chunks'}
            </Link>
            <Link
              href="/admin/ingest"
              className="px-6 py-4 border-2 border-[#262626] text-gray-300 rounded-lg font-semibold
                         hover:border-gray-400 hover:bg-[#1f1f1f] transition-colors text-center"
            >
              📚 Import Books
            </Link>
          </div>
        </div>

        {/* Available Books */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Available Books</h2>

          {books.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="mb-4">No books imported yet.</p>
              <Link
                href="/admin/ingest"
                className="inline-block px-6 py-3 bg-white text-black rounded-lg font-semibold
                           hover:bg-gray-200 transition-colors"
              >
                Import First Book
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6 hover:border-[#3a3a3a] transition-colors"
                >
                  {/* Book Title */}
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                    {book.title}
                  </h3>

                  {/* Author */}
                  <p className="text-gray-400 mb-4">{book.author}</p>

                  {/* Metadata */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Language:</span>
                      <span className="text-white">
                        {book.language === 'de' ? '🇩🇪 German' : '🇬🇧 English'}
                      </span>
                    </div>

                    {book.cefr_level && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">CEFR:</span>
                        <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs font-semibold">
                          {book.cefr_level}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Chunks:</span>
                      <span className="text-white">{book.chunkCount}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {book.tags && book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {book.tags.slice(0, 3).map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-[#262626] text-gray-300 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {book.tags.length > 3 && (
                        <span className="px-2 py-1 text-gray-500 text-xs">
                          +{book.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Link
                    href={`/train?book=${encodeURIComponent(book.title)}`}
                    className="block w-full px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors text-center"
                  >
                    Practice with this Book
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
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
