# Phase 3: UPDATE Mode Implementation Guide

## ✅ Was wurde implementiert?

### 1. Backend: `updateExistingBook()` Function
**Datei**: [lib/ingest/book-processor.ts](lib/ingest/book-processor.ts:260-370)

Die neue Funktion ermöglicht das Aktualisieren von Büchern, die bereits Metadaten haben:

**Features**:
- Löscht alte Placeholder-Chunks
- Erstellt neue Chunks mit prozessiertem Content
- **BEWAHRT** alle Seed-Metadaten:
  - `author_id`, `is_pd_us`, `is_pd_eu`, `rights_details`
  - `cefr_level`, `lexile_score`, `estimated_reading_time_minutes`
  - `publication_year`, `tags`, `source_url`
- Nutzt Batch-Insert mit Fallback (wie CREATE mode)

### 2. Frontend: Enhanced BookIngestionUI (BEREIT ZUM ERSETZEN)

Die neue UI ist fertig programmiert und wartet auf deine manuelle Integration.

**Location**: Siehe Code-Block unten → ersetze damit [components/admin/BookIngestionUI.tsx](components/admin/BookIngestionUI.tsx)

---

## 📋 Installationsanleitung

### Schritt 1: Ersetze die UI-Komponente

Kopiere den kompletten Code aus dem Abschnitt "**Vollständiger Code**" unten und ersetze damit den Inhalt von:
```
components/admin/BookIngestionUI.tsx
```

### Schritt 2: Teste die Integration

1. Starte Dev-Server:
   ```bash
   cd ~/literary-forge
   npm run dev
   ```

