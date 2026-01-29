import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const books = [
  {
    id: 'kafka_verwandlung',
    title: 'Die Verwandlung',
    author: { name: 'Kafka, Franz', death_year: 1924 },
    language: 'de',
    publication_year: 1915,
    cefr_level: 'B2',
    source: {
      type: 'gutenberg',
      url: 'https://www.gutenberg.org/ebooks/22367',
      txt_download_url: 'https://www.gutenberg.org/ebooks/22367.txt.utf-8'
    },
    rights: {
      is_pd_us: true,
      is_pd_eu: true,
      verification_date: '2026-01-23',
      us_rationale: 'Published 1915 (before 1931)',
      eu_rationale: 'Author died 1924 (before 1956)'
    },
    tags: ['Moderne', 'Existentialismus', 'Novelle']
  },
  {
    id: 'mann_buddenbrooks',
    title: 'Buddenbrooks',
    author: { name: 'Mann, Thomas', death_year: 1955 },
    language: 'de',
    publication_year: 1901,
    cefr_level: 'C1',
    source: {
      type: 'gutenberg',
      url: 'https://www.gutenberg.org/ebooks/34811',
      txt_download_url: 'https://www.gutenberg.org/ebooks/34811.txt.utf-8'
    },
    rights: {
      is_pd_us: true,
      is_pd_eu: true,
      verification_date: '2026-01-23',
      us_rationale: 'Published 1901 (before 1931)',
      eu_rationale: 'Author died 1955 → PD since Jan 1, 2026'
    },
    tags: ['Moderne', 'Literaturnobelpreis', 'Familienroman']
  },
  {
    id: 'goethe_werther',
    title: 'Die Leiden des jungen Werther',
    author: { name: 'Goethe, Johann Wolfgang von', death_year: 1832 },
    language: 'de',
    publication_year: 1774,
    cefr_level: 'C1',
    source: {
      type: 'gutenberg',
      url: 'https://www.gutenberg.org/ebooks/2407',
      txt_download_url: 'https://www.gutenberg.org/ebooks/2407.txt.utf-8'
    },
    rights: {
      is_pd_us: true,
      is_pd_eu: true,
      verification_date: '2026-01-23',
      us_rationale: 'Published 1774 (before 1931)',
      eu_rationale: 'Author died 1832 (before 1956)'
    },
    tags: ['Sturm und Drang', 'Briefroman', 'Klassik']
  },
  {
    id: 'kafka_prozess',
    title: 'Der Prozess',
    author: { name: 'Kafka, Franz', death_year: 1924 },
    language: 'de',
    publication_year: 1925,
    cefr_level: 'C1',
    source: {
      type: 'gutenberg',
      url: 'https://www.gutenberg.org/ebooks/69327',
      txt_download_url: 'https://www.gutenberg.org/ebooks/69327.txt.utf-8'
    },
    rights: {
      is_pd_us: true,
      is_pd_eu: true,
      verification_date: '2026-01-23',
      us_rationale: 'Published 1925 (before 1931)',
      eu_rationale: 'Author died 1924 (before 1956)'
    },
    tags: ['Moderne', 'Existentialismus', 'Roman']
  }
]

console.log('📥 IMPORTING 4 GERMAN ORIGINAL TEXTS\n')
console.log('These replace the English translations that were deleted.\n')
console.log('=' .repeat(80))

const results = []

for (const book of books) {
  console.log('\n📖', book.title)
  console.log('   Author:', book.author.name)
  console.log('   Source:', book.source.url)
  
  try {
    // Download
    console.log('   📥 Downloading...')
    const response = await fetch(book.source.txt_download_url)
    if (!response.ok) {
      throw new Error('Download failed: ' + response.status)
    }
    
    let text = await response.text()
    console.log('   ✅ Downloaded', text.length, 'chars')
    
    // Clean text
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1)
    }
    
    // Remove Gutenberg header/footer
    const startMarkers = [
      /\*\*\* START OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i,
      /\*\*\* START OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/i
    ]
    for (const marker of startMarkers) {
      const match = text.match(marker)
      if (match) {
        text = text.slice(match.index + match[0].length)
        break
      }
    }
    
    const endMarkers = [
      /\*\*\* END OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i,
      /\*\*\* END OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/i
    ]
    for (const marker of endMarkers) {
      const match = text.match(marker)
      if (match) {
        text = text.slice(0, match.index)
        break
      }
    }
    
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    console.log('   🧹 Cleaned:', text.length, 'chars')
    
    // Get/create author
    let authorResult = await supabase
      .from('authors')
      .select('id')
      .ilike('name', book.author.name)
      .single()
    
    let authorId
    if (authorResult.data) {
      authorId = authorResult.data.id
    } else {
      const insertResult = await supabase
        .from('authors')
        .insert({ name: book.author.name, death_year: book.author.death_year })
        .select('id')
        .single()
      
      if (insertResult.error) throw insertResult.error
      authorId = insertResult.data.id
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
    console.log('   ✂️  Split into', chunks.length, 'chunks')
    
    // Prepare records
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
    
    // Insert in batches
    console.log('   💾 Inserting into database...')
    const batchSize = 50
    let inserted = 0
    
    for (let i = 0; i < chunkRecords.length; i += batchSize) {
      const batch = chunkRecords.slice(i, i + batchSize)
      const { error } = await supabase.from('source_texts').insert(batch)
      if (error) throw error
      inserted += batch.length
      console.log('      [' + inserted + '/' + chunkRecords.length + ']')
    }
    
    console.log('   ✅ SUCCESS:', inserted, 'chunks imported')
    results.push({ book: book.title, success: true, chunks: inserted })
    
  } catch (error) {
    console.error('   ❌ FAILED:', error.message)
    results.push({ book: book.title, success: false, error: error.message })
  }
}

// Summary
console.log('\n\n' + '=' .repeat(80))
console.log('IMPORT SUMMARY')
console.log('=' .repeat(80))

const successful = results.filter(r => r.success)
const failed = results.filter(r => !r.success)

console.log('Successful:', successful.length + '/' + books.length)
for (const result of successful) {
  console.log('  ✅', result.book, '-', result.chunks, 'chunks')
}

if (failed.length > 0) {
  console.log('\nFailed:', failed.length)
  for (const result of failed) {
    console.log('  ❌', result.book, '→', result.error)
  }
}

const totalChunks = successful.reduce((sum, r) => sum + r.chunks, 0)
console.log('\nTotal chunks imported:', totalChunks)
console.log('All books are GERMAN ORIGINALS (public domain compliant) ✅')
