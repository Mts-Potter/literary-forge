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
      tags
    `)
    .order('title')

  // Group chunks by base title
  const booksMap = new Map()
  allChunks?.forEach(chunk => {
    const baseTitle = chunk.title.replace(/ \(Teil \d+\)$/, '')
    if (!booksMap.has(baseTitle)) {
      booksMap.set(baseTitle, {
        title: baseTitle,
        author: chunk.author?.name || 'Unbekannt',
        cefr_level: chunk.cefr_level,
        tags: chunk.tags,
        chunkCount: 1
      })
    } else {
      booksMap.get(baseTitle).chunkCount++
    }
  })
  const books = Array.from(booksMap.values())

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Willkommen zurück! Hier ist deine Lernübersicht.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Studied */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Chunks Gelernt</p>
                <p className="text-3xl font-bold text-blue-600">{totalStudied}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          {/* Due Today */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fällig Heute</p>
                <p className="text-3xl font-bold text-orange-600">{dueToday}</p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>

          {/* Average Reps */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ø Wiederholungen</p>
                <p className="text-3xl font-bold text-green-600">{avgReps}</p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schnellstart</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/train"
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold
                         hover:bg-blue-700 transition-colors text-center shadow-sm"
            >
              {dueToday > 0 ? `${dueToday} Reviews starten` : 'Neue Chunks lernen'}
            </Link>
            <Link
              href="/admin/ingest"
              className="flex-1 px-6 py-4 border-2 border-purple-300 text-purple-700 rounded-lg font-semibold
                         hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
            >
              📚 Bücher importieren
            </Link>
          </div>
        </div>

        {/* Available Books */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verfügbare Bücher</h2>

          {books.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">Noch keine Bücher importiert.</p>
              <Link
                href="/admin/ingest"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold
                           hover:bg-purple-700 transition-colors"
              >
                Erstes Buch importieren
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book, idx) => (
                <div
                  key={idx}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300
                             hover:bg-blue-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {book.chunkCount} Chunks
                    </span>
                    {book.cefr_level && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {book.cefr_level}
                      </span>
                    )}
                  </div>
                  {book.tags && book.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {book.tags.slice(0, 3).map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
