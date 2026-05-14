import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  mode: z.enum(['franklin', 'cloze', 'free']),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let parsed
  try {
    parsed = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: user.id, default_mode: parsed.mode },
      { onConflict: 'user_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, mode: parsed.mode })
}
