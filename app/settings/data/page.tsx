'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/**
 * GDPR Self-Service Page (Phase 7.3)
 *
 * - Export: ruft RPC export_user_data, lädt als JSON-File
 * - Delete: ruft RPC delete_user_account_data, danach Sign-Out
 *   (Final-Löschung der auth.users-Row erfordert Service-Role-Admin-Route — TODO)
 */
export default function DataPage() {
  const router = useRouter()
  const supabase = createClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleExport() {
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('export_user_data')
      if (rpcError) throw rpcError
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `literary-forge-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSuccess('Export heruntergeladen.')
    } catch (e: any) {
      setError(e.message || 'Export fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm(
      'WIRKLICH alle Daten löschen?\n\nDas löscht alle Reviews, Hints, Settings und Fortschritte unwiderruflich.\nDein Auth-Account muss separat (Admin-Aktion) entfernt werden.'
    )) return
    setBusy(true)
    setError(null)
    try {
      const { error: rpcError } = await supabase.rpc('delete_user_account_data')
      if (rpcError) throw rpcError
      await supabase.auth.signOut()
      router.push('/')
    } catch (e: any) {
      setError(e.message || 'Löschen fehlgeschlagen')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/settings" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Zurück zu Einstellungen
        </Link>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mt-3 mb-1">Meine Daten</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          GDPR-konformer Export und Löschung deiner Daten.
        </p>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Daten exportieren</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Alle gespeicherten Reviews, Hints, Settings und Fortschritte als JSON-Datei.
          </p>
          <button
            onClick={handleExport}
            disabled={busy}
            className="px-5 py-2 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Lade...' : 'Export als JSON'}
          </button>
        </div>

        <div className="bg-[var(--card)] border border-red-900 rounded-lg p-5 mb-4">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Daten löschen</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Löscht alle anwendungsbezogenen Daten. Auth-Account-Löschung erfolgt
            separat (Admin-Aktion).
          </p>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="px-5 py-2 bg-red-900 text-[var(--foreground)] font-semibold rounded-lg hover:bg-red-800 disabled:opacity-50"
          >
            {busy ? '...' : 'Alle Daten löschen'}
          </button>
        </div>

        {success && (
          <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-3">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-3">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
