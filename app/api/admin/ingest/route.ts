import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin check
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const {
      title,
      authorId,
      newAuthorName,
      content,
      language,
      cefrLevel,
      chunkSize
    } = await request.json()

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    if (!authorId && !newAuthorName) {
      return NextResponse.json(
        { error: 'Author ID or new author name is required' },
        { status: 400 }
      )
    }

    if (content.length < 100) {
      return NextResponse.json(
        { error: 'Content must be at least 100 characters' },
        { status: 400 }
      )
    }

    // Handle author
    let finalAuthorId = authorId

    if (!finalAuthorId && newAuthorName) {
      // Create new author
      const { data: newAuthor, error: authorError } = await supabase
        .from('authors')
        .insert({ name: newAuthorName })
        .select('id')
        .single()

      if (authorError) {
        console.error('Failed to create author:', authorError)
        return NextResponse.json(
          { error: 'Failed to create author' },
          { status: 500 }
        )
      }

      finalAuthorId = newAuthor.id
    }

    // Get author name for tag generation
    let authorName = newAuthorName
    if (!authorName && finalAuthorId) {
      const { data: authorData } = await supabase
        .from('authors')
        .select('name')
        .eq('id', finalAuthorId)
        .single()
      authorName = authorData?.name || 'Unbekannt'
    }

    // Generate automatic tags
    const autoTags = generateTags(language, cefrLevel, authorName || '')

    // Split content into chunks
    const chunks = splitIntoChunks(content, chunkSize || 500)

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to split content into chunks' },
        { status: 400 }
      )
    }

    // Prepare chunk records for insertion
    const chunkRecords = chunks.map((chunkText, index) => {
      const chunkTitle = chunks.length > 1 
        ? title + ' (Teil ' + (index + 1) + ')'
        : title

      return {
        title: chunkTitle,
        author_id: finalAuthorId,
        content: chunkText,
        language: language || 'de',
        cefr_level: cefrLevel || null,
        tags: autoTags,
        is_pd_us: false,
        is_pd_eu: false,
        metadata: {
          chunk_index: index,
          total_chunks: chunks.length,
          import_date: new Date().toISOString(),
          imported_by: user.id
        }
      }
    })

    // Insert chunks into database
    const { data: insertedChunks, error: insertError } = await supabase
      .from('source_texts')
      .insert(chunkRecords)
      .select('id')

    if (insertError) {
      console.error('Failed to insert chunks:', insertError)
      return NextResponse.json(
        { error: 'Failed to save chunks to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      chunksCreated: insertedChunks?.length || 0,
      authorId: finalAuthorId,
      message: 'Successfully imported "' + title + '" in ' + (insertedChunks?.length || 0) + ' chunks'
    })

  } catch (error: any) {
    console.error('Ingest error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function splitIntoChunks(text: string, targetSize: number): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+|\n/).filter(p => p.trim().length > 0)
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length > 0 && (currentChunk.length + paragraph.length) > targetSize) {
      chunks.push(currentChunk.trim())
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph
    }
    
    if (currentChunk.length > targetSize * 2) {
      chunks.push(currentChunk.trim())
      currentChunk = ''
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks.filter(chunk => chunk.length >= 50)
}

function generateTags(language: string, cefrLevel: string | null, authorName: string): string[] {
  const tags: string[] = []

  // Language tag
  if (language === 'de') {
    tags.push('deutsch')
  } else if (language === 'en') {
    tags.push('englisch')
  }

  // CEFR level tag
  if (cefrLevel) {
    tags.push(cefrLevel.toUpperCase())
  }

  // Author-based tags (optional genre inference)
  const authorLower = authorName.toLowerCase()

  // German authors
  if (authorLower.includes('kafka')) {
    tags.push('Moderne', 'Existentialismus')
  } else if (authorLower.includes('goethe')) {
    tags.push('Klassik', 'Weimarer Klassik')
  } else if (authorLower.includes('schiller')) {
    tags.push('Klassik', 'Drama')
  } else if (authorLower.includes('brecht')) {
    tags.push('Moderne', 'Episches Theater')
  } else if (authorLower.includes('hesse')) {
    tags.push('Moderne', 'Bildungsroman')
  } else if (authorLower.includes('mann')) {
    tags.push('Moderne', 'Literaturnobelpreis')
  }

  // If no specific tags, add generic "Literatur"
  if (tags.length === 0 || (tags.length === 1 && (tags[0] === 'deutsch' || tags[0] === 'englisch'))) {
    tags.push('Literatur')
  }

  return tags
}
