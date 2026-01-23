import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🗑️  Deleting false Tonio Kröger chunks...')

// Find all Tonio Kröger chunks
const { data: chunks, error: fetchError } = await supabase
  .from('source_texts')
  .select('id, title')
  .like('title', 'Tonio Kröger%')

if (fetchError) {
  console.error('Error fetching chunks:', fetchError)
  process.exit(1)
}

console.log('Found chunks to delete:', chunks.length)

if (chunks.length === 0) {
  console.log('No chunks found - already deleted?')
  process.exit(0)
}

// Delete in batches of 100
const batchSize = 100
let deleted = 0

for (let i = 0; i < chunks.length; i += batchSize) {
  const batch = chunks.slice(i, i + batchSize)
  const ids = batch.map(c => c.id)
  
  const { error: deleteError } = await supabase
    .from('source_texts')
    .delete()
    .in('id', ids)
  
  if (deleteError) {
    console.error('Delete error at batch', i, ':', deleteError)
    process.exit(1)
  }
  
  deleted += batch.length
  console.log('Deleted', deleted, '/', chunks.length)
}

console.log('✅ Successfully deleted', deleted, 'false Tonio Kröger chunks')
