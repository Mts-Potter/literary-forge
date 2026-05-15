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
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
      />
      <div className="flex-1 flex flex-col justify-center max-w-2xl px-8 md:px-16 py-24">
        <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--muted)] mb-14">
          est. 1722 · benjamin franklin
        </div>

        <h1 className="font-[family-name:var(--font-fraunces)] font-light text-[clamp(48px,7.5vw,96px)] leading-[0.98] tracking-[-0.018em] text-[var(--foreground)]">
          Schreibstil lernen,
          <br />
          <em className="font-light italic">
            wie Franklin sich&nbsp;selbst&nbsp;beibrachte.
          </em>
        </h1>

        <p className="font-[family-name:var(--font-fraunces)] italic font-light text-xl text-[var(--muted)] leading-snug mt-6 max-w-xl">
          Eine alte Methode, ein neues Medium. Lesen, vergessen, rekonstruieren — und nach jedem Versuch eine ehrliche Rückmeldung.
        </p>

        <p className="text-base text-[var(--muted)] leading-relaxed mt-16 max-w-xl">
          Du übst mit Passagen aus Kafka, Mann, Austen, Fitzgerald. Du schreibst sie aus dem Gedächtnis. Was dabei herauskommt, wird zeilenweise mit dem Original verglichen — Satzbau, Rhythmus, Wortwahl, Ton.
        </p>

        <div className="flex items-center gap-8 flex-wrap mt-14">
          <Link
            href="/demo"
            className="inline-flex items-center gap-3 pb-2 text-[15px] font-medium text-[var(--foreground)] border-b border-[var(--foreground)] hover:gap-4 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-200"
          >
            Demo ansehen
            <span aria-hidden>→</span>
          </Link>
          <div className="flex gap-7 text-[13px] text-[var(--muted)]">
            <Link href="/methode" className="hover:text-[var(--foreground)] transition-colors">Methode</Link>
            <Link href="/buecher" className="hover:text-[var(--foreground)] transition-colors">Bücher</Link>
            <Link href="/login" className="hover:text-[var(--foreground)] transition-colors">Anmelden</Link>
          </div>
        </div>

        <p className="font-[family-name:var(--font-fraunces)] italic text-[13px] text-[var(--muted)] leading-relaxed mt-auto pt-20 max-w-md">
          — Spaced Repetition, Stilometrie, qualitatives Lektorat. Die Maschinerie steht im Hintergrund. Auf der Bühne stehen die Texte.
        </p>
      </div>
    </main>
  )
}
