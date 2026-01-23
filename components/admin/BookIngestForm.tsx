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
  const [chunkSize, setChunkSize] = useState(500)
  const [fileName, setFileName] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.txt')) {
      setError('Bitte nur .txt Dateien hochladen')
      return
    }

    setFileName(file.name)
    setError('')

    // Read file content
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setContent(text)
    }
    reader.onerror = () => {
      setError('Fehler beim Lesen der Datei')
    }
    reader.readAsText(file, 'UTF-8')
  }

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
          chunkSize
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import fehlgeschlagen')
      }

      // Show success message with replacement info if applicable
      let successMsg = '✅ ' + data.message
      if (data.replaced) {
        successMsg += ' ⚠️ Alte Version wurde überschrieben.'
      }
      setSuccess(successMsg)

      // Reset form
      setTitle('')
      setAuthorId('')
      setNewAuthorName('')
      setContent('')
      setCefrLevel('')
      setFileName('')

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

      {/* File Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Textdatei hochladen *
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            required={!content}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg
                       text-white file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:text-sm file:font-semibold
                       file:bg-white file:text-black
                       hover:file:bg-gray-200
                       file:cursor-pointer
                       focus:border-gray-400 focus:outline-none"
          />
        </div>
        {fileName && (
          <p className="text-xs text-green-400 mt-2">
            ✓ Geladen: {fileName} ({content.length.toLocaleString()} Zeichen)
          </p>
        )}
        {!fileName && (
          <p className="text-xs text-gray-500 mt-1">
            Nur .txt Dateien werden unterstützt
          </p>
        )}
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
