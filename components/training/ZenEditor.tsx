'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'

export function ZenEditor({
  prompt,
  sceneDescription,
  onSubmit,
  isSubmitting = false
}: {
  prompt: string
  sceneDescription: string
  onSubmit: (text: string) => void
  isSubmitting?: boolean
}) {
  const [text, setText] = useLocalStorage('zen-editor-draft', '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Keyboard shortcut: Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit
  // (Typewriter-Scroll-Effekt wurde Phase 6.7 entfernt — irritierte mehr als er half.)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) {
      e.preventDefault()
      onSubmit(text)
    }
  }

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text)
    }
  }

  // Calculate word and character counts
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const charCount = text.length

  return (
    <div className="max-w-5xl mx-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
        <div className="mb-3">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
            Stylistic Imitation Exercise
          </h2>
          <p className="text-lg text-[var(--foreground)] leading-relaxed">{prompt}</p>
        </div>

        {/* Scene Description */}
        <div className="bg-[var(--background)] border-l-2 border-white p-4 rounded">
          <h3 className="text-base font-semibold uppercase tracking-wide text-[var(--foreground)] mb-2">
            Scene:
          </h3>
          <p className="text-lg text-[var(--foreground)] leading-relaxed">
            {sceneDescription}
          </p>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          placeholder="Begin writing in the style described above..."
          rows={16}
          className="w-full p-4 text-lg leading-relaxed
                     bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)]
                     border border-[var(--border)] rounded-lg
                     focus:border-white focus:outline-none
                     resize-y font-serif
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          spellCheck={false}
          autoFocus
        />
      </div>

      {/* Footer */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 flex justify-between items-center">
        <div className="flex items-center gap-3 text-lg">
          <span className="font-semibold text-[var(--foreground)]">{wordCount}</span>
          <span className="text-[var(--foreground)]">words</span>
          <span className="text-[var(--foreground)]">•</span>
          <span className="text-[var(--foreground)]">{charCount} chars</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-lg text-[var(--foreground)] hidden sm:inline">
            ⌘+Enter to submit
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="px-5 py-3 bg-[var(--foreground)] text-[var(--background)] text-lg font-semibold rounded-lg
                       hover:opacity-90 disabled:bg-[var(--border)] disabled:text-[var(--muted)] disabled:cursor-not-allowed
                       transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              '✓ Submit'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
