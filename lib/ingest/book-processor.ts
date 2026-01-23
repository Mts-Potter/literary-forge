'use client'

import { getParser } from '@/lib/nlp/parsing'
import { getEmbeddingGenerator } from '@/lib/nlp/embeddings'
import { styleAnalyzer } from '@/lib/nlp/metrics'

export type BookChunk = {
  title: string
  author: string
  content: string
  chunkIndex: number
  metrics: {
    dependencyDistance: number
    adjVerbRatio: number
    sentenceLengthVariance: number
  }
  embedding: {
    float32: number[]  // Original embedding (1,536 bytes)
    binary: string     // Binary quantized (48 bytes)
  }
  difficulty_level: number
}

/**
 * Chunking-Strategie: Teilt Text in Einheiten von 2-5 Sätzen
 * Kürzere Chunks für schnellere Feedback-Schleife beim Training
 */
export function chunkText(text: string, minSentences = 2, maxSentences = 5): string[] {
  // Einfache Satz-Segmentierung (UDPipe macht später die präzise)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10) // Ignoriere zu kurze Fragmente

  const chunks: string[] = []
  let currentChunk: string[] = []

  for (let i = 0; i < sentences.length; i++) {
    currentChunk.push(sentences[i])

    // Chunk abschließen wenn:
    // - max. Satzanzahl erreicht ODER
    // - min. Satzanzahl erreicht UND am Ende eines Absatzes (heuristisch: Satz endet mit Punkt)
    if (
      currentChunk.length >= maxSentences ||
      (currentChunk.length >= minSentences && sentences[i].endsWith('.'))
    ) {
      chunks.push(currentChunk.join('. ') + '.')
      currentChunk = []
    }
  }

  // Rest-Chunk hinzufügen falls vorhanden
  if (currentChunk.length >= minSentences) {
    chunks.push(currentChunk.join('. ') + '.')
  }

  return chunks
}

/**
 * Heuristik für Schwierigkeitsgrad basierend auf Metriken
 */
function calculateDifficulty(metrics: {
  dependencyDistance: number
  adjVerbRatio: number
  sentenceLengthVariance: number
}): number {
  // Höhere Dependency Distance → komplexer
  // Höhere Varianz → anspruchsvoller
  // Hohe Adj/Verb Ratio → beschreibender/literarischer

  const ddScore = Math.min(metrics.dependencyDistance / 5, 1) // Normalisiert auf 0-1
  const varScore = Math.min(metrics.sentenceLengthVariance / 10, 1)
  const avrScore = Math.min(metrics.adjVerbRatio / 2, 1)

  const difficulty = (ddScore * 0.4 + varScore * 0.3 + avrScore * 0.3) * 5

  return Math.max(1, Math.min(5, Math.round(difficulty)))
}

/**
 * Hauptfunktion: Verarbeitet ein Buch zu importierbaren Chunks
 */
