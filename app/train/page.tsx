import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrainingInterface } from '@/components/training/TrainingInterface'

export default async function TrainPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 1. Fetch next due text chunk from SRS queue (existing reviews)
  const { data: dueChunks } = await supabase
    .from('user_progress')
    .select(`
      text_id,
      next_review,
      reps,
      difficulty,
      stability,
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
    .limit(1)

  // If found a due review, return it immediately (prioritize reviews over new cards)
  if (dueChunks && dueChunks.length > 0) {
    const chunk = dueChunks[0]
    return <TrainingInterface initialChunk={chunk} userId={user.id} />
  }

  // 2. No due reviews - try to fetch a NEW unstudied chunk
  // Get list of text_ids the user has already attempted
  const { data: attemptedIds } = await supabase
    .from('user_progress')
    .select('text_id')
    .eq('user_id', user.id)

  const attemptedTextIds = attemptedIds?.map(p => p.text_id) || []

  // Fetch a NEW chunk NOT in user_progress
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
    .order('created_at', { ascending: true }) // FIFO: oldest first
    .limit(1)

  // Exclude already attempted chunks (if any)
  if (attemptedTextIds.length > 0) {
    newChunkQuery = newChunkQuery.not('id', 'in', `(${attemptedTextIds.join(',')})`)
  }

  const { data: newChunks } = await newChunkQuery

  if (newChunks && newChunks.length > 0) {
    // Transform to match expected shape (simulate a "new card" in user_progress format)
    const chunk = {
      text_id: newChunks[0].id,
      next_review: null, // Not applicable for new cards
      reps: 0,
      difficulty: 5.0, // Default FSRS difficulty
      stability: 0,
      source_texts: newChunks[0]
    }

    return <TrainingInterface initialChunk={chunk} userId={user.id} />
  }

  // 3. No due reviews AND no new chunks - user is truly caught up!
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          All Caught Up!
        </h1>
        <p className="text-gray-600 mb-8">
          No reviews due right now. Great job staying on top of your training!
          Come back later or add more books to practice.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/admin/ingest"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg
                       hover:bg-blue-700 transition-colors"
          >
            Add More Books
          </a>
        </div>
      </div>
    </div>
  )
}
