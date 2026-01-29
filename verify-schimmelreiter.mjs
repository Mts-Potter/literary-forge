import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const { data: chunks, error } = await supabase
  .from('source_texts')
  .select('id, title, content, language, cefr_level')
  .like('title', 'Der Schimmelreiter%')
  .order('title', { ascending: true })
  .limit(5)

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

if (!chunks || chunks.length === 0) {
  console.log('No chunks found - checking if any Schimmelreiter exists...')
  
  const { data: anyChunks } = await supabase
    .from('source_texts')
    .select('title')
    .ilike('title', '%schimmel%')
    .limit(3)
  
  console.log('Found with schimmel:', anyChunks)
  process.exit(1)
}

console.log('📖 First', chunks.length, 'chunks of Der Schimmelreiter:\n')

for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i]
  const preview = chunk.content.substring(0, 150).replace(/\n/g, ' ')
  console.log((i + 1) + '. ' + chunk.title)
  console.log('   Language: ' + chunk.language + ' | CEFR: ' + chunk.cefr_level)
  console.log('   Preview: ' + preview + '...\n')
}

const { count } = await supabase
  .from('source_texts')
  .select('*', { count: 'exact', head: true })
  .like('title', 'Der Schimmelreiter%')

console.log('Total Schimmelreiter chunks:', count)
