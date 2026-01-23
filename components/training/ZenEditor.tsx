'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useDarkMode } from '@/hooks/use-dark-mode'

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
  const [isDarkMode, setIsDarkMode] = useDarkMode()

  // Typewriter scrolling: Keep cursor vertically centered
  useEffect(() => {
    if (!textareaRef.current) return

    const handleScroll = () => {
      const textarea = textareaRef.current!
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
      const cursorPosition = textarea.selectionStart
      const textBeforeCursor = textarea.value.substring(0, cursorPosition)
      const lines = textBeforeCursor.split('\n').length

      // Calculate target scroll to keep cursor in middle
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

  // Theme classes
  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
  const headerBgClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900'
  const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-600'
  const editorBgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
  const editorTextClass = isDarkMode ? 'text-gray-100 placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'
  const sceneBoxBgClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} flex flex-col ${bgClass} min-h-screen`}>
      {/* Header with prompt, scene description, and controls */}
      <div className={`${headerBgClass} border-b px-8 py-4`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className={`text-lg font-semibold ${textClass}`}>Stylistic Imitation Exercise</h2>
            <p className={`text-sm ${textSecondaryClass} mt-1`}>{prompt}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? '⊗ Exit' : '⊕ Fullscreen'}
            </button>
          </div>
        </div>

        {/* Scene Description Box */}
        <div className={`${sceneBoxBgClass} border-2 rounded-lg p-4`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wide ${textSecondaryClass} mb-2`}>
            Scene to Recreate
          </h3>
          <p className={`text-sm leading-relaxed ${textClass}`}>
            {sceneDescription}
          </p>
        </div>
      </div>

      {/* Main Content Area - Single Full-Width Editor */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl h-full flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            placeholder="Begin writing in the style described above..."
            className={`flex-1 p-8 text-lg leading-relaxed
                       ${editorBgClass} ${editorTextClass} border-2 rounded-lg
                       focus:border-blue-500 focus:outline-none
                       resize-none font-serif
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors`}
            spellCheck={false}
            autoFocus
          />
        </div>
      </div>

      {/* Footer with stats and submit button */}
      <div className={`${headerBgClass} border-t px-8 py-4 flex justify-between items-center`}>
        <div className={`flex items-center gap-4 text-sm ${textSecondaryClass}`}>
          <span className="font-medium">{wordCount} words</span>
          <span className="text-gray-400">•</span>
          <span>{charCount} characters</span>
          <span className="text-gray-400">•</span>
          <span className="text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Auto-saved
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs ${textSecondaryClass}`}>
            Press ⌘+Enter (Mac) or Ctrl+Enter (Windows) to submit
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg
                       hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-colors shadow-sm"
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
