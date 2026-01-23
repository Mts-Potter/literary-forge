import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookIngestionUI } from '@/components/admin/BookIngestionUI'

/**
 * Admin-Route für Book Ingestion
 *
 * Sicherheit:
 * - Nur für authentifizierte User
 * - Nur für Admin-User (definiert in Environment Variable)
 *
 * Setup: Füge ADMIN_USER_IDS zur .env.local hinzu:
 * ADMIN_USER_IDS=uuid1,uuid2,uuid3
 */
export default async function AdminIngestPage() {
  const supabase = await createClient()

  // Auth Check
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Nicht eingeloggt → redirect zu Login
    redirect('/login')
  }

  // Admin-Check: Nur User in ADMIN_USER_IDS erlaubt
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || []
  const isAdmin = adminUserIds.includes(user.id)

  if (!isAdmin) {
    // Nicht autorisiert → redirect zur Startseite
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <BookIngestionUI />
    </div>
  )
}
