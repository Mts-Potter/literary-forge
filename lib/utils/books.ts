/**
 * Utility functions for book data processing
 */

export interface BookChunk {
  id: string
  title: string
  author: { name: string } | { name: string }[]
  cefr_level: string | null
  tags: string[] | null
  language: string
}

export interface GroupedBook {
  title: string
  author: string
  cefr_level: string | null
  tags: string[]
  language: string
  chunkCount: number
}

/**
 * Groups book chunks by base title (removing " (Teil X)" suffix)
 * and aggregates metadata
 *
 * @param chunks - Array of book chunks from database
 * @returns Array of grouped books with metadata
 */
export function groupBooksByTitle(chunks: BookChunk[]): GroupedBook[] {
  const booksMap = new Map<string, GroupedBook>()

  chunks.forEach((chunk) => {
    // Remove " (Teil X)" suffix to get base title
    const baseTitle = chunk.title.replace(/ \(Teil \d+\)$/, '')

    // Handle author field - Supabase relation query can return either array or object
    const authorName = Array.isArray(chunk.author)
      ? chunk.author[0]?.name || 'Unbekannt'
      : chunk.author?.name || 'Unbekannt'

    if (!booksMap.has(baseTitle)) {
      booksMap.set(baseTitle, {
        title: baseTitle,
        author: authorName,
        cefr_level: chunk.cefr_level,
        tags: chunk.tags || [],
        language: chunk.language || 'de',
        chunkCount: 1
      })
    } else {
      booksMap.get(baseTitle)!.chunkCount++
    }
  })

  return Array.from(booksMap.values())
}
