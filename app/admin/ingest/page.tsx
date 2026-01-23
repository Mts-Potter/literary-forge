import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BookIngestForm from '@/components/admin/BookIngestForm'

export default async function AdminIngestPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Admin check - verify user is in admin_users table
  const { data: adminCheck, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (adminError || !adminCheck) {
    // Not an admin - redirect to dashboard
    redirect('/dashboard')
  }

  // Fetch existing authors for dropdown
  const { data: authors } = await supabase
    .from('authors')
    .select('id, name')
    .order('name')

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📚 Bücher importieren
          </h1>
          <p className="text-gray-400">
            Importiere neue literarische Texte für das Training.
          </p>
        </div>

        {/* Admin Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-900/20 border border-blue-700 rounded-lg">
          <span className="text-blue-400 text-sm font-semibold">
            🔐 Admin-Bereich
          </span>
        </div>

        {/* Import Form */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-6 mb-8">
          <BookIngestForm authors={authors || []} userId={user.id} />
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
