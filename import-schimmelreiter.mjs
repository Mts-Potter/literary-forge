import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const book = {
  id: 'storm_schimmelreiter',
  title: 'Der Schimmelreiter',
  author: {
    name: 'Storm, Theodor',
    death_year: 1888
  },
  language: 'de',
  publication_year: 1888,
  cefr_level: 'C1',
  source: {
    type: 'gutenberg',
    url: 'https://www.gutenberg.org/ebooks/74008',
    txt_download_url: 'https://www.gutenberg.org/ebooks/74008.txt.utf-8'
  },
  rights: {
    is_pd_us: true,
    is_pd_eu: true,
    verification_date: '2026-01-23',
    us_rationale: 'Published 1888 (before 1931)',
    eu_rationale: 'Author died 1888 (before 1956)'
  },
  tags: ['Novelle', 'Norddeutschland', 'Realismus']
}

console.log('📥 Downloading Der Schimmelreiter...')
const response = await fetch(book.source.txt_download_url)
if (!response.ok) {
  console.error('Download failed:', response.status, response.statusText)
  process.exit(1)
}

let text = await response.text()
console.log('✅ Downloaded', text.length, 'chars')

// Strip UTF-8 BOM
if (text.charCodeAt(0) === 0xFEFF) {
  text = text.slice(1)
}

// Remove Gutenberg header
const startMarkers = [
  /\*\*\* START OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i,
  /\*\*\* START OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/i
]

for (const marker of startMarkers) {
  const match = text.match(marker)
  if (match) {
    text = text.slice(match.index + match[0].length)
    console.log('✂️  Stripped Gutenberg header')
    break
  }
}

// Remove Gutenberg footer
const endMarkers = [
  /\*\*\* END OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i,
  /\*\*\* END OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/i
]

for (const marker of endMarkers) {
  const match = text.match(marker)
  if (match) {
    text = text.slice(0, match.index)
    console.log('✂️  Stripped Gutenberg footer')
    break
  }
}

// Normalize whitespace
text = text
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

console.log('🧹 Cleaned text:', text.length, 'chars')

// Create/lookup author
console.log('👤 Finding or creating author...')
const authorResult = await supabase
  .from('authors')
  .select('id')
  .ilike('name', book.author.name)
  .single()

let authorId
if (authorResult.data) {
  authorId = authorResult.data.id
  console.log('✅ Found existing author:', authorId)
} else {
  const insertResult = await supabase
    .from('authors')
    .insert({ name: book.author.name, death_year: book.author.death_year })
    .select('id')
    .single()
  
  if (insertResult.error) {
    console.error('Failed to create author:', insertResult.error)
    process.exit(1)
  }
  authorId = insertResult.data.id
  console.log('✅ Created author:', authorId)
}

// Split into chunks
function splitIntoChunks(text, targetSize) {
  const chunks = []
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if (currentChunk.length > 0 && (currentChunk.length + paragraph.length) > targetSize) {
      chunks.push(currentChunk.trim())
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph
    }

    if (currentChunk.length > targetSize * 2) {
      chunks.push(currentChunk.trim())
      currentChunk = ''
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks.filter(chunk => chunk.length >= 50)
}

const chunks = splitIntoChunks(text, 500)
console.log('✂️  Split into', chunks.length, 'chunks')

// Prepare chunk records
const chunkRecords = chunks.map((chunkText, index) => {
  const chunkTitle = chunks.length > 1
    ? book.title + ' (Teil ' + (index + 1) + ')'
    : book.title

  return {
    title: chunkTitle,
    author_id: authorId,
    content: chunkText,
    language: book.language,
    cefr_level: book.cefr_level,
    tags: book.tags,
    is_pd_us: book.rights.is_pd_us,
    is_pd_eu: book.rights.is_pd_eu,
    publication_year: book.publication_year,
    source_url: book.source.url
  }
})

// Insert chunks in batches
console.log('💾 Inserting chunks...')
const batchSize = 50
let inserted = 0

for (let i = 0; i < chunkRecords.length; i += batchSize) {
  const batch = chunkRecords.slice(i, i + batchSize)
  
  const insertResult = await supabase
    .from('source_texts')
    .insert(batch)
  
  if (insertResult.error) {
    console.error('Insert error at batch', i, ':', insertResult.error)
    process.exit(1)
  }
  
  inserted += batch.length
  console.log('Inserted', inserted, '/', chunkRecords.length)
}

console.log('✅ Successfully imported', inserted, 'chunks for Der Schimmelreiter')
