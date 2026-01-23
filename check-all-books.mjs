import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking ALL books in database\n')

// Get list of all unique books by selecting distinct base titles
const { data: allBooks, error } = await supabase
  .from('source_texts')
  .select('title, language, author:authors(name)')
  .order('title')

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

// Extract unique book titles
const bookMap = new Map()
for (const item of allBooks) {
  const baseTitle = item.title.replace(/ \(Teil \d+\)$/, '')
  if (!bookMap.has(baseTitle)) {
    bookMap.set(baseTitle, {
      language: item.language,
      author: item.author?.name || 'Unknown',
      firstChunkTitle: item.title
    })
  }
}

console.log('Found', bookMap.size, 'unique books:\n')

const issues = []
let bookNum = 0

for (const [bookTitle, info] of bookMap.entries()) {
  bookNum++
  console.log(bookNum + '.', bookTitle, '(' + info.author + ', ' + info.language + ')')
  
  // Get first chunk
  const { data: firstChunk } = await supabase
    .from('source_texts')
    .select('content, language')
    .eq('title', info.firstChunkTitle)
    .single()

  if (!firstChunk) {
    console.log('   ❌ ERROR: Cannot read first chunk')
    continue
  }

  const preview = firstChunk.content.substring(0, 150).replace(/\n/g, ' ')
  console.log('   Preview:', preview + '...')

  // Check for issues
  const checks = [
    { pattern: /PREFACE|INTRODUCTION|FOREWORD/i, name: 'Contains preface/intro' },
    { pattern: /TABLE OF CONTENTS|CONTENTS:|CHAPTER I\.|CHAPTER II\./i, name: 'Contains TOC' },
    { pattern: /\*\*\* START OF|END OF.*GUTENBERG/i, name: 'Gutenberg header' },
    { pattern: /Produced by|Transcribed by/i, name: 'Gutenberg metadata' }
  ]

  for (const check of checks) {
    if (check.pattern.test(firstChunk.content)) {
      console.log('   ⚠️ ', check.name)
      issues.push({ book: bookTitle, issue: check.name })
    }
  }

  // Language check
  if (firstChunk.language === 'de') {
    const englishWords = (firstChunk.content.match(/\b(the|and|is|was|are|were|have|has|been|with|from|that|this|which)\b/gi) || []).length
    const germanWords = (firstChunk.content.match(/\b(und|der|die|das|ist|sein|haben|werden|mit|von|dass|diese|welche)\b/gi) || []).length
    
    if (englishWords > germanWords * 1.5) {
      console.log('   🚨 CRITICAL: Marked as German but contains ENGLISH text!')
      issues.push({ book: bookTitle, issue: 'WRONG LANGUAGE: Marked DE but is EN', critical: true })
    }
  } else if (firstChunk.language === 'en') {
    const englishWords = (firstChunk.content.match(/\b(the|and|is|was|are|were|have|has|been|with|from)\b/gi) || []).length
    const germanWords = (firstChunk.content.match(/\b(und|der|die|das|ist|sein|haben|werden|mit|von)\b/gi) || []).length
    
    if (germanWords > englishWords) {
      console.log('   🚨 CRITICAL: Marked as English but contains GERMAN text!')
      issues.push({ book: bookTitle, issue: 'WRONG LANGUAGE: Marked EN but is DE', critical: true })
    }
  }

  console.log()
}

// Summary
console.log('\n' + '='.repeat(80))
console.log('SUMMARY')
console.log('='.repeat(80))
console.log('Books checked:', bookMap.size)
console.log('Issues found:', issues.length)

if (issues.length > 0) {
  console.log('\n⚠️  ISSUES:\n')
  
  // Critical issues first
  const critical = issues.filter(i => i.critical)
  const normal = issues.filter(i => !i.critical)
  
  if (critical.length > 0) {
    console.log('🚨 CRITICAL (Wrong content/language):')
    for (const issue of critical) {
      console.log('   •', issue.book, '→', issue.issue)
    }
    console.log()
  }
  
  if (normal.length > 0) {
    console.log('⚠️  Minor (Preface/TOC):')
    for (const issue of normal) {
      console.log('   •', issue.book, '→', issue.issue)
    }
  }
}

console.log('\n' + '='.repeat(80))
