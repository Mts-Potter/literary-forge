import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <main className="flex flex-col items-center gap-12 px-8 py-16 max-w-3xl text-center">

        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-7xl font-bold tracking-tight text-white">
            Literary Forge
          </h1>
          <p className="text-2xl text-gray-300 font-medium">
            KI-gestütztes Training für stilistische Mimesis
          </p>
        </div>

        {/* Value Proposition */}
        <div className="max-w-2xl space-y-6 text-lg text-gray-400 leading-relaxed">
          <p>
            Lerne, die Stile großer Autoren zu imitieren durch eine einzigartige Kombination
            aus <strong className="text-white">Spaced Repetition</strong>, <strong className="text-white">linguistischer Analyse</strong> und <strong className="text-white">KI-Feedback</strong>.
          </p>
          <p className="text-base">
            Trainiere mit Textpassagen von Kafka, Rilke, Tucholsky und anderen Meistern der deutschen Literatur.
            Erhalte präzises Feedback zu Satzbau, Rhythmus, Wortschatz und Ton.
          </p>
        </div>

        {/* Single Clear CTA */}
        <Link
          href="/train"
          className="px-12 py-5 bg-white text-black text-xl font-bold rounded-xl
                     hover:bg-gray-200 hover:scale-105 transition-all shadow-2xl"
        >
          Training starten
        </Link>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full">
          <div className="p-6 bg-[#171717] border border-[#262626] rounded-lg hover:bg-[#1f1f1f] transition-colors">
            <div className="text-4xl mb-3">🔄</div>
            <h3 className="font-semibold text-white mb-2">Spaced Repetition</h3>
            <p className="text-sm text-gray-400">
              Anki-ähnlicher Algorithmus für optimales Langzeitlernen
            </p>
          </div>

          <div className="p-6 bg-[#171717] border border-[#262626] rounded-lg hover:bg-[#1f1f1f] transition-colors">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-white mb-2">Stilometrische Analyse</h3>
            <p className="text-sm text-gray-400">
              Präzise Metriken für Satzbau, Rhythmus und Komplexität
            </p>
          </div>

          <div className="p-6 bg-[#171717] border border-[#262626] rounded-lg hover:bg-[#1f1f1f] transition-colors">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-semibold text-white mb-2">KI-Feedback</h3>
            <p className="text-sm text-gray-400">
              Detaillierte Bewertung von Claude 3.5 Haiku
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
