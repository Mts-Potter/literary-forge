import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError: authError?.message
      }, { status: 401 })
    }

    // Get user progress
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)

    // Get review history
    const { data: reviewHistory, error: reviewError } = await supabase
      .from('review_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get all users (admin only)
    const { data: allUsers } = await supabase.auth.admin.listUsers()

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      progressCount: progressData?.length || 0,
      progressData: progressData || [],
      progressError: progressError?.message,
      reviewHistoryCount: reviewHistory?.length || 0,
      reviewHistory: reviewHistory || [],
      reviewError: reviewError?.message,
      allUsersCount: allUsers?.users?.length || 0,
      allUsers: allUsers?.users?.map(u => ({ id: u.id, email: u.email })) || []
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
