import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { groupBooksByTitle, type GroupedBook } from '@/lib/utils/books'

export default async function BooksPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch all books using database-side grouping to avoid 1000-row limit
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
      books = groupBooksByTitle(allChunks).sort((a, b) =>
        a.title.localeCompare(b.title)
      )
    } else {
      // Use RPC result (already grouped)
      books = (groupedBooks || []).map((book: any): GroupedBook => ({
        title: book.title,
        author: book.author,
        cefr_level: book.cefr_level,
        tags: book.tags || [],
        language: book.language,
        chunkCount: Number(book.chunk_count)
      })).sort((a: GroupedBook, b: GroupedBook) => a.title.localeCompare(b.title))
    }
  } catch (error) {
    console.error('Error fetching books:', error)
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600">Fehler beim Laden der Bücher</h1>
        <p className="text-gray-400 mt-4">Bitte versuche es später erneut.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Available Books</h1>
          <p className="text-gray-400">
            Select a book to practice with it specifically, or go to{' '}
            <Link href="/train" className="text-blue-400 hover:underline">
              /train
            </Link>{' '}
            for a random selection.
          </p>
        </div>

        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">
              No Books Available
            </h2>
            <p className="text-gray-500 mb-6">
              Add books through the admin interface.
            </p>
            <Link
              href="/admin/ingest"
              className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add Books
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
                        +{book.tags.length - 3} more
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
                    Practice with this Book
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
            ← Back to Training (Random)
          </Link>
        </div>
      </div>
    </div>
  )
}
