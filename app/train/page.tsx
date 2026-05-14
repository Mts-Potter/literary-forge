import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrainingInterface } from '@/components/training/TrainingInterface'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Training | The Franklin Method",
  description: "Trainiere deinen Schreibstil mit der Franklin-Methode + KI-Feedback.",
  robots: {
    index: false,
    follow: false,
  },
};

const MIN_CHUNK_WORDS = 15
function hasEnoughWords(content: string | undefined | null): boolean {
  if (!content) return false
  return content.trim().split(/\s+/).filter(Boolean).length >= MIN_CHUNK_WORDS
}

export default async function TrainPage({
  searchParams
}: {
  searchParams: Promise<{ exclude?: string; book?: string; mode?: string }>
}) {
  const supabase = await createClient()

  // Get search params (Next.js 15 async pattern)
  const params = await searchParams
  const excludeTextId = params.exclude
  const bookFilter = params.book ? decodeURIComponent(params.book) : null
  const modeOverride =
    params.mode === 'franklin' || params.mode === 'cloze' || params.mode === 'free'
      ? params.mode
      : null

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch user settings (SRS toggle + default mode)
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('enable_srs, default_mode')
    .eq('user_id', user.id)
    .single()

  const enableSRS = userSettings?.enable_srs ?? true  // Default to SRS mode
  const userDefaultMode = (userSettings?.default_mode ?? 'franklin') as 'franklin' | 'cloze' | 'free'

  // === SRS MODE: Anki-style scheduling ===
  if (enableSRS) {
    // 1. Fetch next due text chunk from SRS queue (existing reviews)
    // IMPORTANT: Skip the last completed text_id to prevent immediate repetition
  let dueChunkQuery = supabase
    .from('user_progress')
    .select(`
      text_id,
      next_review,
      reps,
      difficulty,
      stability,
      mode,
      phase,
      cloze_level,
      source_texts (
        id,
        title,
        author:authors(name),
        content,
        metrics,
        cefr_level,
        tags
      )
    `)
    .eq('user_id', user.id)
    .lte('next_review', new Date().toISOString())
    .order('next_review', { ascending: true })
    .limit(10)  // Fetch 10 to allow filtering by book

  const { data: dueChunks } = await dueChunkQuery

  // Filter out the excluded text_id, apply book filter, and enforce chunk-size minimum
  const filteredDueChunks = dueChunks?.filter(chunk => {
    if (chunk.text_id === excludeTextId) return false
    const content = (chunk.source_texts as any)?.content
    if (!hasEnoughWords(content)) return false

    // Apply book filter if specified
    if (bookFilter && chunk.source_texts) {
      const title = (chunk.source_texts as any).title
      // Match exact title or title with " (Teil X)" suffix
      return title === bookFilter || title.startsWith(`${bookFilter} (Teil `)
    }

    return true
  }) || []

  // If found a due review (that's not the excluded one), return it
  if (filteredDueChunks.length > 0) {
    const chunk = filteredDueChunks[0]
    return (
      <>
        {bookFilter && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mx-4 mt-4">
            <p className="text-[var(--foreground)] text-sm">
              📚 Gefiltertes Training: <span className="font-semibold text-[var(--foreground)]">{bookFilter}</span>
              {' '}—{' '}
              <a href="/train" className="underline hover:text-[var(--foreground)]">
                Filter entfernen
              </a>
              {' '}|{' '}
              <a href="/dashboard" className="underline hover:text-[var(--foreground)]">
                Anderes Buch wählen
              </a>
            </p>
          </div>
        )}
        <TrainingInterface initialChunk={chunk} userId={user.id} userDefaultMode={modeOverride ?? userDefaultMode} />
      </>
    )
  }

  // 2. No due reviews - try to fetch a NEW unstudied chunk
  // Get list of text_ids the user has already attempted
  const { data: attemptedIds } = await supabase
    .from('user_progress')
    .select('text_id')
    .eq('user_id', user.id)

  const attemptedTextIds = attemptedIds?.map(p => p.text_id) || []

  // Add excluded text_id to the attempted list to prevent it from appearing
  if (excludeTextId && !attemptedTextIds.includes(excludeTextId)) {
    attemptedTextIds.push(excludeTextId)
  }

  // Fetch NEW chunks NOT in user_progress (random selection)
  let newChunkQuery = supabase
    .from('source_texts')
    .select(`
      id,
      title,
      author:authors(name),
      content,
      metrics,
      cefr_level,
      tags
    `)
    .limit(20)  // Fetch 20 candidates for random selection

  // Filter by book if specified
  if (bookFilter) {
    newChunkQuery = newChunkQuery.or(`title.eq.${bookFilter},title.like.${bookFilter} (Teil %)`)
  }

  // Exclude already attempted chunks (if any)
  if (attemptedTextIds.length > 0) {
    newChunkQuery = newChunkQuery.not('id', 'in', `(${attemptedTextIds.join(',')})`)
  }

  const { data: newChunks } = await newChunkQuery
  const validNewChunks = newChunks?.filter(c => hasEnoughWords(c.content)) ?? []

  if (validNewChunks.length > 0) {
    // Select a random chunk from the candidates
    const randomIndex = Math.floor(Math.random() * validNewChunks.length)
    const selectedChunk = validNewChunks[randomIndex]

    // Transform to match expected shape (simulate a "new card" in user_progress format)
    const chunk = {
      text_id: selectedChunk.id,
      next_review: null, // Not applicable for new cards
      reps: 0,
      difficulty: 5.0, // Default FSRS difficulty
      stability: 0,
      source_texts: selectedChunk
    }

    return (
      <>
        {bookFilter && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mx-4 mt-4">
            <p className="text-[var(--foreground)] text-sm">
              📚 Gefiltertes Training: <span className="font-semibold text-[var(--foreground)]">{bookFilter}</span>
              {' '}—{' '}
              <a href="/train" className="underline hover:text-[var(--foreground)]">
                Filter entfernen
              </a>
              {' '}|{' '}
              <a href="/dashboard" className="underline hover:text-[var(--foreground)]">
                Anderes Buch wählen
              </a>
            </p>
          </div>
        )}
        <TrainingInterface initialChunk={chunk} userId={user.id} userDefaultMode={modeOverride ?? userDefaultMode} />
      </>
    )
  }

    // 3. No due reviews AND no new chunks - user is truly caught up!
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
            Alles abgearbeitet!
          </h1>
          <p className="text-[var(--muted)] mb-4">
            Aktuell keine Wiederholungen fällig. Stark — komm später wieder oder füge mehr Bücher hinzu.
          </p>
          <p className="text-sm text-[var(--muted)] mb-8">
            💡 Tipp: Du kannst in den Einstellungen auch den <strong className="text-[var(--foreground)]">linearen Modus</strong> aktivieren,
            um Texte ohne Wiederholungs-Plan durchzugehen.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/dashboard"
              className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg
                         hover:opacity-90 transition-colors"
            >
              📚 Bücher durchstöbern
            </a>
            <a
              href="/settings"
              className="px-6 py-3 bg-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                         hover:bg-[var(--card-hover)] transition-colors"
            >
              Einstellungen
            </a>
            <a
              href="/admin/ingest"
              className="px-6 py-3 bg-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                         hover:bg-[var(--card-hover)] transition-colors"
            >
              Mehr Bücher hinzufügen
            </a>
          </div>
        </div>
      </div>
    )
  }

  // === LINEAR MODE: Sequential without scheduling ===
  // Get list of already attempted text_ids
  const { data: attemptedIds } = await supabase
    .from('user_progress')
    .select('text_id')
    .eq('user_id', user.id)

  const attemptedTextIds = attemptedIds?.map(p => p.text_id) || []

  // Add excluded text_id to prevent immediate repetition
  if (excludeTextId && !attemptedTextIds.includes(excludeTextId)) {
    attemptedTextIds.push(excludeTextId)
  }

  // Fetch texts NOT in attempted list (random selection)
  let nextTextQuery = supabase
    .from('source_texts')
    .select(`
      id,
      title,
      author:authors(name),
      content,
      metrics,
      cefr_level,
      tags
    `)
    .limit(20)  // Fetch 20 candidates for random selection

  // Filter by book if specified
  if (bookFilter) {
    nextTextQuery = nextTextQuery.or(`title.eq.${bookFilter},title.like.${bookFilter} (Teil %)`)
  }

  // Exclude already attempted texts
  if (attemptedTextIds.length > 0) {
    nextTextQuery = nextTextQuery.not('id', 'in', `(${attemptedTextIds.join(',')})`)
  }

  const { data: nextTexts } = await nextTextQuery
  const validNextTexts = nextTexts?.filter(c => hasEnoughWords(c.content)) ?? []

  if (validNextTexts.length > 0) {
    // Select a random chunk from the candidates
    const randomIndex = Math.floor(Math.random() * validNextTexts.length)
    const selectedChunk = validNextTexts[randomIndex]

    // Transform to match expected shape
    const chunk = {
      text_id: selectedChunk.id,
      next_review: null,  // Not applicable in linear mode
      reps: 0,
      difficulty: 5.0,
      stability: 0,
      source_texts: selectedChunk
    }

    return (
      <>
        {bookFilter && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mx-4 mt-4">
            <p className="text-[var(--foreground)] text-sm">
              📚 Gefiltertes Training: <span className="font-semibold text-[var(--foreground)]">{bookFilter}</span>
              {' '}—{' '}
              <a href="/train" className="underline hover:text-[var(--foreground)]">
                Filter entfernen
              </a>
              {' '}|{' '}
              <a href="/dashboard" className="underline hover:text-[var(--foreground)]">
                Anderes Buch wählen
              </a>
            </p>
          </div>
        )}
        <TrainingInterface initialChunk={chunk} userId={user.id} userDefaultMode={modeOverride ?? userDefaultMode} />
      </>
    )
  }

  // All texts completed in linear mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
          Alle Texte durch!
        </h1>
        <p className="text-[var(--muted)] mb-4">
          Du hast im linearen Modus alle Texte gesehen.
        </p>
        <p className="text-sm text-[var(--muted)] mb-8">
          💡 Tipp: Schalte in den Einstellungen <strong className="text-[var(--foreground)]">Spaced Repetition</strong> ein,
          damit Texte basierend auf deinem Lernstand wiederkehren.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg
                       hover:opacity-90 transition-colors"
          >
            📚 Bücher durchstöbern
          </a>
          <a
            href="/settings"
            className="px-6 py-3 bg-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                       hover:bg-[var(--card-hover)] transition-colors"
          >
            Einstellungen
          </a>
          <a
            href="/admin/ingest"
            className="px-6 py-3 bg-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                       hover:bg-[var(--card-hover)] transition-colors"
          >
            Mehr Bücher hinzufügen
          </a>
        </div>
      </div>
    </div>
  )
}
