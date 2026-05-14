#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function addAdmin() {
  const targetEmail = 'mtsmmiv@gmail.com'

  console.log(`\n🔍 Looking up user: ${targetEmail}`)

  // Get all users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error('❌ Error fetching users:', usersError)
    return
  }

  // Find target user
  const user = users.find(u => u.email === targetEmail)

  if (!user) {
    console.error(`❌ User ${targetEmail} not found`)
    console.log('\nAvailable users:')
    users.forEach(u => console.log(`  - ${u.email} (${u.id})`))
    return
  }

  console.log(`✅ Found user: ${user.email}`)
  console.log(`   User ID: ${user.id}`)

  // Check if already admin
  const { data: existingAdmin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (existingAdmin) {
    console.log('\n⚠️  User is already an admin!')
    return
  }

  // Add to admin_users table
  console.log('\n🔐 Adding admin privileges...')

  const { error: insertError } = await supabase
    .from('admin_users')
    .insert({
      user_id: user.id
    })

  if (insertError) {
    console.error('❌ Failed to add admin:', insertError)
    return
  }

  console.log('✅ Admin privileges granted!')
  console.log(`\n🎉 ${targetEmail} is now an admin!`)
}

addAdmin()
