import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookIngestionUI } from '@/components/admin/BookIngestionUI'

/**
 * Admin-Route für Book Ingestion
 *
 * Sicherheit:
 * - Nur für authentifizierte User
 * - Optional: Zusätzliche Admin-Role-Prüfung über Supabase RLS
 */
export default async function AdminIngestPage() {
  const supabase = await createClient()

  // Auth Check
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Nicht eingeloggt → redirect zu Login
    redirect('/login')
  }

  // Optional: Admin-Role-Check
  // Wenn du in Supabase eine user_roles Tabelle hast:
  // const { data: role } = await supabase
  //   .from('user_roles')
  //   .select('role')
  //   .eq('user_id', user.id)
  //   .single()
  //
  // if (role?.role !== 'admin') {
  //   redirect('/')
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <BookIngestionUI />
    </div>
  )
}
