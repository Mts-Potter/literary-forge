import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route: Check if current user is admin
 * Returns: { isAdmin: boolean }
 *
 * Used by client components (like Navbar) to conditionally show admin features
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isAdmin: false })
    }

    // Check if user is in admin list
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || []
    const isAdmin = adminUserIds.includes(user.id)

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
