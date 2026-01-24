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

    // SECURITY: Check admin status via database, not environment variable
    // This ensures single source of truth and allows dynamic admin management
    const { data: adminCheck, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    // If error or no match found, user is not admin
    const isAdmin = !error && !!adminCheck

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
