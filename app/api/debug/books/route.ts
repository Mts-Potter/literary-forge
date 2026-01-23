import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { groupBooksByTitle } from '@/lib/utils/books'

export async function GET() {
  const supabase = await createClient()

  // Fetch all chunks
  const { data: allChunks, error: chunksError, count } = await supabase
    .from('source_texts')
    .select(`
      id,
      title,
      author:authors(name),
      cefr_level,
      tags,
      language
    `, { count: 'exact' })
    .order('title')
    .limit(10000)

  if (chunksError) {
    return NextResponse.json({
      error: chunksError.message,
      code: chunksError.code
    }, { status: 500 })
  }

  // Group books
  const books = groupBooksByTitle(allChunks || [])

  return NextResponse.json({
    totalChunks: count,
    chunksReturned: allChunks?.length || 0,
    groupedBooks: books.length,
    rawChunksSample: allChunks?.slice(0, 3) || [],
    groupedBooksSample: books.slice(0, 5),
    allBooks: books
  })
}
