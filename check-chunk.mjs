import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://afkcgzahzybvanrvvdhq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFma2NnemFoenlidmFucnZ2ZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTQ0ODUsImV4cCI6MjA4NDU3MDQ4NX0.o-xA8qwN6vZZRhDZS0LSWLrgdMO-3W7WZ2b5_hgJqKA'
)

// Find the Frankenstein Teil 6 chunk
const { data, error } = await supabase
  .from('source_texts')
  .select('id, title, content, metadata')
  .ilike('title', '%Frankenstein%Teil 6%')
  .limit(1)

if (error) {
  console.error('Error:', error)
} else if (data && data.length > 0) {
  const chunk = data[0]
  console.log('Title:', chunk.title)
  console.log('Content length:', chunk.content.length, 'characters')
  console.log('First 500 chars:', chunk.content.substring(0, 500))
  console.log('\nMetadata:', JSON.stringify(chunk.metadata, null, 2))
  
  if (chunk.metadata?.plot_summary) {
    console.log('\nExisting plot summary:', chunk.metadata.plot_summary)
  }
} else {
  console.log('No chunk found matching that title')
}
