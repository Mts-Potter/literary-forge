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

        <div className="max-w-xl text-base text-[var(--muted)] leading-relaxed">
          <p>
            Eine alte Methode, ein neues Medium. Du übst mit Passagen aus Kafka, Mann, Austen, Fitzgerald — schreibst sie aus dem Gedächtnis, und bekommst eine ehrliche Rückmeldung zu Satzbau, Rhythmus, Wortwahl und Ton.
          </p>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/demo"
            className="inline-flex items-center gap-3 pb-2 text-[15px] font-medium text-[var(--foreground)] border-b border-[var(--foreground)] hover:gap-4 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-200"
          >
            Demo ansehen
            <span aria-hidden>→</span>
          </Link>

          <div className="flex gap-7 text-[13px] text-[var(--muted)]">
            <Link href="/methode" className="hover:text-[var(--foreground)] transition-colors">
              Methode
            </Link>
            <Link href="/buecher" className="hover:text-[var(--foreground)] transition-colors">
              Bücher
            </Link>
            <Link href="/login" className="hover:text-[var(--foreground)] transition-colors">
              Anmelden
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
