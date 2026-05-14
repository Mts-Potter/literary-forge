import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Get total count
const { count: totalChunks } = await supabase
  .from('source_texts')
  .select('*', { count: 'exact', head: true })

console.log('Total chunks in database:', totalChunks)

// Get all titles (with limit)
const { data: samples } = await supabase
  .from('source_texts')
  .select('title')
  .order('title')
  .limit(100)

if (samples) {
  const uniqueTitles = new Set()
  for (const sample of samples) {
    const baseTitle = sample.title.replace(/ \(Teil \d+\)$/, '')
    uniqueTitles.add(baseTitle)
  }
  
  console.log('\nUnique book titles found (from first 100 chunks):')
  for (const title of uniqueTitles) {
    console.log('  -', title)
  }
  
  console.log('\nTotal unique books:', uniqueTitles.size)
}

// Try querying for specific expected books
console.log('\n--- Checking for expected books ---')

const expectedBooks = [
  'The Great Gatsby',
  'Die Verwandlung',
  'The Picture of Dorian Gray',
  'Buddenbrooks',
  'Pride and Prejudice',
  'Frankenstein',
  'Der Tod in Venedig',
  'Die Leiden des jungen Werther',
  'Der Prozess',
  'The Last Man',
  'Dracula',
  'Der Schimmelreiter'
]

for (const bookTitle of expectedBooks) {
  const { count } = await supabase
    .from('source_texts')
    .select('*', { count: 'exact', head: true })
    .like('title', bookTitle + '%')
  
  console.log(bookTitle + ':', count || 0, 'chunks')
}
