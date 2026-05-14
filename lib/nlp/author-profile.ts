/**
 * Author Style Profile Loader
 *
 * Lädt aggregierte Stilprofile pro Autor aus `author_style_profiles` (Migration 016).
 * Wird in /api/train/submit verwendet, um den User-Versuch gegen das
 * Autor-Profil zu vergleichen (Burrows-Delta-Variante).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthorStyleProfile {
  author_id: string
  feature_means: Record<string, number>
  feature_stddevs: Record<string, number>
  chunk_count: number
  computed_at: string
}

export async function loadAuthorProfile(
  supabase: SupabaseClient,
  authorId: string
): Promise<AuthorStyleProfile | null> {
  const { data, error } = await supabase
    .from('author_style_profiles')
    .select('author_id, feature_means, feature_stddevs, chunk_count, computed_at')
    .eq('author_id', authorId)
    .single()

  if (error || !data) return null
  return data as AuthorStyleProfile
}

/**
 * Convenience: lädt Profil über den text_id eines Chunks
 * (resolved erst zu author_id, dann zum Profil).
 */
export async function loadAuthorProfileByTextId(
  supabase: SupabaseClient,
  textId: string
): Promise<AuthorStyleProfile | null> {
  const { data, error } = await supabase
    .from('source_texts')
    .select('author_id')
    .eq('id', textId)
    .single()

  if (error || !data?.author_id) return null
  return loadAuthorProfile(supabase, data.author_id)
}
