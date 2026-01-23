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
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} flex flex-col bg-[#0a0a0a] min-h-screen`}>
      {/* Compact Header */}
      <div className="bg-[#171717] border-b border-[#262626] px-4 py-2 flex-shrink-0">
        <div className="flex justify-between items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">
              Stylistic Imitation Exercise
            </h2>
            <p className="text-xs text-gray-400 truncate">{prompt}</p>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#262626] rounded transition-colors flex-shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⊗' : '⊕'}
          </button>
        </div>
      </div>

      {/* Scene Description */}
      <div className="bg-[#171717] border-b border-[#262626] px-4 py-2 flex-shrink-0">
        <div className="flex items-start gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex-shrink-0">
            Scene:
          </h3>
          <p className="text-xs leading-snug text-gray-300 flex-1">
            {sceneDescription}
          </p>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="w-full h-full max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            placeholder="Begin writing in the style described above..."
            className="w-full h-full p-4 text-base leading-relaxed
                       bg-[#171717] text-gray-100 placeholder:text-gray-500
                       border border-[#262626] rounded
                       focus:border-white focus:outline-none
                       resize-none font-serif
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            spellCheck={false}
            autoFocus
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#171717] border-t border-[#262626] px-4 py-2 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="font-medium text-white">{wordCount}</span>
          <span className="text-gray-600">words</span>
          <span className="text-gray-600">•</span>
          <span>{charCount} chars</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">
            ⌘+Enter to submit
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="px-4 py-1.5 bg-white text-black text-sm font-semibold rounded
                       hover:bg-gray-200 disabled:bg-[#262626] disabled:text-gray-600 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
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
