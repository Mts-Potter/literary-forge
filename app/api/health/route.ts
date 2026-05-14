import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

/**
 * Keep-Alive Health Endpoint
 *
 * Zweck: Verhindert Supabase-Free-Tier-Pause (7 Tage Inaktivität → pause,
 * 90 Tage → Löschung). Wird täglich via Vercel Cron (siehe vercel.json)
 * aufgerufen.
 *
 * Auth: Vercel sendet beim Cron-Trigger automatisch `Authorization: Bearer <CRON_SECRET>`
 * wenn die Env-Variable gesetzt ist. Manuelle Aufrufe werden mit 401 abgewiesen.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = await createClient()
    const { error, count } = await supabase
      .from('source_texts')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      source_texts_count: count ?? 0
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
