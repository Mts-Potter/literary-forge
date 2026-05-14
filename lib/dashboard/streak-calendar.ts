import type { SupabaseClient } from '@supabase/supabase-js'

export interface StreakDay {
  date: string
  reviews: number
}

export async function fetchLast7Days(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakDay[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const { data } = await supabase
    .from('review_history')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())

  const counts = new Map<string, number>()
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    counts.set(d.toISOString().slice(0, 10), 0)
  }
  for (const row of data ?? []) {
    const ts = (row as { created_at: string }).created_at
    const key = new Date(ts).toISOString().slice(0, 10)
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries()).map(([date, reviews]) => ({ date, reviews }))
}
