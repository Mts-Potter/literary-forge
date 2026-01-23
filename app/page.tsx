import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="flex flex-col items-center gap-8 px-8 py-16 max-w-4xl text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight text-gray-900">
            Literary Forge
          </h1>
          <p className="text-xl text-gray-600">
            KI-gestütztes Training für stilistische Mimesis
          </p>
        </div>

        <div className="max-w-2xl space-y-4 text-gray-700">
          <p>
            Lerne, die Stile großer Autoren zu imitieren durch eine einzigartige Kombination
            aus Spaced Repetition, linguistischer Analyse und KI-Feedback.
          </p>
          <p className="text-sm text-gray-500">
            Serverlose Architektur powered by Next.js, Supabase und Claude 3.5 Haiku
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full max-w-4xl">
          <Link
            href="/train"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold
                       hover:bg-blue-700 transition-colors shadow-lg text-center"
          >
            Training starten
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold
                       hover:border-gray-400 hover:bg-gray-50 transition-colors text-center"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold
                       hover:border-gray-400 hover:bg-gray-50 transition-colors text-center"
          >
            ⚙️ Einstellungen
          </Link>
          <Link
            href="/admin/ingest"
            className="px-8 py-4 border-2 border-purple-300 text-purple-700 rounded-lg font-semibold
                       hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
          >
            📚 Admin Import
          </Link>
        </div>
      </main>
    </div>
  )
}
