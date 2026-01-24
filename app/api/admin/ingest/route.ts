import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestSchema } from '@/lib/validation/api-schemas'
import { z } from 'zod'

/**
 * SECURITY M-8: Audit logging helper for admin operations
 */
function logAdminAction(
  action: string,
  userId: string,
  details: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  console.log('[AUDIT]', JSON.stringify({
    timestamp,
    action,
    userId,
    ...details
  }))
}

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

    // SECURITY M-7: Check for dry-run mode
    const url = new URL(request.url)
    const isDryRun = url.searchParams.get('dryRun') === 'true'

    // Parse and validate request body
    const body = await request.json()

    // SECURITY: Validate all inputs with Zod schema
    let validatedData
    try {
      validatedData = ingestSchema.parse(body)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: err.issues.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        )
      }
      throw err
    }

    const {
      title,
      existingAuthorId: authorId,
      newAuthorName,
      content,
      language,
      cefrLevel,
      chunkSize,
      tags
    } = validatedData

    // SECURITY M-8: Log admin action
    logAdminAction('book_ingest_start', user.id, {
      title,
      authorId: authorId || 'new',
      newAuthorName,
      language,
      contentLength: content.length,
      isDryRun
    })

    // Author validation
    if (!authorId && !newAuthorName) {
      return NextResponse.json(
        { error: 'Either existingAuthorId or newAuthorName is required' },
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
    const autoTags = generateTags(language, cefrLevel ?? null, authorName || '')

    // Check if book already exists (same title base + author)
    // If yes, delete old chunks before inserting new ones
    // SECURITY: Use separate queries to avoid SQL injection via string interpolation
    const exactMatch = await supabase
      .from('source_texts')
      .select('id, title')
      .eq('author_id', finalAuthorId)
      .eq('title', title)

    const partialMatch = await supabase
      .from('source_texts')
      .select('id, title')
      .eq('author_id', finalAuthorId)
      .like('title', `${title} (Teil %)`)

    const existingChunks = [
      ...(exactMatch.data || []),
      ...(partialMatch.data || [])
    ]
    const checkError = exactMatch.error || partialMatch.error

    if (checkError) {
      console.error('Failed to check existing chunks:', checkError)
      // Continue anyway - non-critical error
    }

    let deletedCount = 0
    if (existingChunks && existingChunks.length > 0) {
      console.log(`Found ${existingChunks.length} existing chunks for "${title}" by ${authorName}`)

      // SECURITY M-7: Dry-run mode - return what would be deleted without deleting
      if (isDryRun) {
        logAdminAction('book_ingest_dryrun', user.id, {
          title,
          authorName,
          chunksToDelete: existingChunks.length,
          chunkIds: existingChunks.map(c => c.id)
        })

        return NextResponse.json({
          dryRun: true,
          message: 'Dry-run mode: No changes made',
          existingChunks: existingChunks.map(chunk => ({
            id: chunk.id,
            title: chunk.title
          })),
          wouldDelete: existingChunks.length,
          wouldCreate: Math.ceil(content.length / (chunkSize || 500)) // Estimate
        })
      }

      // Delete old chunks by ID (cascades to user_progress, review_history via foreign keys)
      // SECURITY: Use ID-based deletion instead of string interpolation
      const chunkIds = existingChunks.map(chunk => chunk.id)
      const { error: deleteError } = await supabase
        .from('source_texts')
        .delete()
        .in('id', chunkIds)

      if (deleteError) {
        console.error('Failed to delete old chunks:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete existing chunks. Please try again.' },
          { status: 500 }
        )
      }

      deletedCount = existingChunks.length
      console.log(`Successfully deleted ${deletedCount} old chunks`)

      // SECURITY M-8: Log successful deletion
      logAdminAction('book_chunks_deleted', user.id, {
        title,
        authorName,
        deletedCount,
        chunkIds: chunkIds.slice(0, 10) // Log first 10 IDs only
      })
    }

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

    // Build success message
    let message = `Erfolgreich importiert: "${title}"`
    if (deletedCount > 0) {
      message += ` (${deletedCount} alte Chunks ersetzt)`
    }
    message += ` - ${insertedChunks?.length || 0} neue Chunks erstellt`

    // SECURITY M-8: Log successful ingestion
    logAdminAction('book_ingest_success', user.id, {
      title,
      authorName,
      authorId: finalAuthorId,
      chunksCreated: insertedChunks?.length || 0,
      chunksDeleted: deletedCount,
      language,
      contentLength: content.length
    })

    return NextResponse.json({
      success: true,
      chunksCreated: insertedChunks?.length || 0,
      chunksDeleted: deletedCount,
      authorId: finalAuthorId,
      replaced: deletedCount > 0,
      message
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
