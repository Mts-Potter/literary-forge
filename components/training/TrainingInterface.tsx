'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { ZenEditor } from './ZenEditor'
import { FeedbackView } from './FeedbackView'

type TrainingPhase = 'writing' | 'feedback' | 'complete'

export function TrainingInterface({ initialChunk, userId }: any) {
  const router = useRouter()
  const [phase, setPhase] = useState<TrainingPhase>('writing')
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sceneDescription, setSceneDescription] = useState<string>('')
  const [isLoadingDescription, setIsLoadingDescription] = useState(true)

  // FIX 4: AbortController ref for canceling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Clear draft text on mount (start with clean slate)
  useEffect(() => {
    localStorage.removeItem('zen-editor-draft')
  }, [])

  // Load or generate scene description on mount
  useEffect(() => {
    async function loadSceneDescription() {
      // Check if already cached in metadata
      if (initialChunk.source_texts.metadata?.plot_summary) {
        setSceneDescription(initialChunk.source_texts.metadata.plot_summary)
        setIsLoadingDescription(false)
        return
      }

      // Generate via Bedrock (first time only)
      try {
        const response = await fetch('/api/generate-scene-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text_id: initialChunk.source_texts.id,
            content: initialChunk.source_texts.content
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate scene description')
        }

        const { description } = await response.json()
        setSceneDescription(description)
      } catch (error) {
        console.error('Failed to load scene description:', error)
        // Fallback: Use first 100 words of original text
        const words = initialChunk.source_texts.content.split(/\s+/).slice(0, 100)
        setSceneDescription(words.join(' ') + '...')
      } finally {
        setIsLoadingDescription(false)
      }
    }

    loadSceneDescription()
  }, [initialChunk])

  // FIX 4: Cleanup - abort in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log('[TrainingInterface] Unmounting - aborting in-flight request')
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // FIX 6: Retry helper with exponential backoff
  async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)

        // Success - return immediately
        if (response.ok) {
          return response
        }

        // Don't retry on 4xx errors (client errors like validation failures)
        if (response.status >= 400 && response.status < 500) {
          return response // Return error response for proper handling
        }

        // 5xx errors - retry
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      } catch (error: any) {
        lastError = error

        // Don't retry on AbortError
        if (error.name === 'AbortError') {
          throw error
        }

        // Last attempt - throw error
        if (attempt === maxRetries - 1) {
          break
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  const handleSubmit = async (text: string) => {
    setIsSubmitting(true)
    setUserText(text)

    // FIX 3: Generate idempotency token (client-side UUID)
    const idempotencyToken = uuidv4()

    // FIX 4: Create AbortController for this request
    abortControllerRef.current = new AbortController()

    try {
      // FIX 6: Call API with retry logic (automatic retry on 5xx errors)
      const response = await fetchWithRetry('/api/train/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyToken // FIX 3: Custom header for idempotency
        },
        body: JSON.stringify({
          text_id: initialChunk.source_texts.id,
          user_text: text,
          original_text: initialChunk.source_texts.content,
          style_metrics: initialChunk.source_texts.metrics,
          idempotency_token: idempotencyToken // FIX 3: Also in body for validation
        }),
        signal: abortControllerRef.current.signal // FIX 4: Attach abort signal
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Submission failed')
      }

      const result = await response.json()
      setFeedback(result)
      setPhase('feedback')
    } catch (error: any) {
      // FIX 4: Handle AbortError gracefully (don't show error to user)
      if (error.name === 'AbortError') {
        console.log('[TrainingInterface] Request was cancelled')
        return // Don't show error alert for user-initiated cancellations
      }

      console.error('Submission error:', error)
      alert(`Failed to submit: ${error.message}. Please try again.`)
    } finally {
      setIsSubmitting(false)
      abortControllerRef.current = null // FIX 4: Clear ref after completion
    }
  }

  const handleContinue = async () => {
    // Clear the draft text from localStorage before reloading
    localStorage.removeItem('zen-editor-draft')

    // FIX 2: Use Next.js router instead of window.location to prevent race condition
    // Small delay ensures DB commit completes (PostgreSQL async replication)
    await new Promise(resolve => setTimeout(resolve, 100))

    // Pass the completed text_id as URL parameter to exclude it from next query
    const currentTextId = initialChunk.source_texts.id
    router.push(`/train?exclude=${currentTextId}`)
    router.refresh() // Force refetch server component data
  }

  // Generate prompt with original text context
  const prompt = `Recreate the following scene from "${initialChunk.source_texts.title}" by ${initialChunk.source_texts.author?.name || 'the author'} in your own words, capturing the distinctive rhythm, tone, and stylistic patterns.
${initialChunk.source_texts.cefr_level ? `\nDifficulty: ${initialChunk.source_texts.cefr_level}` : ''}`

  if (phase === 'writing') {
    // Show loading state while scene description is being fetched/generated
    if (isLoadingDescription) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading scene description...</p>
          </div>
        </div>
      )
    }

    return (
      <ZenEditor
        prompt={prompt}
        sceneDescription={sceneDescription}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    )
  }

  if (phase === 'feedback') {
    return (
      <FeedbackView
        original={initialChunk.source_texts.content}
        user={userText}
        feedback={feedback}
        onContinue={handleContinue}
      />
    )
  }

  return null
}
