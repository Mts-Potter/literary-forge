import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 VERIFYING GERMAN IMPORTS\n')

const booksToCheck = [
  'Die Verwandlung',
  'Buddenbrooks',
  'Die Leiden des jungen Werther',
  'Der Prozess'
]

for (const bookTitle of booksToCheck) {
  console.log('📖', bookTitle)
  
  const { data: firstChunk } = await supabase
    .from('source_texts')
    .select('content, language')
    .like('title', bookTitle + '%')
    .order('title')
    .limit(1)
    .single()
  
  if (!firstChunk) {
    console.log('   ❌ NOT FOUND')
    continue
  }
  
  const preview = firstChunk.content.substring(0, 150).replace(/\n/g, ' ')
  console.log('   Language:', firstChunk.language)
  console.log('   Preview:', preview + '...')
  
  // Check for German words
  const germanWords = (firstChunk.content.match(/\b(und|der|die|das|ist|war|sein|haben|mit|von|dass|diese|welche|was|wann|wo|wer|ich|er|sie)\b/gi) || []).length
  const englishWords = (firstChunk.content.match(/\b(the|and|is|was|are|were|have|has|been|with|from|that|this|which|what|when|where|who)\b/gi) || []).length
  
  console.log('   German words:', germanWords, '| English words:', englishWords)
  
  if (germanWords > englishWords * 2) {
    console.log('   ✅ VERIFIED: Contains German text\n')
  } else {
    console.log('   ⚠️  WARNING: Might still be English!\n')
  }
}

console.log('=' .repeat(80))
