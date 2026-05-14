import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin endpoint to migrate user data from old account to new account
 * Use case: User created new account and wants to keep progress from old one
 *
 * Usage:
 * POST /api/admin/migrate-user-data
 * Body: { "fromEmail": "old@email.com", "toEmail": "new@email.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - must be admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request
    const { fromEmail, toEmail } = await request.json()

    if (!fromEmail || !toEmail) {
      return NextResponse.json(
        { error: 'Both fromEmail and toEmail are required' },
        { status: 400 }
      )
    }

    // Get user IDs from emails
    const { data: allUsers } = await supabase.auth.admin.listUsers()

    const fromUser = allUsers?.users?.find(u => u.email === fromEmail)
    const toUser = allUsers?.users?.find(u => u.email === toEmail)

    if (!fromUser || !toUser) {
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      )
    }

    console.log(`Migrating data from ${fromEmail} (${fromUser.id}) to ${toEmail} (${toUser.id})`)

    // 1. Get data from old account
    const { data: oldProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', fromUser.id)

    if (progressError) {
      return NextResponse.json(
        { error: 'Failed to fetch old progress', details: progressError.message },
        { status: 500 }
      )
    }

    const { data: oldReviews, error: reviewsError } = await supabase
      .from('review_history')
      .select('*')
      .eq('user_id', fromUser.id)

    if (reviewsError) {
      return NextResponse.json(
        { error: 'Failed to fetch old reviews', details: reviewsError.message },
        { status: 500 }
      )
    }

    // 2. Copy data to new account
    if (oldProgress && oldProgress.length > 0) {
      const newProgress = oldProgress.map(p => ({
        ...p,
        user_id: toUser.id,
        id: undefined // Let DB generate new IDs
      }))

      const { error: insertProgressError } = await supabase
        .from('user_progress')
        .upsert(newProgress, {
          onConflict: 'user_id,text_id',
          ignoreDuplicates: false
        })

      if (insertProgressError) {
        return NextResponse.json(
          { error: 'Failed to migrate progress', details: insertProgressError.message },
          { status: 500 }
        )
      }
    }

    if (oldReviews && oldReviews.length > 0) {
      const newReviews = oldReviews.map(r => ({
        ...r,
        user_id: toUser.id,
        id: undefined // Let DB generate new IDs
      }))

      const { error: insertReviewsError } = await supabase
        .from('review_history')
        .insert(newReviews)

      if (insertReviewsError) {
        return NextResponse.json(
          { error: 'Failed to migrate reviews', details: insertReviewsError.message },
          { status: 500 }
        )
      }
    }

    // 3. Delete old account data (optional - keep for now)
    // await supabase.from('user_progress').delete().eq('user_id', fromUser.id)
    // await supabase.from('review_history').delete().eq('user_id', fromUser.id)
    // await supabase.auth.admin.deleteUser(fromUser.id)

    return NextResponse.json({
      success: true,
      message: 'Data migrated successfully',
      migrated: {
        progressRecords: oldProgress?.length || 0,
        reviewRecords: oldReviews?.length || 0,
        fromUser: fromEmail,
        toUser: toEmail
      }
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to preview migration (dry run)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users and their data counts
    const { data: allUsers } = await supabase.auth.admin.listUsers()

    const usersWithData = await Promise.all(
      (allUsers?.users || []).map(async (u) => {
        const { data: progress } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', u.id)

        const { data: reviews } = await supabase
          .from('review_history')
          .select('id')
          .eq('user_id', u.id)

        return {
          email: u.email,
          id: u.id,
          created_at: u.created_at,
          progressRecords: progress?.length || 0,
          reviewRecords: reviews?.length || 0
        }
      })
    )

    return NextResponse.json({
      users: usersWithData.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    )
  }
}
