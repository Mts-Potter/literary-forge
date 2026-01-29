import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "404 - Seite nicht gefunden | Literary Forge",
  description: "Die angeforderte Seite konnte nicht gefunden werden.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#262626] mb-4">404</h1>
          <h2 className="text-3xl font-bold mb-4">Seite nicht gefunden</h2>
          <p className="text-gray-400 text-lg mb-8">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Zur Startseite
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-[#262626] text-white font-semibold rounded-lg hover:bg-[#1f1f1f] transition-colors"
          >
            Zum Dashboard
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-[#262626]">
          <p className="text-gray-500 text-sm">
            Wenn Sie glauben, dass dies ein Fehler ist, kontaktieren Sie uns unter{' '}
            <Link href="/kontakt" className="text-blue-400 hover:underline">
              /kontakt
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
