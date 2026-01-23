'use client'

import { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type EditorStore = {
  content: string
  setContent: (content: string) => void
  currentTextId: string | null
  setCurrentTextId: (id: string) => void
}

const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      content: '',
      setContent: (content) => set({ content }),
      currentTextId: null,
      setCurrentTextId: (id) => set({ currentTextId: id })
    }),
    {
      name: 'zen-editor-storage'
    }
  )
)

export function ZenEditor() {
  const { content, setContent } = useEditorStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Typewriter Scrolling: Hält Cursor in Bildschirmmitte
  useEffect(() => {
    if (!textareaRef.current || !isFocused) return

    const textarea = textareaRef.current
    const handleScroll = () => {
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
      const cursorPosition = textarea.selectionStart
      const textBeforeCursor = textarea.value.substring(0, cursorPosition)
      const lines = textBeforeCursor.split('\n').length
      const targetScroll = (lines * lineHeight) - (textarea.clientHeight / 2)

      textarea.scrollTop = Math.max(0, targetScroll)
    }

    textarea.addEventListener('input', handleScroll)
    textarea.addEventListener('keydown', handleScroll)

    return () => {
      textarea.removeEventListener('input', handleScroll)
      textarea.removeEventListener('keydown', handleScroll)
    }
  }, [isFocused])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Schreibe deine Version des Textes..."
          className="w-full h-[70vh] p-8 text-lg leading-relaxed
                     bg-white border-2 border-gray-200 rounded-lg
                     focus:border-blue-500 focus:outline-none
                     resize-none font-serif"
          spellCheck={false}
        />

        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <span>{content.split(/\s+/).filter(Boolean).length} Wörter</span>
          <span>Autosave aktiv (lokal)</span>
        </div>
      </div>
    </div>
  )
}
