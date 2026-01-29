import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const booksToCheck = [
  { title: 'The Great Gatsby', expectedLang: 'en' },
  { title: 'Die Verwandlung', expectedLang: 'de' },
  { title: 'The Picture of Dorian Gray', expectedLang: 'en' },
  { title: 'Buddenbrooks', expectedLang: 'de' },
  { title: 'Pride and Prejudice', expectedLang: 'en' },
  { title: 'Frankenstein', expectedLang: 'en' },
  { title: 'Der Tod in Venedig', expectedLang: 'de' },
  { title: 'Die Leiden des jungen Werther', expectedLang: 'de' },
  { title: 'Der Prozess', expectedLang: 'de' },
  { title: 'The Last Man', expectedLang: 'en' },
  { title: 'Dracula', expectedLang: 'en' },
  { title: 'The Strange Case of Dr. Jekyll and Mr. Hyde', expectedLang: 'en' },
  { title: 'A Christmas Carol', expectedLang: 'en' },
  { title: 'A Study in Scarlet', expectedLang: 'en' },
  { title: 'Der Schimmelreiter', expectedLang: 'de' }
]

console.log('🔍 COMPREHENSIVE BOOK VALIDATION\n')
console.log('=' .repeat(80))

const issues = []

for (let i = 0; i < booksToCheck.length; i++) {
  const book = booksToCheck[i]
  
  console.log('\n' + (i + 1) + '. ' + book.title)
  console.log('   Expected language: ' + book.expectedLang)
  
  // Get first chunk
  const { data: firstChunk } = await supabase
    .from('source_texts')
    .select('content, language, author:authors(name)')
    .like('title', book.title + '%')
    .order('title')
    .limit(1)
    .single()

  if (!firstChunk) {
    console.log('   ❌ NOT FOUND in database')
    issues.push({ book: book.title, issue: 'Not found in database', critical: true })
    continue
  }

  console.log('   Actual language: ' + firstChunk.language)
  console.log('   Author: ' + (firstChunk.author?.name || 'Unknown'))
  
  const preview = firstChunk.content.substring(0, 200).replace(/\n/g, ' ')
  console.log('   First 200 chars: ' + preview + '...')

  // Check 1: Gutenberg metadata
  if (/\*\*\* START OF|END OF.*GUTENBERG|Produced by|Transcribed by/i.test(firstChunk.content)) {
    console.log('   ⚠️  Contains Gutenberg metadata')
    issues.push({ book: book.title, issue: 'Gutenberg metadata in first chunk' })
  }

  // Check 2: Preface/TOC
  if (/^(PREFACE|INTRODUCTION|FOREWORD|ACKNOWLEDGMENTS)/im.test(firstChunk.content)) {
    console.log('   ⚠️  Contains preface/introduction')
    issues.push({ book: book.title, issue: 'Preface/intro in first chunk' })
  }

  if (/TABLE OF CONTENTS|CONTENTS:|CHAPTER I\.|CHAPTER II\.|CHAPTER III\./i.test(firstChunk.content)) {
    console.log('   ⚠️  Contains table of contents')
    issues.push({ book: book.title, issue: 'TOC in first chunk' })
  }

  // Check 3: Language mismatch
  if (firstChunk.language !== book.expectedLang) {
    console.log('   🚨 CRITICAL: Language mismatch! Expected ' + book.expectedLang + ', got ' + firstChunk.language)
    issues.push({ book: book.title, issue: 'Language field mismatch', critical: true })
  }

  // Check 4: Content language mismatch
  const englishWords = (firstChunk.content.match(/\b(the|and|is|was|are|were|have|has|been|with|from|that|this|which|what|when|where|who)\b/gi) || []).length
  const germanWords = (firstChunk.content.match(/\b(und|der|die|das|ist|war|sein|haben|mit|von|dass|diese|welche|was|wann|wo|wer)\b/gi) || []).length

  if (book.expectedLang === 'de' && englishWords > germanWords * 1.5) {
    console.log('   🚨 CRITICAL: Marked as German but content is ENGLISH!')
    console.log('      English words: ' + englishWords + ', German words: ' + germanWords)
    issues.push({ book: book.title, issue: 'WRONG CONTENT: Marked DE but contains EN text', critical: true })
  } else if (book.expectedLang === 'en' && germanWords > englishWords * 0.7) {
    console.log('   🚨 CRITICAL: Marked as English but content is GERMAN!')
    console.log('      English words: ' + englishWords + ', German words: ' + germanWords)
    issues.push({ book: book.title, issue: 'WRONG CONTENT: Marked EN but contains DE text', critical: true })
  }

  // Check 5: Very short content
  if (firstChunk.content.length < 100) {
    console.log('   ⚠️  First chunk very short (<100 chars)')
    issues.push({ book: book.title, issue: 'First chunk too short' })
  }

  // Get last chunk
  const { data: lastChunk } = await supabase
    .from('source_texts')
    .select('content')
    .like('title', book.title + '%')
    .order('title', { ascending: false })
    .limit(1)
    .single()

  if (lastChunk) {
    // Check for Gutenberg footer in last chunk
    if (/\*\*\* END OF|Project Gutenberg|License|etext/i.test(lastChunk.content)) {
      console.log('   ⚠️  Last chunk contains Gutenberg footer')
      issues.push({ book: book.title, issue: 'Gutenberg footer in last chunk' })
    }
  }

  // Get chunk count
  const { count } = await supabase
    .from('source_texts')
    .select('*', { count: 'exact', head: true })
    .like('title', book.title + '%')

  console.log('   ✅ Total chunks: ' + count)
}

// Summary
console.log('\n\n' + '='.repeat(80))
console.log('SUMMARY')
console.log('='.repeat(80))
console.log('Books checked: ' + booksToCheck.length)
console.log('Total issues: ' + issues.length)

if (issues.length > 0) {
  // Critical issues
  const critical = issues.filter(i => i.critical)
  if (critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES (Wrong content/language):')
    for (const issue of critical) {
      console.log('   • ' + issue.book)
      console.log('     → ' + issue.issue)
    }
  }

  // Minor issues  
  const minor = issues.filter(i => !i.critical)
  if (minor.length > 0) {
    console.log('\n⚠️  MINOR ISSUES (Preface/TOC/Footer):')
    for (const issue of minor) {
      console.log('   • ' + issue.book + ' → ' + issue.issue)
    }
  }
} else {
  console.log('\n✅ NO ISSUES FOUND! All books are clean.')
}

console.log('\n' + '='.repeat(80))
