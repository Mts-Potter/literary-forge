'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { processBook, saveChunksToSupabase, updateExistingBook, BookChunk } from '@/lib/ingest/book-processor'

export function BookIngestionUI() {
  // File and basic form state
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [processedChunks, setProcessedChunks] = useState<BookChunk[]>([])
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  // Update Mode state
  const [mode, setMode] = useState<'create' | 'update'>('create')
  const [existingBooks, setExistingBooks] = useState<any[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string>('')

  // Load existing books on mount
  useEffect(() => {
    async function loadBooks() {
      const supabase = createClient()

      // Get all chunks and group by base title
      const { data: allChunks, error } = await supabase
        .from('source_texts')
        .select(`
          id,
          title,
          author_id,
          language,
          is_pd_us,
          is_pd_eu,
          rights_details,
          cefr_level,
          lexile_score,
          estimated_reading_time_minutes,
          publication_year,
          original_language,
          source_url,
          cover_image_url,
          tags,
          created_at,
          author:authors(name)
        `)
        .order('title')

      if (allChunks && allChunks.length > 0) {
        // Group chunks by base title (remove " (Teil X)" suffix)
        const booksMap = new Map()

        allChunks.forEach(chunk => {
          const baseTitle = chunk.title.replace(/ \(Teil \d+\)$/, '')

          if (!booksMap.has(baseTitle)) {
            // Use first chunk's data as representative for the book
            booksMap.set(baseTitle, {
              ...chunk,
              title: baseTitle,
              chunkCount: 1
            })
          } else {
            booksMap.get(baseTitle).chunkCount++
          }
        })

        setExistingBooks(Array.from(booksMap.values()))
      }
    }
    loadBooks()
  }, [])

  // Get selected book details
  const selectedBook = existingBooks.find(b => b.id === selectedBookId)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/plain') {
      setFile(selectedFile)
      // Auto-fill title from filename
      if (!title) {
        setTitle(selectedFile.name.replace('.txt', ''))
      }
    } else {
      alert('Bitte wähle eine .txt Datei')
    }
  }

  const handleProcess = async () => {
    if (!file) return

    if (mode === 'create' && (!title || !author)) {
      alert('Bitte fülle alle Felder aus')
      return
    }

    if (mode === 'update' && !selectedBookId) {
      alert('Bitte wähle ein Buch zum Aktualisieren')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setStatusMessage('Lese Datei...')
    setProcessedChunks([])
    setImportResult(null)

    try {
      // Datei einlesen
      const text = await file.text()

      // Get selected book metadata if in update mode
      const bookTitle = selectedBook ? selectedBook.title : title
      const bookAuthor = selectedBook ? (selectedBook.author?.name || author) : author

      // Verarbeiten
      const chunks = await processBook(
        text,
        bookTitle,
        bookAuthor,
        (percent, message) => {
          setProgress(percent)
          setStatusMessage(message)
        }
      )

      setProcessedChunks(chunks)
      setStatusMessage(`✅ ${chunks.length} Chunks erfolgreich verarbeitet!`)
    } catch (error: any) {
      setStatusMessage(`❌ Fehler: ${error.message}`)
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (processedChunks.length === 0) {
      alert('Keine Chunks zum Importieren')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setStatusMessage('Importiere in Datenbank...')

    try {
      const supabase = createClient()

      if (mode === 'update' && selectedBookId && selectedBook) {
        // UPDATE MODE: Preserve metadata
        const result = await updateExistingBook(
          selectedBookId,
          processedChunks,
          {
            title: selectedBook.title,
            author: selectedBook.author?.name || 'Unbekannt',
            author_id: selectedBook.author_id,
            language: selectedBook.language || 'de',
            is_pd_us: selectedBook.is_pd_us,
            is_pd_eu: selectedBook.is_pd_eu,
            rights_details: selectedBook.rights_details,
            cefr_level: selectedBook.cefr_level,
            lexile_score: selectedBook.lexile_score,
            estimated_reading_time_minutes: selectedBook.estimated_reading_time_minutes,
            publication_year: selectedBook.publication_year,
            original_language: selectedBook.original_language,
            source_url: selectedBook.source_url,
            cover_image_url: selectedBook.cover_image_url,
            tags: selectedBook.tags
          },
          supabase,
          (percent, message) => {
            setProgress(percent)
            setStatusMessage(message)
          }
        )

        setImportResult(result)
      } else {
        // CREATE MODE: Standard import
        const result = await saveChunksToSupabase(
          processedChunks,
          supabase,
          (percent, message) => {
            setProgress(percent)
            setStatusMessage(message)
          }
        )

        setImportResult(result)
      }
    } catch (error: any) {
      setStatusMessage(`❌ Fehler beim Import: ${error.message}`)
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setTitle('')
    setAuthor('')
    setProgress(0)
    setStatusMessage('')
    setProcessedChunks([])
    setImportResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-[#171717] border border-[#262626] rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-white">
          📚 Book Ingestion System
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Importiert .txt Dateien mit wissenschaftlich konsistenten Metriken (UDPipe + Transformers.js)
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('create')}
            disabled={isProcessing}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'create'
                ? 'bg-white text-black'
                : 'bg-[#262626] text-gray-300 hover:bg-[#1f1f1f]'
            } disabled:opacity-50`}
          >
            Create New
          </button>
          <button
            onClick={() => setMode('update')}
            disabled={isProcessing}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'update'
                ? 'bg-white text-black'
                : 'bg-[#262626] text-gray-300 hover:bg-[#1f1f1f]'
            } disabled:opacity-50`}
          >
            Update Existing
          </button>
        </div>

        {/* Book Selection (Update Mode) */}
        {mode === 'update' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Buch wählen
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#262626] rounded-lg
                         text-white focus:border-gray-400 focus:outline-none
                         disabled:opacity-50"
            >
              <option value="">-- Buch wählen --</option>
              {existingBooks.map(book => (
                <option key={book.id} value={book.id}>
                  {book.title} ({book.author?.name || 'Unbekannt'}) - {book.chunkCount || 0} chunks
                </option>
              ))}
            </select>

            {/* Metadata Preview Card */}
            {selectedBook && (
              <div className="mt-4 p-6 bg-[#0a0a0a] border-2 border-[#262626] rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">
                  📋 Metadaten-Vorschau
                </h3>

                {/* Title & Author */}
                <div className="mb-4">
                  <p className="text-2xl font-bold text-white">{selectedBook.title}</p>
                  <p className="text-gray-400">{selectedBook.author?.name || 'Unbekannter Autor'}</p>
                </div>

                {/* Compliance Badges */}
                <div className="flex gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedBook.is_pd_us ? 'bg-[#262626] text-white' : 'bg-[#0a0a0a] text-gray-500'
                  }`}>
                    {selectedBook.is_pd_us ? '✓' : '✗'} USA
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedBook.is_pd_eu ? 'bg-[#262626] text-white' : 'bg-[#0a0a0a] text-gray-500'
                  }`}>
                    {selectedBook.is_pd_eu ? '✓' : '✗'} EU
                  </span>
                </div>

                {/* CEFR & Publication Year */}
                <div className="flex gap-4 mb-4 text-sm">
                  {selectedBook.cefr_level && (
                    <span className="px-2 py-1 bg-[#262626] text-white rounded font-mono">
                      {selectedBook.cefr_level}
                    </span>
                  )}
                  {selectedBook.publication_year && (
                    <span className="px-2 py-1 bg-[#262626] text-white rounded">
                      {selectedBook.publication_year}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {selectedBook.tags && selectedBook.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedBook.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-[#262626] text-gray-300 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Placeholder Warning */}
                {selectedBook.content && selectedBook.content.startsWith('[PLACEHOLDER') && (
                  <div className="flex items-center gap-2 p-3 bg-[#1f1f1f] border border-[#262626] rounded-lg text-gray-300 text-sm">
                    <span>⚠️</span>
                    <span>Inhalt fehlt noch. Bitte Text hochladen.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Textdatei (.txt)
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#262626] rounded-lg
                         text-white focus:border-gray-400 focus:outline-none
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-400">
                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Title and Author fields (only in create mode) */}
          {mode === 'create' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Der Prozess"
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#262626] rounded-lg
                             text-white placeholder-gray-500 focus:border-gray-400 focus:outline-none
                             disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="z.B. Franz Kafka"
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#262626] rounded-lg
                             text-white placeholder-gray-500 focus:border-gray-400 focus:outline-none
                             disabled:opacity-50"
                />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          {processedChunks.length === 0 ? (
            <button
              onClick={handleProcess}
              disabled={
                isProcessing ||
                !file ||
                (mode === 'create' && (!title || !author)) ||
                (mode === 'update' && !selectedBookId)
              }
              className="flex-1 px-6 py-3 bg-white text-black font-semibold rounded-lg
                         disabled:bg-[#262626] disabled:text-gray-500 disabled:cursor-not-allowed
                         hover:bg-gray-200 transition-colors"
            >
              {isProcessing ? '⏳ Verarbeite...' : '🔍 Text Analysieren'}
            </button>
          ) : (
            <>
              <button
                onClick={handleImport}
                disabled={isProcessing || importResult !== null}
                className="flex-1 px-6 py-3 bg-white text-black font-semibold rounded-lg
                           disabled:bg-[#262626] disabled:text-gray-500 disabled:cursor-not-allowed
                           hover:bg-gray-200 transition-colors"
              >
                {isProcessing
                  ? '⏳ Importiere...'
                  : mode === 'update'
                    ? '🔄 Content Aktualisieren'
                    : '💾 In Datenbank Speichern'}
              </button>
              <button
                onClick={handleReset}
                disabled={isProcessing}
                className="px-6 py-3 border-2 border-[#262626] text-gray-300 font-semibold rounded-lg
                           hover:border-gray-400 hover:bg-[#1f1f1f] disabled:opacity-50
                           transition-colors"
              >
                🔄 Neu Starten
              </button>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mb-8">
            <div className="w-full bg-[#262626] rounded-full h-4 overflow-hidden">
              <div
                className="bg-white h-4 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-300 text-center">{statusMessage}</p>
          </div>
        )}

        {/* Status Message */}
        {!isProcessing && statusMessage && (
          <div className={`p-4 rounded-lg mb-8 ${
            statusMessage.startsWith('✅') ? 'bg-[#1f1f1f] border border-[#262626] text-white' :
            statusMessage.startsWith('❌') ? 'bg-[#1f1f1f] border border-[#262626] text-gray-300' :
            'bg-[#1f1f1f] border border-[#262626] text-gray-300'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Chunks Preview */}
        {processedChunks.length > 0 && !importResult && (
          <div className="border-2 border-[#262626] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              📊 Verarbeitete Chunks ({processedChunks.length})
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {processedChunks.slice(0, 5).map((chunk, idx) => (
                <div key={idx} className="bg-[#0a0a0a] border border-[#262626] p-4 rounded-lg text-sm">
                  <div className="font-semibold text-white mb-2">
                    {chunk.title} • Level {chunk.difficulty_level}/5
                  </div>
                  <div className="text-gray-300 mb-2 line-clamp-3">
                    {chunk.content}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>DD: {chunk.metrics.dependencyDistance.toFixed(2)}</span>
                    <span>A/V: {chunk.metrics.adjVerbRatio.toFixed(2)}</span>
                    <span>σ: {chunk.metrics.sentenceLengthVariance.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {processedChunks.length > 5 && (
                <p className="text-sm text-gray-400 text-center">
                  ... und {processedChunks.length - 5} weitere Chunks
                </p>
              )}
            </div>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="border-2 border-white bg-[#171717] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              ✅ Import Abgeschlossen
            </h2>
            <div className="space-y-2 text-gray-300">
              <p className="text-lg">
                <strong className="text-white">{importResult.success}</strong> Chunks erfolgreich importiert
              </p>
              {importResult.failed > 0 && (
                <p className="text-gray-400">
                  <strong>{importResult.failed}</strong> Chunks fehlgeschlagen
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Technical Info */}
      <div className="mt-8 p-6 bg-[#171717] border border-[#262626] text-gray-300 rounded-lg text-sm">
        <h3 className="font-semibold mb-2 text-white">🔬 Technische Details</h3>
        <ul className="space-y-1 list-disc list-inside text-gray-400">
          <li>Parser: UDPipe (WASM) für syntaktische Analyse</li>
          <li>Embeddings: Transformers.js (Xenova/all-MiniLM-L6-v2, ONNX)</li>
          <li>Metriken: Dependency Distance, Adj/Verb Ratio, Sentence Variance</li>
          <li>Chunking: 2-5 Sätze pro Lerneinheit (~50-125 Wörter)</li>
          <li>Schwierigkeitsgrad: Automatisch berechnet (1-5)</li>
        </ul>
        <p className="mt-4 text-gray-400 text-xs">
          ⚠️ Die Verarbeitung läuft komplett im Browser. Bei großen Büchern kann dies einige Minuten dauern.
        </p>
      </div>
    </div>
  )
}
