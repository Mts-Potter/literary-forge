const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function checkContent() {
  const { data, error } = await supabase
    .from('source_texts')
    .select('id, title, LEFT(content, 200) as preview')
    .ilike('title', '%Verwandlung%')
    .limit(3);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Found texts:', data?.length || 0);
  data?.forEach(text => {
    console.log('\n---');
    console.log('ID:', text.id);
    console.log('Title:', text.title);
    console.log('Content preview:', text.preview);
  });
}

checkContent();
