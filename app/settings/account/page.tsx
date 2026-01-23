import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/settings/SignOutButton'

export default async function AccountPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Konto</h1>
          <p className="text-gray-400">
            Verwalte deine Kontoinformationen und Einstellungen.
          </p>
        </div>

        {/* Account Information Card */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Kontoinformationen
          </h2>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">
                Email-Adresse
              </label>
              <div className="px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white">
                {user.email}
              </div>
            </div>

            {/* User ID (for debugging/support) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">
                Benutzer-ID
              </label>
              <div className="px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-gray-500 text-xs font-mono">
                {user.id}
              </div>
            </div>

            {/* Account created date */}
            {user.created_at && (
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">
                  Konto erstellt am
                </label>
                <div className="px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white">
                  {new Date(user.created_at).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Aktionen
          </h2>

          <div className="space-y-3">
            {/* Sign Out Button */}
            <SignOutButton />

            {/* Future: Change Password */}
            <button
              disabled
              className="w-full px-6 py-3 border-2 border-[#262626] text-gray-500 rounded-lg
                         cursor-not-allowed opacity-50"
            >
              Passwort ändern (Bald verfügbar)
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 text-center">
          <Link
            href="/dashboard"
            className="flex-1 text-gray-400 hover:text-white transition-colors"
          >
            ← Zurück zum Dashboard
          </Link>
          <Link
            href="/"
            className="flex-1 text-gray-400 hover:text-white transition-colors"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