export async function processBook(
  rawText: string,
  title: string,
  author: string,
  onProgress?: (percent: number, message: string) => void
): Promise<BookChunk[]> {
  onProgress?.(0, 'Initialisiere NLP-Engine...')

  // Initialisiere Parser und Embedding-Generator
  const parser = await getParser()
  const embedder = await getEmbeddingGenerator()

  onProgress?.(10, 'Chunking Text...')
  const textChunks = chunkText(rawText)

  if (textChunks.length === 0) {
    throw new Error('Keine verwertbaren Chunks gefunden. Text zu kurz?')
  }

  onProgress?.(20, `${textChunks.length} Chunks gefunden. Analysiere...`)

  const processedChunks: BookChunk[] = []

  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i]
    const progress = 20 + ((i / textChunks.length) * 70)

    onProgress?.(progress, `Verarbeite Chunk ${i + 1}/${textChunks.length}...`)

    try {
      // 1. Parse mit UDPipe für syntaktische Analyse
      const sentences = parser.parse(chunk)

      // 2. Berechne Stilmetriken
      const dependencyDistance = styleAnalyzer.calculateDependencyDistance(sentences)
      const adjVerbRatio = styleAnalyzer.calculateAdjVerbRatio(sentences)
      const sentenceLengthVariance = styleAnalyzer.calculateSentenceLengthVariance(sentences)

      const metrics = {
        dependencyDistance,
        adjVerbRatio,
        sentenceLengthVariance
      }

      // 3. Generiere Embedding (both float32 and binary)
      const embedding = await embedder.generateEmbedding(chunk)

      // 4. Berechne Schwierigkeitsgrad
      const difficulty_level = calculateDifficulty(metrics)

      processedChunks.push({
        title: `${title} (Teil ${i + 1})`,
        author,
        content: chunk,
        chunkIndex: i,
        metrics,
        embedding,
        difficulty_level
      })

      // Kleine Pause um UI responsiv zu halten
      await new Promise(resolve => setTimeout(resolve, 10))
    } catch (error) {
      console.error(`Fehler bei Chunk ${i + 1}:`, error)
      // Skip fehlerhaften Chunk und fahre fort
    }
  }

  onProgress?.(100, 'Verarbeitung abgeschlossen!')

  return processedChunks
}

/**
 * Speichert verarbeitete Chunks in Supabase
 *
 * Optimiert mit Batch-Insert (50 Chunks gleichzeitig)
 * - 20x schneller als Single-Insert
 * - Graceful Fallback bei Fehlern
 */
export async function saveChunksToSupabase(
  chunks: BookChunk[],
  supabaseClient: any,
  onProgress?: (percent: number, message: string) => void,
  batchSize: number = 50
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  // Batch-Insert Strategie
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const progress = (i / chunks.length) * 100

    onProgress?.(progress, `Speichere Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`)

    // Prepare batch data
    const batchData = batch.map(chunk => ({
      title: chunk.title,
      author: chunk.author,
      content: chunk.content,
      language: 'de',
      difficulty_level: chunk.difficulty_level,
      metrics: chunk.metrics,
      embedding: chunk.embedding.float32,                   // float32 vector (VECTOR(384))
      embedding_binary: `\\x${chunk.embedding.binary}`,     // binary quantized (BIT(384))
      metadata: {
        chunk_index: chunk.chunkIndex,
        generated_at: new Date().toISOString()
      }
    }))

    try {
      const { error, count } = await supabaseClient
        .from('source_texts')
        .insert(batchData)
        .select('id', { count: 'exact', head: true })

      if (error) {
        console.warn('Batch-Insert fehlgeschlagen, versuche Single-Insert Fallback:', error.message)

        // Fallback: Einzeln einfügen um fehlerhafte Chunks zu identifizieren
        for (const chunk of batch) {
          try {
            const { error: singleError } = await supabaseClient
              .from('source_texts')
              .insert({
                title: chunk.title,
                author: chunk.author,
                content: chunk.content,
                language: 'de',
                difficulty_level: chunk.difficulty_level,
                metrics: chunk.metrics,
                embedding: chunk.embedding.float32,                   // float32 vector
                embedding_binary: `\\x${chunk.embedding.binary}`,     // binary quantized
                metadata: {
                  chunk_index: chunk.chunkIndex,
                  generated_at: new Date().toISOString()
                }
              })

            if (singleError) {
              console.error('Chunk fehlgeschlagen:', chunk.title, singleError)
              failed++
            } else {
              success++
            }
          } catch (e) {
            console.error('Chunk fehlgeschlagen:', chunk.title, e)
            failed++
          }
        }
      } else {
        success += batch.length
      }

      // Rate limiting: Pause zwischen Batches (nicht zwischen einzelnen Chunks)
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error('Fehler beim Batch-Insert:', error)
      failed += batch.length
    }
  }

  onProgress?.(100, `Import abgeschlossen: ${success} erfolgreich, ${failed} fehlgeschlagen`)

  return { success, failed }
}

