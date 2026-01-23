import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🗑️  Deleting Teil 1 from English books with TOC/Preface\n')

const booksToClean = [
  'The Great Gatsby',
  'The Picture of Dorian Gray',
  'The Last Man',
  'A Christmas Carol',
  'A Study in Scarlet'
]

let totalDeleted = 0

for (const bookTitle of booksToClean) {
  const chunkTitle = bookTitle + ' (Teil 1)'
  
  console.log('Deleting:', chunkTitle)
  
  const { error } = await supabase
    .from('source_texts')
    .delete()
    .eq('title', chunkTitle)
  
  if (error) {
    console.error('  ❌ Error:', error.message)
  } else {
    console.log('  ✅ Deleted')
    totalDeleted++
  }
}

console.log('\n✅ Total first chunks deleted:', totalDeleted)
