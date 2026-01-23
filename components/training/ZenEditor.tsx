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
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Typewriter scrolling: Keep cursor vertically centered
  useEffect(() => {
    if (!textareaRef.current) return

    const handleScroll = () => {
      const textarea = textareaRef.current!
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
      const cursorPosition = textarea.selectionStart
      const textBeforeCursor = textarea.value.substring(0, cursorPosition)
      const lines = textBeforeCursor.split('\n').length

      const targetScroll = (lines * lineHeight) - (textarea.clientHeight / 2)
      textarea.scrollTop = Math.max(0, targetScroll)
    }

    const textarea = textareaRef.current
    textarea.addEventListener('input', handleScroll)
    textarea.addEventListener('keydown', handleScroll)

    return () => {
      textarea.removeEventListener('input', handleScroll)
      textarea.removeEventListener('keydown', handleScroll)
    }
  }, [])

  // Keyboard shortcut: Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit
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
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 flex flex-col' : 'max-w-5xl mx-auto p-6'} bg-[#0a0a0a]`}>
      {/* Header */}
      <div className="bg-[#171717] border border-[#262626] rounded-lg p-5 mb-4">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white mb-1">
              Stylistic Imitation Exercise
            </h2>
            <p className="text-sm text-gray-400">{prompt}</p>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3 py-1 text-sm text-white bg-[#262626] hover:bg-[#1f1f1f] rounded transition-colors flex-shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⊗ Exit' : '⊕ Fullscreen'}
          </button>
        </div>

        {/* Scene Description */}
        <div className="bg-[#0a0a0a] border-l-2 border-white p-3 rounded">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Scene:
          </h3>
          <p className="text-sm text-white leading-relaxed">
            {sceneDescription}
          </p>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="bg-[#171717] border border-[#262626] rounded-lg p-5 mb-4">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          placeholder="Begin writing in the style described above..."
          rows={14}
          className="w-full p-4 text-sm leading-relaxed
                     bg-[#0a0a0a] text-white placeholder:text-gray-500
                     border border-[#262626] rounded-lg
                     focus:border-white focus:outline-none
                     resize-y font-serif
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          spellCheck={false}
          autoFocus
        />
      </div>

      {/* Footer */}
      <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 flex justify-between items-center">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-white">{wordCount}</span>
          <span className="text-gray-400">words</span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-400">{charCount} chars</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:inline">
            ⌘+Enter to submit
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg
                       hover:bg-gray-200 disabled:bg-[#262626] disabled:text-gray-600 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