/**
 * Updates an existing book's content while preserving metadata
 *
 * This is used when a book already has metadata (author_id, tags, rights, etc.)
 * but needs its content replaced/updated with processed text.
 *
 * @param bookId - UUID of the existing book
 * @param chunks - Processed chunks with new content
 * @param existingMetadata - Original book metadata to preserve
 * @param supabaseClient - Supabase client instance
 * @param onProgress - Progress callback
 */
export async function updateExistingBook(
  bookId: string,
  chunks: BookChunk[],
  existingMetadata: any,
  supabaseClient: any,
  onProgress?: (percent: number, message: string) => void
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  onProgress?.(0, 'Vorbereite Update...')

  // Delete old chunks (if any exist for this book)
  try {
    const { error: deleteError } = await supabaseClient
      .from('source_texts')
      .delete()
      .eq('title', existingMetadata.title)
      .eq('author_id', existingMetadata.author_id)

    if (deleteError) {
      console.warn('Konnte alte Chunks nicht löschen:', deleteError)
      // Continue anyway - might be first content upload
    }
  } catch (e) {
    console.warn('Fehler beim Löschen alter Chunks:', e)
  }

  onProgress?.(10, 'Erstelle neue Chunks mit Metadaten...')

  // Insert new chunks while preserving metadata from seed
  const batchSize = 50
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const progress = 10 + ((i / chunks.length) * 90)

    onProgress?.(progress, `Speichere Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`)

    // Prepare batch with PRESERVED metadata
    const batchData = batch.map(chunk => ({
      title: `${existingMetadata.title} (Teil ${chunk.chunkIndex + 1})`,
      author: existingMetadata.author, // Deprecated field, kept for compatibility
      author_id: existingMetadata.author_id, // PRESERVED from seed
      content: chunk.content,
      language: existingMetadata.language || 'de',
      difficulty_level: chunk.difficulty_level,

      // PRESERVED METADATA from seed
      is_pd_us: existingMetadata.is_pd_us,
      is_pd_eu: existingMetadata.is_pd_eu,
      rights_details: existingMetadata.rights_details,
      cefr_level: existingMetadata.cefr_level,
      lexile_score: existingMetadata.lexile_score,
      estimated_reading_time_minutes: existingMetadata.estimated_reading_time_minutes,
      publication_year: existingMetadata.publication_year,
      original_language: existingMetadata.original_language,
      source_url: existingMetadata.source_url,
      cover_image_url: existingMetadata.cover_image_url,
      tags: existingMetadata.tags,

      // COMPUTED fields from NLP pipeline
      metrics: chunk.metrics,
      embedding: chunk.embedding,
      metadata: {
        chunk_index: chunk.chunkIndex,
        generated_at: new Date().toISOString(),
        source_book_id: bookId // Reference to original book entry
      }
    }))

    try {
      const { error } = await supabaseClient
        .from('source_texts')
        .insert(batchData)

      if (error) {
        console.error('Batch-Insert fehlgeschlagen:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })

        // Fallback to single inserts
        for (const data of batchData) {
          try {
            const { error: singleError } = await supabaseClient
              .from('source_texts')
              .insert(data)

            if (singleError) {
              console.error('Chunk fehlgeschlagen:', data.title, {
                message: singleError.message,
                details: singleError.details,
                hint: singleError.hint,
                code: singleError.code
              })
              failed++
            } else {
              success++
            }
          } catch (e) {
            console.error('Chunk fehlgeschlagen (Exception):', data.title, e)
            failed++
          }
        }
      } else {
        success += batch.length
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error('Fehler beim Batch-Insert:', error)
      failed += batch.length
    }
  }

  onProgress?.(100, `Update abgeschlossen: ${success} erfolgreich, ${failed} fehlgeschlagen`)

  return { success, failed }
}
