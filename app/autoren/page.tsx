import type { Metadata } from "next"
import Link from "next/link"
import { AUTHOR_BIOS } from "@/data/authors-bios"

export const metadata: Metadata = {
  title: "Autoren | The Franklin Method",
  description: "Zwölf Autoren von Kafka bis Austen — Stilprofile und Bibliografien aus dem Lern-Korpus.",
  alternates: { canonical: "/autoren" },
}

export default function AutorenIndex() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Autoren</h1>
      <p className="text-[var(--muted)] mb-8">Die zwölf Stimmen, an denen du trainieren kannst.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AUTHOR_BIOS.map((a) => (
          <Link
            key={a.slug}
            href={`/autoren/${a.slug}`}
            className="block bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 hover:bg-[var(--card-hover)] transition-colors"
          >
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{a.name}</h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              {a.era} · {a.language === "de" ? "Deutsch" : "Englisch"}
            </p>
            <p className="text-sm text-[var(--foreground)] mt-3 leading-relaxed line-clamp-3">
              {a.bio_de}
            </p>
          </Link>
        ))}
      </div>
    </main>
  )
}
