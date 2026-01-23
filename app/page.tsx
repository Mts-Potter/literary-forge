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
            AI-Powered Training for Literary Style Imitation
          </p>
        </div>

        {/* Value Proposition */}
        <div className="max-w-2xl space-y-6 text-lg text-gray-400 leading-relaxed">
          <p>
            Learn to imitate the styles of great authors through a unique combination
            of <strong className="text-white">Spaced Repetition</strong>, <strong className="text-white">linguistic analysis</strong>, and <strong className="text-white">AI feedback</strong>.
          </p>
          <p className="text-base">
            Train with passages from Kafka, Austen, Fitzgerald, and other masters of literature.
            Receive precise feedback on sentence structure, rhythm, vocabulary, and tone.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/train"
            className="px-12 py-5 bg-white text-black text-xl font-bold rounded-xl
                       hover:bg-gray-200 hover:scale-105 transition-all shadow-2xl"
          >
            Start Training
          </Link>

          <Link
            href="/books"
            className="px-8 py-3 bg-[#262626] text-white text-base font-semibold rounded-lg
                       hover:bg-[#1f1f1f] transition-colors border border-[#3a3a3a]"
          >
            📚 Browse Books
          </Link>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full">
          <div className="p-6 bg-[#171717] border border-[#262626] rounded-lg hover:bg-[#1f1f1f] transition-colors">
            <div className="text-4xl mb-3">🔄</div>
            <h3 className="font-semibold text-white mb-2">Spaced Repetition</h3>
            <p className="text-sm text-gray-400">
              Anki-like algorithm for optimal long-term retention
            </p>
          </div>

          <div className="p-6 bg-[#171717] border border-[#262626] rounded-lg hover:bg-[#1f1f1f] transition-colors">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-white mb-2">Stylometric Analysis</h3>
            <p className="text-sm text-gray-400">
              Precise metrics for sentence structure, rhythm, and complexity
            </p>
          </div>

          <div className="p-6 bg-[#171717] border border-[#262626] rounded-lg hover:bg-[#1f1f1f] transition-colors">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-semibold text-white mb-2">AI Feedback</h3>
            <p className="text-sm text-gray-400">
              Detailed evaluation from Claude 3.5 Haiku
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
