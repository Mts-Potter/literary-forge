import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface Book {
  title: string
  author: string
  author_id: string
  cefr_level: string | null
  tags: string[]
  chunk_count: number
  language: string
}

export default async function BooksPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch all books with aggregated data
  const { data: chunks, error } = await supabase
    .from('source_texts')
    .select(`
      title,
      author:authors(name, id),
      cefr_level,
      tags,
      language
    `)

  if (error) {
    console.error('Failed to fetch books:', error)
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600">Fehler beim Laden der Bücher</h1>
        <p className="text-gray-400 mt-4">Bitte versuche es später erneut.</p>
      </div>
    )
  }

  // Group chunks by book (title without "Teil X")
  const booksMap = new Map<string, Book>()

  chunks?.forEach((chunk: any) => {
    // Remove " (Teil X)" suffix to get base title
    const baseTitle = chunk.title.replace(/ \(Teil \d+\)$/, '')

    if (!booksMap.has(baseTitle)) {
      booksMap.set(baseTitle, {
        title: baseTitle,
        author: chunk.author?.name || 'Unbekannt',
        author_id: chunk.author?.id || '',
        cefr_level: chunk.cefr_level,
        tags: chunk.tags || [],
        chunk_count: 0,
        language: chunk.language || 'de'
      })
    }

    const book = booksMap.get(baseTitle)!
    book.chunk_count++
  })

  // Convert to array and sort by title
  const books = Array.from(booksMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Verfügbare Bücher</h1>
          <p className="text-gray-400">
            Wähle ein Buch aus, um gezielt damit zu üben, oder gehe zu{' '}
            <Link href="/train" className="text-blue-400 hover:underline">
              /train
            </Link>{' '}
            für eine zufällige Auswahl.
          </p>
        </div>

        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">
              Keine Bücher verfügbar
            </h2>
            <p className="text-gray-500 mb-6">
              Füge Bücher über die Admin-Oberfläche hinzu.
            </p>
            <Link
              href="/admin/ingest"
              className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Bücher hinzufügen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.title}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#3a3a3a] transition-colors"
              >
                {/* Book Title */}
                <h2 className="text-xl font-bold mb-2 line-clamp-2">
                  {book.title}
                </h2>

                {/* Author */}
                <p className="text-gray-400 mb-4">{book.author}</p>

                {/* Metadata */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Sprache:</span>
                    <span className="text-white">
                      {book.language === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 English'}
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
                    <span className="text-white">{book.chunk_count}</span>
                  </div>
                </div>

                {/* Tags */}
                {book.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {book.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-[#2a2a2a] text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {book.tags.length > 3 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{book.tags.length - 3} mehr
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/train?book=${encodeURIComponent(book.title)}`}
                    className="flex-1 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors text-center"
                  >
                    Mit diesem Buch üben
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Training */}
        <div className="mt-12 text-center">
          <Link
            href="/train"
            className="inline-block px-6 py-3 bg-[#262626] text-white font-semibold rounded-lg hover:bg-[#1f1f1f] transition-colors"
          >
            ← Zurück zum Training (Zufällig)
          </Link>
        </div>
      </div>
    </div>
  )
}
