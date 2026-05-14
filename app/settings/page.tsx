import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'

type TrainMode = 'franklin' | 'cloze' | 'free'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('user_settings')
    .select('enable_srs, default_mode')
    .eq('user_id', user.id)
    .single()

  const rawMode = (settings as { default_mode?: string } | null)?.default_mode
  const initialDefaultMode: TrainMode =
    rawMode === 'cloze' || rawMode === 'free' ? rawMode : 'franklin'

  return (
    <SettingsClient
      userEmail={user.email ?? ''}
      userId={user.id}
      createdAt={user.created_at ?? ''}
      initialEnableSRS={settings?.enable_srs ?? true}
      initialDefaultMode={initialDefaultMode}
    />
  )
}
