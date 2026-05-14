import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrainingInterface } from '@/components/training/TrainingInterface'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Training | Literary Forge",
  description: "Trainieren Sie Ihren literarischen Schreibstil mit KI-gestütztem Feedback.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TrainPage({
  searchParams
}: {
  searchParams: Promise<{ exclude?: string; book?: string }>
}) {
  const supabase = await createClient()

  // Get search params (Next.js 15 async pattern)
  const params = await searchParams
  const excludeTextId = params.exclude
  const bookFilter = params.book ? decodeURIComponent(params.book) : null

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

  // Filter out the excluded text_id and apply book filter
  const filteredDueChunks = dueChunks?.filter(chunk => {
    if (chunk.text_id === excludeTextId) return false

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
              📚 Filtered Training: <span className="font-semibold text-[var(--foreground)]">{bookFilter}</span>
              {' '}—{' '}
              <a href="/train" className="underline hover:text-[var(--foreground)]">
                Remove Filter
              </a>
              {' '}|{' '}
              <a href="/books" className="underline hover:text-[var(--foreground)]">
                Choose Different Book
              </a>
            </p>
          </div>
        )}
        <TrainingInterface initialChunk={chunk} userId={user.id} userDefaultMode={userDefaultMode} />
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

  if (newChunks && newChunks.length > 0) {
    // Select a random chunk from the candidates
    const randomIndex = Math.floor(Math.random() * newChunks.length)
    const selectedChunk = newChunks[randomIndex]

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
              📚 Filtered Training: <span className="font-semibold text-[var(--foreground)]">{bookFilter}</span>
              {' '}—{' '}
              <a href="/train" className="underline hover:text-[var(--foreground)]">
                Remove Filter
              </a>
              {' '}|{' '}
              <a href="/books" className="underline hover:text-[var(--foreground)]">
                Choose Different Book
              </a>
            </p>
          </div>
        )}
        <TrainingInterface initialChunk={chunk} userId={user.id} userDefaultMode={userDefaultMode} />
      </>
    )
  }

    // 3. No due reviews AND no new chunks - user is truly caught up!
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
            All Caught Up!
          </h1>
          <p className="text-[var(--muted)] mb-4">
            No reviews due right now. Great job staying on top of your training!
            Come back later or add more books to practice.
          </p>
          <p className="text-sm text-[var(--muted)] mb-8">
            💡 Tip: You can also enable <strong className="text-[var(--foreground)]">Linear Mode</strong> in settings
            to go through all texts without scheduling.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/books"
              className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg
                         hover:opacity-90 transition-colors"
            >
              📚 Browse Books
            </a>
            <a
              href="/settings"
              className="px-6 py-3 bg-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                         hover:bg-[var(--card-hover)] transition-colors"
            >
              Go to Settings
            </a>
            <a
              href="/admin/ingest"
              className="px-6 py-3 bg-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                         hover:bg-[var(--card-hover)] transition-colors"
            >
              Add More Books
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

  if (nextTexts && nextTexts.length > 0) {
    // Select a random chunk from the candidates
    const randomIndex = Math.floor(Math.random() * nextTexts.length)
    const selectedChunk = nextTexts[randomIndex]

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
              📚 Filtered Training: <span className="font-semibold text-[var(--foreground)]">{bookFilter}</span>
              {' '}—{' '}
              <a href="/train" className="underline hover:text-[var(--foreground)]">
                Remove Filter
              </a>
              {' '}|{' '}
              <a href="/books" className="underline hover:text-[var(--foreground)]">
                Choose Different Book
              </a>
            </p>
          </div>
        )}
        <TrainingInterface initialChunk={chunk} userId={user.id} userDefaultMode={userDefaultMode} />
      </>
    )
  }

  // All texts completed in linear mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
          All Texts Completed!
        </h1>
        <p className="text-[var(--muted)] mb-4">
          You've seen all available texts in linear mode.
        </p>
        <p className="text-sm text-[var(--muted)] mb-8">
          💡 Tip: Enable <strong className="text-[var(--foreground)]">Spaced Repetition</strong> in settings
          to review texts based on your learning progress for long-term retention.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/books"
            className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg
                       hover:opacity-90 transition-colors"
          >
            📚 Browse Books
          </a>
          <a
            href="/settings"
            className="px-6 py-3 bg-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                       hover:bg-[var(--card-hover)] transition-colors"
          >
            Go to Settings
          </a>
          <a
            href="/admin/ingest"
            className="px-6 py-3 bg-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg
                       hover:bg-[var(--card-hover)] transition-colors"
          >
            Add More Books
          </a>
        </div>
      </div>
    </div>
  )
}
