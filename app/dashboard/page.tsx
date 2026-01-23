import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

  // Fetch available books grouped by title
  const { data: allChunks } = await supabase
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

  // Group chunks by base title
  const booksMap = new Map()
  allChunks?.forEach((chunk: any) => {
    const baseTitle = chunk.title.replace(/ \(Teil \d+\)$/, '')
    // Supabase relation query can return either array or object depending on join type
    const authorName = Array.isArray(chunk.author)
      ? chunk.author[0]?.name || 'Unbekannt'
      : chunk.author?.name || 'Unbekannt'

    if (!booksMap.has(baseTitle)) {
      booksMap.set(baseTitle, {
        title: baseTitle,
        author: authorName,
        cefr_level: chunk.cefr_level,
        tags: chunk.tags,
        language: chunk.language,
        chunkCount: 1
      })
    } else {
      booksMap.get(baseTitle).chunkCount++
    }
  })
  const books = Array.from(booksMap.values())

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
