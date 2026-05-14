import Link from 'next/link'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://literary-forge.vercel.app'

const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "The Franklin Method",
      description:
        "Schreibstil-Training basierend auf Benjamin Franklins Selbstlern-Methode, mit KI-Feedback und Spaced Repetition",
      url: siteUrl,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web Browser",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      inLanguage: "de-DE",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "The Franklin Method",
      description: "Schreibstil-Training basierend auf Benjamin Franklins Selbstlern-Methode",
      inLanguage: "de-DE",
    },
  ],
}

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
      />
      <main className="flex flex-col items-center gap-12 px-8 py-16 max-w-3xl text-center">

        <div className="space-y-6">
          <h1 className="text-7xl font-bold tracking-tight text-[var(--foreground)]">
            The Franklin Method
          </h1>
          <p className="text-2xl text-[var(--foreground)] font-medium">
            Schreibstil lernen — wie Franklin sich selbst beibrachte.
          </p>
        </div>

        <div className="max-w-2xl space-y-6 text-lg text-[var(--muted)] leading-relaxed">
          <p>
            Lerne den Stil großer Autoren zu imitieren — mit der Methode, die <strong className="text-[var(--foreground)]">Benjamin Franklin 1722</strong> erfand. Heute mit KI-Feedback optimiert: <strong className="text-[var(--foreground)]">Spaced Repetition</strong>, <strong className="text-[var(--foreground)]">Stilometrie</strong>, <strong className="text-[var(--foreground)]">qualitatives Lektorat</strong>.
          </p>
          <p className="text-base">
            Trainiere mit Passagen von Kafka, Mann, Austen, Fitzgerald — bekomme nach jedem Versuch konkrete Rückmeldung zu Satzbau, Rhythmus, Wortwahl und Ton.
          </p>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/demo"
            className="px-12 py-5 bg-[var(--foreground)] text-[var(--background)] text-xl font-bold rounded-xl
                       hover:opacity-90 hover:scale-105 transition-all shadow-2xl"
          >
            Eine Runde probieren — ohne Anmeldung
          </Link>

          <div className="flex gap-3 text-sm">
            <Link href="/methode" className="text-[var(--muted)] hover:text-[var(--foreground)] underline">
              Die Methode
            </Link>
            <span className="text-[var(--muted)]">·</span>
            <Link href="/buecher" className="text-[var(--muted)] hover:text-[var(--foreground)] underline">
              Bücher
            </Link>
            <span className="text-[var(--muted)]">·</span>
            <Link href="/login" className="text-[var(--muted)] hover:text-[var(--foreground)] underline">
              Anmelden
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full">
          <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors">
            <div className="text-4xl mb-3">🔄</div>
            <h3 className="font-semibold text-[var(--foreground)] mb-2">Spaced Repetition</h3>
            <p className="text-sm text-[var(--muted)]">
              FSRS V5 — optimiert für langfristige Behaltensleistung.
            </p>
          </div>

          <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-[var(--foreground)] mb-2">Stilometrie</h3>
            <p className="text-sm text-[var(--muted)]">
              20 messbare Features pro Chunk: Satzlänge, Funktionswörter, Komma-Dichte, mehr.
            </p>
          </div>

          <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-semibold text-[var(--foreground)] mb-2">KI-Feedback</h3>
            <p className="text-sm text-[var(--muted)]">
              Qualitatives Lektorat nach jedem Versuch — nicht während du schreibst.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
