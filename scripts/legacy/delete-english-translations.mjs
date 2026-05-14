import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🗑️  Deleting German books with English translations (COPYRIGHT ISSUE!)\n')
console.log('REASON: Translations have separate copyright protection!')
console.log('Even if original is PD, translation is NOT PD until 70 years after translator death.\n')

const booksToDelete = [
  { title: 'Die Verwandlung', reason: 'English translation by David Wyllie (NOT public domain)' },
  { title: 'Buddenbrooks', reason: 'Wrong book - contains English anthology, not Thomas Mann' },
  { title: 'Die Leiden des jungen Werther', reason: 'English translation by R.D. Boylan (NOT public domain)' },
  { title: 'Der Prozess', reason: 'English translation by David Wyllie (NOT public domain)' }
]

let totalDeleted = 0

for (const book of booksToDelete) {
  console.log('Deleting:', book.title)
  console.log('  Reason:', book.reason)
  
  // Count chunks first
  const { count } = await supabase
    .from('source_texts')
    .select('*', { count: 'exact', head: true })
    .like('title', book.title + '%')
  
  console.log('  Found:', count, 'chunks')
  
  if (count === 0) {
    console.log('  ⚠️  No chunks found - already deleted?')
    continue
  }
  
  // Delete in batches
  let deleted = 0
  while (true) {
    const { data: chunks } = await supabase
      .from('source_texts')
      .select('id')
      .like('title', book.title + '%')
      .limit(100)
    
    if (!chunks || chunks.length === 0) break
    
    const ids = chunks.map(c => c.id)
    const { error } = await supabase
      .from('source_texts')
      .delete()
      .in('id', ids)
    
    if (error) {
      console.error('  ❌ Delete error:', error.message)
      break
    }
    
    deleted += chunks.length
    console.log('  Progress:', deleted, '/', count)
  }
  
  totalDeleted += deleted
  console.log('  ✅ Deleted', deleted, 'chunks\n')
}

console.log('=' .repeat(80))
console.log('✅ Total chunks deleted:', totalDeleted)
console.log('These will be replaced with German ORIGINAL texts (public domain compliant)')
