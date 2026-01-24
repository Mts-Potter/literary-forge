/**
 * Secure Error Logging Utility
 *
 * SECURITY H-4: Prevents information disclosure by:
 * 1. Logging full error details server-side only
 * 2. Returning generic error messages to clients
 * 3. Never exposing internal paths, database schema, or AWS details
 *
 * Usage:
 *   import { logError, getSafeErrorMessage } from '@/lib/utils/error-logger'
 *
 *   try {
 *     // ... code
 *   } catch (error) {
 *     logError('route-name', error)
 *     return NextResponse.json(
 *       { error: getSafeErrorMessage(error) },
 *       { status: 500 }
 *     )
 *   }
 */

/**
 * Log error with full details to server console
 * NEVER send these details to the client
 */
export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString()

  const errorDetails = {
    timestamp,
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    type: error instanceof Error ? error.constructor.name : typeof error,
  }

  // Log to console (will appear in Vercel logs)
  console.error(`[${context}] Error at ${timestamp}:`, errorDetails)

  // In production, you could also send to error monitoring service:
  // - Sentry
  // - Datadog
  // - CloudWatch
  // Example: sentry.captureException(error, { tags: { context } })
}

/**
 * Get safe error message for client response
 * SECURITY: Returns generic messages only, no internal details
 */
export function getSafeErrorMessage(error: unknown): string {
  // NEVER expose:
  // - Database errors ("relation 'table_name' does not exist")
  // - AWS errors ("arn:aws:iam::12345...")
  // - File paths ("/Users/...")
  // - Stack traces
  // - Environment variables

  // Only return generic messages
  return 'An error occurred. Please try again later.'
}

/**
 * Get safe error message with context for specific error types
 * Use when you need slightly more specific user-facing messages
 */
export function getSafeErrorMessageWithContext(
  error: unknown,
  context: 'auth' | 'validation' | 'database' | 'api' | 'rate-limit'
): string {
  switch (context) {
    case 'auth':
      return 'Authentication failed. Please log in and try again.'
    case 'validation':
      return 'Invalid input. Please check your data and try again.'
    case 'database':
      return 'Database operation failed. Please try again later.'
    case 'api':
      return 'External API call failed. Please try again later.'
    case 'rate-limit':
      return 'Rate limit exceeded. Please try again later.'
    default:
      return getSafeErrorMessage(error)
  }
}

/**
 * Check if error is a known safe error that can be shown to user
 * Returns true only for explicitly safe errors
 */
export function isSafeUserError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const safeMessages = [
    'Unauthorized',
    'Rate limit exceeded',
    'Validation failed',
    'Not found',
    'Admin access required',
  ]

  return safeMessages.some(msg => error.message.includes(msg))
}

/**
 * Get error response for API routes
 * Combines logging and safe message generation
 */
export function getErrorResponse(
  context: string,
  error: unknown,
  status: number = 500
): {
  error: string
  status: number
} {
  logError(context, error)

  // If it's a safe user error, we can show the actual message
  if (isSafeUserError(error) && error instanceof Error) {
    return {
      error: error.message,
      status
    }
  }

  // Otherwise, return generic message
  return {
    error: getSafeErrorMessage(error),
    status
  }
}
