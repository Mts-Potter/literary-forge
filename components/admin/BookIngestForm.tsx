'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Author {
  id: string
  name: string
}

interface BookIngestFormProps {
  authors: Author[]
  userId: string
}

export default function BookIngestForm({ authors, userId }: BookIngestFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [newAuthorName, setNewAuthorName] = useState('')
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('de')
  const [cefrLevel, setCefrLevel] = useState('')
  const [tags, setTags] = useState('')
  const [chunkSize, setChunkSize] = useState(500)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!title.trim()) {
      setError('Titel ist erforderlich')
      setIsLoading(false)
      return
    }

    if (!authorId && !newAuthorName.trim()) {
      setError('Bitte wähle einen Autor aus oder gib einen neuen Namen ein')
      setIsLoading(false)
      return
    }

    if (!content.trim()) {
      setError('Textinhalt ist erforderlich')
      setIsLoading(false)
      return
    }

    if (content.trim().length < 100) {
      setError('Der Text muss mindestens 100 Zeichen lang sein')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          authorId: authorId || null,
          newAuthorName: newAuthorName.trim() || null,
          content: content.trim(),
          language,
          cefrLevel: cefrLevel || null,
          tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
          chunkSize
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import fehlgeschlagen')
      }

      setSuccess(`✅ Erfolgreich importiert! ${data.chunksCreated} Chunks erstellt.`)
      
      // Reset form
      setTitle('')
      setAuthorId('')
      setNewAuthorName('')
      setContent('')
      setCefrLevel('')
      setTags('')
      
      // Refresh page to update authors list if new author was created
      if (newAuthorName) {
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Titel *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="z.B. Die Verwandlung"
          className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg
                     text-white placeholder:text-gray-500
                     focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Author Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Vorhandener Autor
          </label>
          <select
            value={authorId}
            onChange={(e) => {
              setAuthorId(e.target.value)
              if (e.target.value) setNewAuthorName('')
            }}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg
                       text-white focus:border-gray-400 focus:outline-none"
          >
            <option value="">-- Autor wählen --</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Oder neuer Autor
          </label>
          <input
            type="text"
            value={newAuthorName}
            onChange={(e) => {
              setNewAuthorName(e.target.value)
              if (e.target.value) setAuthorId('')
            }}
            placeholder="z.B. Franz Kafka"
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg
                       text-white placeholder:text-gray-500
                       focus:border-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Language and CEFR Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Sprache *
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg
                       text-white focus:border-gray-400 focus:outline-none"
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            CEFR Level (optional)
          </label>
          <select
            value={cefrLevel}
            onChange={(e) => setCefrLevel(e.target.value)}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg
                       text-white focus:border-gray-400 focus:outline-none"
          >
            <option value="">-- Nicht angegeben --</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Tags (kommagetrennt, optional)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="z.B. Klassiker, Expressionismus, Novelle"
          className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg
                     text-white placeholder:text-gray-500
                     focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Chunk Size */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Chunk-Größe (Zeichen): {chunkSize}
        </label>
        <input
          type="range"
          min="200"
          max="1000"
          step="50"
          value={chunkSize}
          onChange={(e) => setChunkSize(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Der Text wird in Abschnitte dieser Größe aufgeteilt
        </p>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Textinhalt *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={15}
          placeholder="Füge hier den vollständigen Text ein..."
          className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg
                     text-white placeholder:text-gray-500
                     focus:border-gray-400 focus:outline-none font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length} Zeichen
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-white text-black rounded-lg font-semibold
                   hover:bg-gray-200 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Wird importiert...' : '📚 Buch importieren'}
      </button>
    </form>
  )
}
