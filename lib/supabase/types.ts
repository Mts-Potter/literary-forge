// ============================================================================
// Author Types (Migration 003)
// ============================================================================

export type Author = {
  id: string
  name: string
  birth_year: number | null
  death_year: number | null
  nationality: string | null
  wikidata_id: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Copyright Compliance Types (Migration 003)
// ============================================================================

export type RightsDetails = {
  verification_date: string
  us_rationale: string
  eu_rationale: string
  edge_case_notes?: string
}

// ============================================================================
// Source Text Types (Enhanced in Migration 003)
// ============================================================================

export type SourceText = {
  id: string
  title: string
  author: string | null // Deprecated: Use author_id instead
  author_id: string | null
  content: string
  language: string
  difficulty_level: number

  // Compliance (Migration 003)
  is_pd_us: boolean
  is_pd_eu: boolean
  rights_details: RightsDetails

  // Pedagogical Metadata (Migration 003)
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
  lexile_score: number | null
  estimated_reading_time_minutes: number | null

  // Bibliographic Data (Migration 003)
  publication_year: number | null
  original_language: string
  source_url: string | null
  cover_image_url: string | null

  // Tags & Categorization (Migration 003)
  tags: string[]

  // Existing fields
  metrics: StyleMetrics
  embedding: number[] | null
  metadata: TextMetadata

  created_at: string
  updated_at: string
}

export type StyleMetrics = {
  dependency_distance?: number
  adj_verb_ratio?: number
  sentence_length_variance?: number
  mtld?: number
}

export type TextMetadata = {
  plot_summary?: string
  sentiment?: string
  constraints?: string[]
  generated_at?: string
}

// ============================================================================
// User Progress Types
// ============================================================================

export type UserProgress = {
  user_id: string
  text_id: string
  interval: number
  repetitions: number
  ef_factor: number
  next_review: string
  total_attempts: number
  best_score: number | null
  last_attempt_at: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Helper Types for Frontend Filtering
// ============================================================================

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type BookFilter = {
  cefr_levels?: CEFRLevel[]
  tags?: string[]
  authors?: string[] // Author IDs
  min_difficulty?: number
  max_difficulty?: number
  language?: string
  require_global_pd?: boolean // If true, only show books with is_pd_us AND is_pd_eu
}
