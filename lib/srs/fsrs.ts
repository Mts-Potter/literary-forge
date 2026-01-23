import { FSRS, Card, Grade, Rating, RecordLog, State } from 'ts-fsrs'

// Initialize FSRS with optimized parameters for stylistic learning
const fsrs = new FSRS({
  request_retention: 0.85, // Target 85% retention (balanced for creative tasks)
  maximum_interval: 365,    // Max 1 year between reviews
  enable_fuzz: true,        // Add random jitter to prevent review bunching
  enable_short_term: false  // Disable for creative tasks (not rote memorization)
})

/**
 * Maps continuous accuracy score (0-100) to discrete FSRS grade (1-4)
 * Based on pedagogical thresholds from FSRS research
 *
 * @param accuracyScore - Overall accuracy percentage (0-100)
 * @returns FSRS Grade (1=Again, 2=Hard, 3=Good, 4=Easy)
 */
export function mapAccuracyToGrade(accuracyScore: number): Grade {
  if (accuracyScore < 55) return Rating.Again  // 1: Complete failure, need immediate retry
  if (accuracyScore < 78) return Rating.Hard   // 2: Struggled but passed, hard material
  if (accuracyScore < 92) return Rating.Good   // 3: Solid performance, standard interval
  return Rating.Easy                            // 4: Mastery, accelerated interval
}

/**
 * Converts database user_progress row to FSRS Card object
 *
 * @param progress - Database row from user_progress table (or null for new card)
 * @returns FSRS Card object
 */
export function progressToCard(progress: any): Card {
  if (!progress) {
    // Return a new card with default FSRS initial state
    return {
      due: new Date(),
      stability: 0,
      difficulty: 5, // Medium difficulty
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      state: State.New,
      last_review: undefined,
      learning_steps: 0
    }
  }

  return {
    due: new Date(progress.next_review),
    stability: progress.stability || 0,
    difficulty: progress.difficulty || 5,
    elapsed_days: progress.elapsed_days || 0,
    scheduled_days: progress.scheduled_days || 0,
    reps: progress.reps || 0,
    lapses: progress.lapses || 0,
    state: progress.state || State.New,
    last_review: progress.last_review_date ? new Date(progress.last_review_date) : undefined,
    learning_steps: progress.learning_steps || 0
  }
}

/**
 * Calculates next review schedule based on accuracy score
 * Uses the ts-fsrs library for scientifically-optimized spacing
 *
 * @param currentProgress - Current user_progress record from database
 * @param accuracyScore - Accuracy score (0-100) from LLM evaluation
 * @param reviewDate - Date of review (defaults to now)
 * @returns Updated card state, log, next review date, grade, and interval
 */
export function calculateNextReview(
  currentProgress: any,
  accuracyScore: number,
  reviewDate: Date = new Date()
): {
  card: Card
  log: RecordLog
  nextReview: Date
  grade: Grade
  interval: number
} {
  // Convert DB progress to FSRS card
  const card = progressToCard(currentProgress)

  // Map continuous score to discrete grade
  const grade = mapAccuracyToGrade(accuracyScore)

  // Use FSRS algorithm to calculate next state
  const scheduling = fsrs.repeat(card, reviewDate)
  const result = scheduling[grade]

  // Calculate interval in days
  const interval = Math.round(
    (result.log.review.getTime() - reviewDate.getTime()) / 86400000
  )

  return {
    card: result.card,
    log: result.log,
    nextReview: result.log.review,
    grade,
    interval
  }
}

/**
 * Converts FSRS card back to database user_progress update fields
 *
 * @param card - FSRS Card object after review
 * @param nextReview - Next review date
 * @returns Object with fields to update in user_progress table
 */
export function cardToProgressUpdate(card: Card, nextReview: Date) {
  return {
    difficulty: card.difficulty,
    stability: card.stability,
    state: card.state,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    next_review: nextReview.toISOString(),
    last_review_date: new Date().toISOString().split('T')[0], // Date only (YYYY-MM-DD)
    updated_at: new Date().toISOString()
  }
}

/**
 * Human-readable description of FSRS card state
 * Useful for debugging and user feedback
 */
export function getStateDescription(state: State): string {
  switch (state) {
    case State.New:
      return 'New (never reviewed)'
    case State.Learning:
      return 'Learning (short intervals)'
    case State.Review:
      return 'Review (graduated)'
    case State.Relearning:
      return 'Relearning (after failure)'
    default:
      return 'Unknown'
  }
}

/**
 * Gets the FSRS grade name for display
 */
export function getGradeName(grade: Grade): string {
  switch (grade) {
    case Rating.Again:
      return 'Again'
    case Rating.Hard:
      return 'Hard'
    case Rating.Good:
      return 'Good'
    case Rating.Easy:
      return 'Easy'
    default:
      return 'Unknown'
  }
}
