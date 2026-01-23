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
    // Supabase relation query returns array, so extract first element
    const authorName = chunk.author?.[0]?.name || 'Unbekannt'

    if (!booksMap.has(baseTitle)) {
      booksMap.set(baseTitle, {
        title: baseTitle,
        author: authorName,
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
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm">
            Willkommen zurück! Hier ist deine Lernübersicht.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Studied */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Chunks Gelernt</p>
                <p className="text-3xl font-bold text-white">{totalStudied}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          {/* Due Today */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Fällig Heute</p>
                <p className="text-3xl font-bold text-white">{dueToday}</p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>

          {/* Average Reps */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ø Wiederholungen</p>
                <p className="text-3xl font-bold text-white">{avgReps}</p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Schnellstart</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/train"
              className="px-6 py-4 bg-white text-black rounded-lg font-semibold
                         hover:bg-gray-200 transition-colors text-center"
            >
              {dueToday > 0 ? `${dueToday} Reviews starten` : 'Neue Chunks lernen'}
            </Link>
            <Link
              href="/admin/ingest"
              className="px-6 py-4 border-2 border-[#262626] text-gray-300 rounded-lg font-semibold
                         hover:border-gray-400 hover:bg-[#1f1f1f] transition-colors text-center"
            >
              📚 Bücher importieren
            </Link>
          </div>
        </div>

        {/* Available Books */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Verfügbare Bücher</h2>

          {books.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="mb-4">Noch keine Bücher importiert.</p>
              <Link
                href="/admin/ingest"
                className="inline-block px-6 py-3 bg-white text-black rounded-lg font-semibold
                           hover:bg-gray-200 transition-colors"
              >
                Erstes Buch importieren
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book, idx) => (
                <div
                  key={idx}
                  className="border-2 border-[#262626] rounded-lg p-4 hover:border-gray-400
                             hover:bg-[#1f1f1f] transition-colors"
                >
                  <h3 className="font-semibold text-white mb-1">{book.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">{book.author}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-[#262626] rounded">
                      {book.chunkCount} Chunks
                    </span>
                    {book.cefr_level && (
                      <span className="px-2 py-1 bg-[#262626] text-gray-300 rounded">
                        {book.cefr_level}
                      </span>
                    )}
                  </div>
                  {book.tags && book.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {book.tags.slice(0, 3).map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-[#262626] text-gray-300 rounded"
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
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
