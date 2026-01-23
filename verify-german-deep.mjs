import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 DEEP VERIFICATION - Checking Teil 5 (main text)\n')

const booksToCheck = ['Die Verwandlung', 'Buddenbrooks', 'Die Leiden des jungen Werther', 'Der Prozess']

for (const bookTitle of booksToCheck) {
  const chunkTitle = bookTitle + ' (Teil 5)'
  
  const { data: chunk } = await supabase
    .from('source_texts')
    .select('content')
    .eq('title', chunkTitle)
    .single()
  
  if (!chunk) {
    console.log('❌', bookTitle, '- Teil 5 not found')
    continue
  }
  
  const preview = chunk.content.substring(0, 200).replace(/\n/g, ' ')
  console.log('📖', bookTitle)
  console.log('   ' + preview + '...')
  
  const germanWords = (chunk.content.match(/\b(und|der|die|das|ist|war|sein|haben|mit|von|dass|diese|welche|was|ich|er|sie|es|ein|eine|zu|auf|für|aber|doch|schon|noch|auch|wie|wenn|dann)\b/gi) || []).length
  const englishWords = (chunk.content.match(/\b(the|and|is|was|are|were|have|has|been|with|from|that|this|which|what|when|where|who|I|he|she|it|a|an|to|on|for|but|very|still|also|how|if|then)\b/gi) || []).length
  
  if (germanWords > englishWords * 2) {
    console.log('   ✅ GERMAN (', germanWords, 'German words,', englishWords, 'English words)\n')
  } else {
    console.log('   ❌ ENGLISH (', germanWords, 'German words,', englishWords, 'English words)\n')
  }
}
