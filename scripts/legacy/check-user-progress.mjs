import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function checkProgress() {
  // Get all users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.error('Error fetching users:', usersError)
    return
  }

  console.log(`\n📊 Found ${users.length} users:\n`)

  for (const user of users) {
    console.log(`\n👤 User: ${user.email} (ID: ${user.id})`)
    
    // Get progress count
    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
    
    if (error) {
      console.error('  ❌ Error:', error.message)
    } else {
      console.log(`  📚 Chunks studied: ${progress.length}`)
      
      if (progress.length > 0) {
        console.log(`  📅 Latest review: ${progress[0].updated_at}`)
      }
    }
  }
}

checkProgress()
