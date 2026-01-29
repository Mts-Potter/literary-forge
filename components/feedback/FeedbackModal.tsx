'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<string>('Bug/Problem')
  const [email, setEmail] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const supabase = createClient()

  // Get user email if authenticated
  useEffect(() => {
    async function getUserEmail() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
      }
    }
    getUserEmail()
  }, [supabase])

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCategory('Bug/Problem')
        setMessage('')
        setSubmitStatus('idle')
        setErrorMessage('')
      }, 300) // Wait for modal animation
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/feedback/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          email,
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Senden des Feedbacks')
      }

      setSubmitStatus('success')
      setMessage('') // Clear message on success
      setTimeout(() => {
        onClose()
      }, 2000) // Close after 2 seconds
    } catch (error) {
      console.error('Feedback submission error:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[#171717] border border-[#262626] rounded-lg p-6 max-w-md w-full pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">💬 Feedback senden</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Schließen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg text-green-400">
              ✅ Feedback erfolgreich gesendet! Vielen Dank.
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
              ❌ {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-300 mb-2">
                Kategorie
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white focus:border-gray-400 focus:outline-none"
                required
              >
                <option value="Bug/Problem">🐛 Bug/Problem</option>
                <option value="Feature-Request">✨ Feature-Request</option>
                <option value="Allgemeines Feedback">💭 Allgemeines Feedback</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                Deine Email-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white placeholder-gray-600 focus:border-gray-400 focus:outline-none"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-300 mb-2">
                Nachricht
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Beschreibe dein Anliegen..."
                rows={6}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white placeholder-gray-600 focus:border-gray-400 focus:outline-none resize-none"
                required
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">Mindestens 10 Zeichen</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || submitStatus === 'success'}
              className="w-full px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Wird gesendet...
                </span>
              ) : submitStatus === 'success' ? (
                '✅ Gesendet'
              ) : (
                'Feedback senden'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
