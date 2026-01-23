'use client'

import { useState, useEffect } from 'react'
import { ZenEditor } from './ZenEditor'
import { FeedbackView } from './FeedbackView'

type TrainingPhase = 'writing' | 'feedback' | 'complete'

export function TrainingInterface({ initialChunk, userId }: any) {
  const [phase, setPhase] = useState<TrainingPhase>('writing')
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sceneDescription, setSceneDescription] = useState<string>('')
  const [isLoadingDescription, setIsLoadingDescription] = useState(true)

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

  const handleSubmit = async (text: string) => {
    setIsSubmitting(true)
    setUserText(text)

    try {
      // Call API to analyze text
      const response = await fetch('/api/train/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_id: initialChunk.source_texts.id,
          user_text: text,
          original_text: initialChunk.source_texts.content,
          style_metrics: initialChunk.source_texts.metrics
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Submission failed')
      }

      const result = await response.json()
      setFeedback(result)
      setPhase('feedback')
    } catch (error: any) {
      console.error('Submission error:', error)
      alert(`Failed to submit: ${error.message}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinue = () => {
    // Clear the draft text from localStorage before reloading
    localStorage.removeItem('zen-editor-draft')

    // Pass the completed text_id as URL parameter to exclude it from next query
    const currentTextId = initialChunk.source_texts.id
    window.location.href = `/train?exclude=${currentTextId}`
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
        originalText={initialChunk.source_texts.content}
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
