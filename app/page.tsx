import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <main className="flex flex-col items-center gap-12 px-8 py-16 max-w-3xl text-center">

        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-7xl font-bold tracking-tight text-gray-900">
            Literary Forge
          </h1>
          <p className="text-2xl text-gray-700 font-medium">
            KI-gestütztes Training für stilistische Mimesis
          </p>
        </div>

        {/* Value Proposition */}
        <div className="max-w-2xl space-y-6 text-lg text-gray-600 leading-relaxed">
          <p>
            Lerne, die Stile großer Autoren zu imitieren durch eine einzigartige Kombination
            aus <strong>Spaced Repetition</strong>, <strong>linguistischer Analyse</strong> und <strong>KI-Feedback</strong>.
          </p>
          <p className="text-base">
            Trainiere mit Textpassagen von Kafka, Rilke, Tucholsky und anderen Meistern der deutschen Literatur.
            Erhalte präzises Feedback zu Satzbau, Rhythmus, Wortschatz und Ton.
          </p>
        </div>

        {/* Single Clear CTA */}
        <Link
          href="/train"
          className="px-12 py-5 bg-blue-600 text-white text-xl font-bold rounded-xl
                     hover:bg-blue-700 hover:scale-105 transition-all shadow-2xl"
        >
          Training starten
        </Link>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-3">🔄</div>
            <h3 className="font-semibold text-gray-900 mb-2">Spaced Repetition</h3>
            <p className="text-sm text-gray-600">
              Anki-ähnlicher Algorithmus für optimales Langzeitlernen
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Stilometrische Analyse</h3>
            <p className="text-sm text-gray-600">
              Präzise Metriken für Satzbau, Rhythmus und Komplexität
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 mb-2">KI-Feedback</h3>
            <p className="text-sm text-gray-600">
              Detaillierte Bewertung von Claude 3.5 Haiku
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
