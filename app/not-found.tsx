import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "404 — Seite nicht gefunden | The Franklin Method",
  description: "Die angeforderte Seite konnte nicht gefunden werden.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[var(--border)] mb-4">404</h1>
          <h2 className="text-3xl font-bold mb-4">Seite nicht gefunden</h2>
          <p className="text-[var(--muted)] text-lg mb-8">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 transition-colors"
          >
            Zur Startseite
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--card-hover)] transition-colors"
          >
            Zum Dashboard
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <p className="text-[var(--muted)] text-sm">
            Wenn Sie glauben, dass dies ein Fehler ist, kontaktieren Sie uns unter{' '}
            <Link href="/kontakt" className="text-[var(--muted)] hover:text-[var(--accent)] underline transition-colors">
              /kontakt
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
