import { createClient } from '@supabase/supabase-js'
import type { BookConfig } from './downloader'

type SupabaseClient = ReturnType<typeof createClient>

export interface ImportResult {
  success: boolean
  chunksCreated?: number
  chunksDeleted?: number
  error?: string
}

export async function importBook(
  supabase: SupabaseClient,
  bookConfig: BookConfig,
  text: string
): Promise<ImportResult> {
  try {
    console.log(`\n📚 Importing "${bookConfig.title}"...`)

    // Step 1: Create or lookup author
    const authorId = await getOrCreateAuthor(supabase, bookConfig.author)
    console.log(`   ✅ Author: ${bookConfig.author.name} (${authorId})`)

    // Step 2: Generate tags
    const tags = generateTags(
      bookConfig.language,
      bookConfig.cefr_level,
      bookConfig.author.name
    )
    console.log(`   🏷️  Tags: ${tags.join(', ')}`)

    // Step 3: Check for existing chunks
    const { data: existingChunks } = await supabase
      .from('source_texts')
      .select('id, title')
      .eq('author_id', authorId)
      .or(`title.eq.${bookConfig.title},title.like.${bookConfig.title} (Teil %)`)

    let deletedCount = 0
    if (existingChunks && existingChunks.length > 0) {
      console.log(`   ⚠️  Found ${existingChunks.length} existing chunks`)
      console.log(`   🗑️  Deleting old chunks...`)

      const { error: deleteError } = await supabase
        .from('source_texts')
        .delete()
        .eq('author_id', authorId)
        .or(`title.eq.${bookConfig.title},title.like.${bookConfig.title} (Teil %)`)

      if (deleteError) {
        throw new Error(`Failed to delete old chunks: ${deleteError.message}`)
      }

      deletedCount = existingChunks.length
      console.log(`   ✅ Deleted ${deletedCount} old chunks`)
    }

    // Step 4: Split into chunks
    const chunks = splitIntoChunks(text, 500)
    console.log(`   ✂️  Split into ${chunks.length} chunks`)

    if (chunks.length === 0) {
      throw new Error('No chunks generated (text too short?)')
    }

    // Step 5: Prepare chunk records
    const chunkRecords = chunks.map((chunkText, index) => {
      const chunkTitle = chunks.length > 1
        ? `${bookConfig.title} (Teil ${index + 1})`
        : bookConfig.title

      return {
        title: chunkTitle,
        author_id: authorId,
        content: chunkText,
        language: bookConfig.language,
        cefr_level: bookConfig.cefr_level || null,
        tags: tags,
        is_pd_us: bookConfig.rights.is_pd_us,
        is_pd_eu: bookConfig.rights.is_pd_eu,
        metadata: {
          chunk_index: index,
          total_chunks: chunks.length,
          import_date: new Date().toISOString(),
          rights_verification_date: bookConfig.rights.verification_date,
          source_type: bookConfig.source.type,
          publication_year: bookConfig.publication_year,
          lexile_score: bookConfig.lexile_score
        }
      }
    })

    // Step 6: Batch insert (50 at a time)
    console.log(`   💾 Inserting chunks into database...`)

    let insertedCount = 0
    const batchSize = 50

    for (let i = 0; i < chunkRecords.length; i += batchSize) {
      const batch = chunkRecords.slice(i, i + batchSize)

      const { error: insertError } = await supabase
        .from('source_texts')
        .insert(batch)

      if (insertError) {
        throw new Error(`Batch insert failed at index ${i}: ${insertError.message}`)
      }

      insertedCount += batch.length
      console.log(`      [${insertedCount}/${chunkRecords.length}] chunks inserted`)
    }

    console.log(`   ✅ Successfully imported ${insertedCount} chunks`)

    return {
      success: true,
      chunksCreated: insertedCount,
      chunksDeleted: deletedCount
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function getOrCreateAuthor(
  supabase: SupabaseClient,
  authorInfo: { name: string; death_year: number }
): Promise<string> {
  // Try to find existing author by name
  const { data: existingAuthor } = await supabase
    .from('authors')
    .select('id')
    .ilike('name', authorInfo.name)
    .single()

  if (existingAuthor) {
    return existingAuthor.id
  }

  // Create new author
  const { data: newAuthor, error } = await supabase
    .from('authors')
    .insert({
      name: authorInfo.name
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create author: ${error.message}`)
  }

  return newAuthor!.id
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

function generateTags(
  language: string,
  cefrLevel: string | null,
  authorName: string
): string[] {
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

  // Author-based tags
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
  } else if (authorLower.includes('schnitzler')) {
    tags.push('Wiener Moderne', 'Psychologie')
  } else if (authorLower.includes('zweig')) {
    tags.push('Moderne', 'Novelle')
  }

  // English authors
  else if (authorLower.includes('wilde')) {
    tags.push('Victorian', 'Aestheticism')
  } else if (authorLower.includes('shelley')) {
    tags.push('Gothic', 'Romanticism')
  } else if (authorLower.includes('austen')) {
    tags.push('Regency', 'Social Commentary')
  } else if (authorLower.includes('fitzgerald')) {
    tags.push('Jazz Age', 'Modernism')
  } else if (authorLower.includes('doyle')) {
    tags.push('Detective', 'Mystery')
  }

  // If no specific tags, add generic "Literatur"
  if (tags.length === 0 || (tags.length === 1 && (tags[0] === 'deutsch' || tags[0] === 'englisch'))) {
    tags.push('Literatur')
  }

  return tags
}
