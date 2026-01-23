import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 COMPREHENSIVE BOOK VALIDATION CHECK\n')
console.log('=' .repeat(80))

// Get all unique book titles
const { data: allChunks } = await supabase
  .from('source_texts')
  .select('title, language, author:authors(name)')
  .order('title', { ascending: true })

if (!allChunks || allChunks.length === 0) {
  console.log('❌ No chunks found in database')
  process.exit(1)
}

// Extract base titles (remove " (Teil X)")
const bookTitles = new Map()
for (const chunk of allChunks) {
  const baseTitle = chunk.title.replace(/ \(Teil \d+\)$/, '')
  if (!bookTitles.has(baseTitle)) {
    bookTitles.set(baseTitle, {
      language: chunk.language,
      author: chunk.author?.name || 'Unknown'
    })
  }
}

console.log('Found', bookTitles.size, 'unique books\n')

const issues = []

// Check each book
for (const [bookTitle, bookInfo] of bookTitles.entries()) {
  console.log('\n' + '='.repeat(80))
  console.log('📖', bookTitle)
  console.log('   Author:', bookInfo.author, '| Language:', bookInfo.language)
  console.log('='.repeat(80))

  // Get first 3 chunks
  const { data: firstChunks } = await supabase
    .from('source_texts')
    .select('id, title, content, language')
    .like('title', bookTitle + '%')
    .order('title', { ascending: true })
    .limit(3)

  if (!firstChunks || firstChunks.length === 0) {
    console.log('❌ ERROR: No chunks found for this book')
    issues.push({ book: bookTitle, issue: 'No chunks found' })
    continue
  }

  console.log('\n🔎 FIRST 3 CHUNKS:')
  for (let i = 0; i < firstChunks.length; i++) {
    const chunk = firstChunks[i]
    const preview = chunk.content.substring(0, 200).replace(/\n/g, ' ')
    
    console.log('\n' + (i + 1) + '. ' + chunk.title)
    console.log('   Language: ' + chunk.language + ' | Length: ' + chunk.content.length + ' chars')
    console.log('   Preview: ' + preview + '...')

    // Check for suspicious patterns
    const suspiciousPatterns = [
      { pattern: /\*\*\* START OF|END OF.*PROJECT GUTENBERG/i, name: 'Gutenberg header/footer' },
      { pattern: /^(Preface|Introduction|Foreword|Acknowledgments|Acknowledgements)/im, name: 'Preface/intro' },
      { pattern: /^(CONTENTS|TABLE OF CONTENTS|CHAPTER)/im, name: 'Table of contents' },
      { pattern: /^(I|II|III|IV|V|VI|VII|VIII|IX|X)\s+[A-Z\s]{10,}/m, name: 'Roman numeral TOC' },
      { pattern: /Produced by|Transcribed by|E-text prepared/i, name: 'Gutenberg metadata' },
      { pattern: /^[\d\s.]+$/m, name: 'Page numbers only' },
    ]

    for (const { pattern, name } of suspiciousPatterns) {
      if (pattern.test(chunk.content)) {
        console.log('   ⚠️  WARNING: Contains', name)
        issues.push({
          book: bookTitle,
          chunk: chunk.title,
          issue: 'Contains ' + name,
          preview: preview
        })
      }
    }

    // Check language consistency
    if (chunk.language === 'de') {
      // Should have German words
      const germanWords = /\b(und|der|die|das|ist|sein|haben|werden|können|mit|von)\b/i
      const englishWords = /\b(the|and|is|was|are|were|have|has|been|with|from)\b/i
      
      const germanMatches = (chunk.content.match(germanWords) || []).length
      const englishMatches = (chunk.content.match(englishWords) || []).length

      if (englishMatches > germanMatches * 2) {
        console.log('   ⚠️  WARNING: Marked as German but contains mostly English words')
        issues.push({
          book: bookTitle,
          chunk: chunk.title,
          issue: 'Language mismatch (marked DE but contains EN)',
          preview: preview
        })
      }
    } else if (chunk.language === 'en') {
      // Should have English words
      const germanWords = /\b(und|der|die|das|ist|sein|haben|werden|können|mit|von)\b/i
      const englishWords = /\b(the|and|is|was|are|were|have|has|been|with|from)\b/i
      
      const germanMatches = (chunk.content.match(germanWords) || []).length
      const englishMatches = (chunk.content.match(englishWords) || []).length

      if (germanMatches > englishMatches) {
        console.log('   ⚠️  WARNING: Marked as English but contains German words')
        issues.push({
          book: bookTitle,
          chunk: chunk.title,
          issue: 'Language mismatch (marked EN but contains DE)',
          preview: preview
        })
      }
    }

    // Check if chunk is too short
    if (chunk.content.length < 100) {
      console.log('   ⚠️  WARNING: Very short chunk (<100 chars)')
      issues.push({
        book: bookTitle,
        chunk: chunk.title,
        issue: 'Too short (<100 chars)',
        preview: chunk.content
      })
    }
  }

  // Get last 3 chunks
  const { data: lastChunks } = await supabase
    .from('source_texts')
    .select('id, title, content')
    .like('title', bookTitle + '%')
    .order('title', { ascending: false })
    .limit(3)

  if (lastChunks && lastChunks.length > 0) {
    console.log('\n🔎 LAST 3 CHUNKS:')
    for (let i = 0; i < Math.min(lastChunks.length, 3); i++) {
      const chunk = lastChunks[i]
      const preview = chunk.content.substring(0, 200).replace(/\n/g, ' ')
      
      console.log('\n' + chunk.title)
      console.log('   Length: ' + chunk.content.length + ' chars')
      console.log('   Preview: ' + preview + '...')

      // Check for Gutenberg footer
      if (/\*\*\* END OF|Project Gutenberg|Transcribed/i.test(chunk.content)) {
        console.log('   ⚠️  WARNING: Contains Gutenberg footer or metadata')
        issues.push({
          book: bookTitle,
          chunk: chunk.title,
          issue: 'Contains Gutenberg footer',
          preview: preview
        })
      }
    }
  }

  // Get total count
  const { count } = await supabase
    .from('source_texts')
    .select('*', { count: 'exact', head: true })
    .like('title', bookTitle + '%')

  console.log('\n✅ Total chunks for this book:', count)
}

// Summary
console.log('\n\n' + '='.repeat(80))
console.log('📊 SUMMARY')
console.log('='.repeat(80))
console.log('Total books checked:', bookTitles.size)
console.log('Total issues found:', issues.length)

if (issues.length > 0) {
  console.log('\n⚠️  ISSUES FOUND:')
  
  // Group by book
  const issuesByBook = new Map()
  for (const issue of issues) {
    if (!issuesByBook.has(issue.book)) {
      issuesByBook.set(issue.book, [])
    }
    issuesByBook.get(issue.book).push(issue)
  }

  for (const [book, bookIssues] of issuesByBook.entries()) {
    console.log('\n📕', book, '(' + bookIssues.length + ' issues)')
    for (const issue of bookIssues) {
      console.log('   •', issue.chunk || 'General:', issue.issue)
    }
  }
} else {
  console.log('\n✅ No issues found! All books look clean.')
}

console.log('\n' + '='.repeat(80))