2. Öffne [http://localhost:3000/admin/ingest](http://localhost:3000/admin/ingest)

3. **Erwartetes Verhalten**:
   - Dropdown zeigt "➕ Neues Buch erstellen"
   - Darunter: "📖 Existierende Bücher (Content Update)" mit deinen 3 Seed-Büchern
   - Wähle "Die Verwandlung - Kafka, Franz"
   - → Metadata Preview Card erscheint mit:
     - ✅ Safe (US/EU) Badges
     - Tags: Novelle, Existenzialismus, Kafka, Klassiker, Moderne
     - CEFR: B2, Jahr: 1915, Lesezeit: 90 Min

### Schritt 3: Test-Import

1. Wähle "Die Verwandlung" im Dropdown
2. Lade eine `.txt` Datei hoch (z.B. `test-books/kafka-die-verwandlung-excerpt.txt`)
3. Klicke "🔍 Text Analysieren"
4. Klicke "🔄 Content Aktualisieren"
5. **Verifiziere in Supabase**:
   ```sql
   SELECT title, author_id, cefr_level, tags, is_pd_us, is_pd_eu
   FROM source_texts
   WHERE title LIKE 'Die Verwandlung%'
   LIMIT 5;
   ```
   **Erwartung**: Die Chunks haben die Seed-Metadaten beibehalten!

---

## 🎨 UI Features im Detail

### Feature 1: Book Selection Dropdown
```tsx
<select value={selectedBook?.id || 'create-new'}>
  <option value="create-new">➕ Neues Buch erstellen</option>
  <optgroup label="📖 Existierende Bücher">
    {existingBooks.map(book => (
      <option key={book.id} value={book.id}>
        {book.title} - {book.author_info?.name}
      </option>
    ))}
  </optgroup>
</select>
```

**Query-Logik**:
```typescript
const { data: books } = await supabase
  .from('source_texts')
  .select('*, author_info:authors(*)')
  .or('content.like.[PLACEHOLDER%],content.eq.')
  .limit(50)
```
→ Findet nur Bücher mit Placeholder-Content oder leerem Content

### Feature 2: Metadata Preview Card

Erscheint nur im UPDATE mode, zeigt:
- **Compliance Badges**: ✓ USA, ✓ EU (grün/rot je nach Status)
- **Pädagogische Daten**: CEFR, Jahr, Lesezeit
- **Tags**: Als schicke Pills
- **Hinweis**: "Diese Metadaten bleiben beim Update erhalten"

**CSS Highlight**:
```tsx
className="border-2 border-purple-200 bg-purple-50 rounded-lg p-6"
```
→ Visuell unterscheidbar von CREATE mode

### Feature 3: Conditional Form Fields

```typescript
{mode === 'create' && (
  <>
    <input placeholder="Titel" />
    <input placeholder="Autor" />
  </>
)}
```
→ Im UPDATE mode sind Titel/Autor vorausgefüllt und nicht editierbar

### Feature 4: Smart Button Text

```tsx
{mode === 'update' ? '🔄 Content Aktualisieren' : '💾 Speichern'}
```

---

## 🔧 Technische Details

### Update-Flow Diagramm

```
1. User wählt "Die Verwandlung" im Dropdown
   ↓
2. `handleBookSelect()` lädt Metadaten
   → `setSelectedBook(book)`
   → `setMode('update')`
   ↓
3. Metadata Preview Card wird angezeigt
   ↓
4. User lädt .txt Datei hoch
   ↓
5. `handleProcess()` prozessiert Text
   → UDPipe + Embeddings
   → Chunks mit neuen Metriken
   ↓
6. `handleImport()` ruft `updateExistingBook()` auf
   → Löscht alte Chunks
   → Fügt neue Chunks ein MIT SEED-METADATEN
   ↓
7. ✅ Import abgeschlossen
```

### Preserved Metadata Mapping

| Seed-Feld | Wird bewahrt? | Quelle |
|-----------|---------------|--------|
| `author_id` | ✅ Ja | Seed (authors table) |
| `is_pd_us`, `is_pd_eu` | ✅ Ja | Seed (004_seed_test_books.sql) |
| `rights_details` | ✅ Ja | Seed (JSONB) |
| `cefr_level` | ✅ Ja | Seed (CHECK constraint) |
| `tags` | ✅ Ja | Seed (TEXT[] array) |
| `content` | ❌ Nein | NLP Pipeline (ersetzt Placeholder) |
| `metrics` | ❌ Nein | NLP Pipeline (neu berechnet) |
| `embedding` | ❌ Nein | NLP Pipeline (Transformers.js) |
| `difficulty_level` | ❌ Nein | NLP Pipeline (Heuristik) |

---

## 📊 Query-Beispiele für Verifikation

### Prüfe, ob Seed-Metadaten erhalten blieben
```sql
SELECT
  st.title,
  a.name AS author_name,
  st.is_pd_us,
  st.is_pd_eu,
  st.cefr_level,
  st.tags,
  st.publication_year,
  st.rights_details->>'edge_case_notes' AS notes
FROM source_texts st
JOIN authors a ON st.author_id = a.id
WHERE st.title LIKE 'Die Verwandlung%'
LIMIT 5;
```

**Erwartetes Ergebnis**:
```
title                        | author_name  | is_pd_us | is_pd_eu | cefr_level | tags                                      | publication_year | notes
-----------------------------|--------------|----------|----------|------------|-------------------------------------------|------------------|-------
Die Verwandlung (Teil 1)     | Kafka, Franz | true     | true     | B2         | {Novelle,Existenzialismus,Kafka,...}     | 1915             | NULL
Die Verwandlung (Teil 2)     | Kafka, Franz | true     | true     | B2         | {Novelle,Existenzialismus,Kafka,...}     | 1915             | NULL
```

### Prüfe, ob neue Metriken berechnet wurden
```sql
SELECT
  title,
  difficulty_level,
  metrics->>'dependencyDistance' AS dd,
  metrics->>'adjVerbRatio' AS avr,
  LENGTH(content) AS content_length
FROM source_texts
WHERE title LIKE 'Die Verwandlung%'
LIMIT 5;
```

**Erwartetes Ergebnis**:
```
title                    | difficulty_level | dd    | avr   | content_length
-------------------------|------------------|-------|-------|---------------
Die Verwandlung (Teil 1) | 4                | 3.45  | 0.82  | 1250
Die Verwandlung (Teil 2) | 5                | 4.12  | 0.95  | 1180
```
→ Metriken sind **nicht** aus Seed, sondern frisch berechnet ✅

---

## 🚨 Troubleshooting

### Problem 1: Dropdown bleibt leer

**Symptom**: Keine Bücher erscheinen unter "Existierende Bücher"

**Ursache**: Seed-Script wurde noch nicht ausgeführt oder Query findet keine Placeholder

**Lösung**:
```sql
-- Prüfe, ob Seed-Bücher existieren
SELECT id, title, LEFT(content, 50) as content_preview
FROM source_texts
WHERE content LIKE '[PLACEHOLDER%';

-- Falls leer: Führe 004_seed_test_books.sql aus
```

### Problem 2: Metadata Preview zeigt "Unbekannt"

**Symptom**: Autor wird als "Unbekannt" angezeigt

**Ursache**: JOIN mit `authors` table schlägt fehl

**Lösung**:
```sql
-- Prüfe Author-Verknüpfung
SELECT st.title, st.author_id, a.name
FROM source_texts st
LEFT JOIN authors a ON st.author_id = a.id
WHERE st.title = 'Die Verwandlung';

-- Falls author_id NULL: Re-run Seed-Script
```

### Problem 3: "permission denied for table source_texts"

**Symptom**: Update schlägt mit RLS-Fehler fehl

**Ursache**: Du bist kein Admin (002_admin_rls_policy.sql)

**Lösung**:
```sql
-- Prüfe Admin-Status
SELECT is_admin();

-- Falls false:
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'DEINE_EMAIL@example.com';
```

### Problem 4: Alte Chunks werden nicht gelöscht

**Symptom**: Nach Update existieren doppelte Einträge

**Ursache**: DELETE Query in `updateExistingBook()` schlägt fehl

**Debug**:
```typescript
// In book-processor.ts, Zeile 274-286
// Füge Logging hinzu:
console.log('Lösche alte Chunks für:', existingMetadata.title)
```

**Manuelle Bereinigung**:
```sql
DELETE FROM source_texts
WHERE title LIKE 'Die Verwandlung%'
AND author_id = '550e8400-e29b-41d4-a716-446655440001';
```

---

## 📚 Vollständiger Code

### `components/admin/BookIngestionUI.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { processBook, saveChunksToSupabase, updateExistingBook, BookChunk } from '@/lib/ingest/book-processor'
import type { SourceText, Author } from '@/lib/supabase/types'

type BookWithAuthor = SourceText & {
  author_info?: Author
}

type ImportMode = 'create' | 'update'

export function BookIngestionUI() {
  const [mode, setMode] = useState<ImportMode>('create')
  const [existingBooks, setExistingBooks] = useState<BookWithAuthor[]>([])
  const [selectedBook, setSelectedBook] = useState<BookWithAuthor | null>(null)
  const [isLoadingBooks, setIsLoadingBooks] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [processedChunks, setProcessedChunks] = useState<BookChunk[]>([])
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  // Load existing books on mount
  useEffect(() => {
    loadExistingBooks()
  }, [])

  const loadExistingBooks = async () => {
    setIsLoadingBooks(true)
    try {
      const supabase = createClient()

      // Fetch books with placeholder content
      const { data: books, error } = await supabase
        .from('source_texts')
        .select(`
          *,
          author_info:authors(*)
        `)
        .or('content.like.[PLACEHOLDER%],content.eq.')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Deduplicate by title (show only unique books, not individual chunks)
      const uniqueBooks = books?.filter((book, idx, arr) =>
        arr.findIndex(b => b.title === book.title) === idx
      ) || []

      setExistingBooks(uniqueBooks)
    } catch (error: any) {
      console.error('Fehler beim Laden der Bücher:', error)
      setStatusMessage(`❌ Fehler beim Laden: ${error.message}`)
    } finally {
      setIsLoadingBooks(false)
    }
  }

  const handleBookSelect = (bookId: string) => {
    if (bookId === 'create-new') {
      setMode('create')
      setSelectedBook(null)
      setTitle('')
      setAuthor('')
    } else {
      const book = existingBooks.find(b => b.id === bookId)
      if (book) {
        setMode('update')
        setSelectedBook(book)
        setTitle(book.title)
        setAuthor(book.author_info?.name || book.author || '')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/plain') {
      setFile(selectedFile)
      // Auto-fill title from filename ONLY in create mode
      if (mode === 'create' && !title) {
        setTitle(selectedFile.name.replace('.txt', ''))
      }
    } else {
      alert('Bitte wähle eine .txt Datei')
    }
  }

  const handleProcess = async () => {
    if (!file) {
      alert('Bitte wähle eine Datei aus')
      return
    }

    if (mode === 'create' && (!title || !author)) {
      alert('Bitte fülle Titel und Autor aus')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setStatusMessage('Lese Datei...')
    setProcessedChunks([])
    setImportResult(null)

    try {
      const text = await file.text()

      const chunks = await processBook(
        text,
        title,
        author,
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
      let result: { success: number; failed: number }

      if (mode === 'update' && selectedBook) {
        result = await updateExistingBook(
          selectedBook.id,
          processedChunks,
          selectedBook,
          supabase,
          (percent, message) => {
            setProgress(percent)
            setStatusMessage(message)
          }
        )
      } else {
        result = await saveChunksToSupabase(
          processedChunks,
          supabase,
          (percent, message) => {
            setProgress(percent)
            setStatusMessage(message)
          }
        )
      }

      setImportResult(result)
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
    setMode('create')
    setSelectedBook(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          📚 Book Ingestion System
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Importiert .txt Dateien mit wissenschaftlich konsistenten Metriken (UDPipe + Transformers.js)
        </p>

        {/* Book Selection Dropdown */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Buch auswählen
          </label>
          <select
            value={selectedBook?.id || 'create-new'}
            onChange={(e) => handleBookSelect(e.target.value)}
            disabled={isProcessing || isLoadingBooks}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                       focus:border-blue-500 focus:outline-none
                       disabled:bg-gray-100 disabled:cursor-not-allowed
                       text-base"
          >
            <option value="create-new">➕ Neues Buch erstellen</option>
            {existingBooks.length > 0 && (
              <optgroup label="📖 Existierende Bücher (Content Update)">
                {existingBooks.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author_info?.name || book.author || 'Unbekannt'}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Metadata Preview Card */}
        {mode === 'update' && selectedBook && (
          <div className="mb-8 border-2 border-purple-200 bg-purple-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">
              📋 Metadaten-Vorschau
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Titel</p>
                <p className="text-base text-purple-900">{selectedBook.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Autor</p>
                <p className="text-base text-purple-900">
                  {selectedBook.author_info?.name || selectedBook.author || 'Unbekannt'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase mb-1">CEFR</p>
                <p className="text-base text-purple-900">{selectedBook.cefr_level || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Jahr</p>
                <p className="text-base text-purple-900">{selectedBook.publication_year || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Lesezeit</p>
                <p className="text-base text-purple-900">
                  {selectedBook.estimated_reading_time_minutes ? `${selectedBook.estimated_reading_time_minutes} Min` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Rechtsstatus</p>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedBook.is_pd_us ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedBook.is_pd_us ? '✓' : '✗'} USA
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedBook.is_pd_eu ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedBook.is_pd_eu ? '✓' : '✗'} EU
                </span>
              </div>
            </div>

            {selectedBook.tags && selectedBook.tags.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBook.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-purple-100 rounded-lg">
              <p className="text-xs text-purple-800">
                <strong>ℹ️ Hinweis:</strong> Diese Metadaten bleiben beim Update erhalten.
              </p>
            </div>
          </div>
        )}

        {/* File Input */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Textdatei (.txt)
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg
                         focus:border-blue-500 focus:outline-none
                         disabled:bg-gray-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {mode === 'create' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Der Prozess"
                  disabled={isProcessing}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg
                             focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Autor</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="z.B. Franz Kafka"
                  disabled={isProcessing}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg
                             focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                />
              </div>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mb-8">
          {processedChunks.length === 0 ? (
            <button
              onClick={handleProcess}
              disabled={isProcessing || !file || (mode === 'create' && (!title || !author))}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg
                         hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? '⏳ Verarbeite...' : '🔍 Text Analysieren'}
            </button>
          ) : (
            <>
              <button
                onClick={handleImport}
                disabled={isProcessing || importResult !== null}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg
                           hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isProcessing ? '⏳ Importiere...' : mode === 'update' ? '🔄 Content Aktualisieren' : '💾 Speichern'}
              </button>
              <button
                onClick={handleReset}
                disabled={isProcessing}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg
                           hover:border-gray-400 disabled:opacity-50"
              >
                🔄 Neu
              </button>
            </>
          )}
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-blue-600 h-4 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-sm text-gray-700 text-center">{statusMessage}</p>
          </div>
        )}

        {!isProcessing && statusMessage && (
          <div className={`p-4 rounded-lg mb-8 ${
            statusMessage.startsWith('✅') ? 'bg-green-50 text-green-800' :
            statusMessage.startsWith('❌') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Preview */}
        {processedChunks.length > 0 && !importResult && (
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              📊 Chunks ({processedChunks.length})
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {processedChunks.slice(0, 5).map((chunk, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg text-sm">
                  <div className="font-semibold text-gray-900 mb-2">
                    {chunk.title} • Level {chunk.difficulty_level}/5
                  </div>
                  <div className="text-gray-700 mb-2 line-clamp-3">{chunk.content}</div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>DD: {chunk.metrics.dependencyDistance.toFixed(2)}</span>
                    <span>A/V: {chunk.metrics.adjVerbRatio.toFixed(2)}</span>
                    <span>σ: {chunk.metrics.sentenceLengthVariance.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {importResult && (
          <div className="border-2 border-green-500 bg-green-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-900">✅ Abgeschlossen</h2>
            <p className="text-lg text-green-800">
              <strong>{importResult.success}</strong> Chunks {mode === 'update' ? 'aktualisiert' : 'importiert'}
            </p>
            {importResult.failed > 0 && (
              <p className="text-orange-700 mt-2">
                <strong>{importResult.failed}</strong> fehlgeschlagen
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-gray-800 text-gray-300 rounded-lg text-sm">
        <h3 className="font-semibold mb-2 text-white">🔬 Technische Details</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li>Parser: UDPipe (WASM)</li>
          <li>Embeddings: Transformers.js (all-MiniLM-L6-v2)</li>
          <li>Metriken: DD, A/V Ratio, Sentence Variance</li>
          {mode === 'update' && (
            <li className="text-purple-400"><strong>UPDATE MODE:</strong> Metadaten bleiben erhalten</li>
          )}
        </ul>
      </div>
    </div>
  )
}
```

---

## ✅ Checkliste für erfolgreichen Test

- [ ] Migrations 003 & 004 im Supabase SQL Editor ausgeführt
- [ ] UI-Code in `components/admin/BookIngestionUI.tsx` ersetzt
- [ ] Dev-Server gestartet (`npm run dev`)
- [ ] `/admin/ingest` aufgerufen
- [ ] Dropdown zeigt 3 Seed-Bücher an
- [ ] "Die Verwandlung" ausgewählt
- [ ] Metadata Preview Card erscheint mit Badges
- [ ] `.txt` Datei hochgeladen
- [ ] "Text Analysieren" erfolgreich
- [ ] "Content Aktualisieren" erfolgreich
- [ ] In Supabase verifiziert: Chunks haben Seed-Metadaten

---

**Status**: Phase 3 komplett implementiert! 🚀
**Bereit für**: Manuelle UI-Integration & Ende-zu-Ende Test
