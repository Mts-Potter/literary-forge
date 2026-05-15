import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getBioByAuthorId, slugifyTitle } from "@/data/authors-bios"

export const metadata: Metadata = {
  title: "Bücher | The Franklin Method",
  description: "Werke im Trainings-Korpus — Public Domain, kuratiert nach stilistischer Vielfalt.",
  alternates: { canonical: "/buecher" },
}

export default async function BuecherIndex() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("source_texts")
    .select("title, author_id, language, cefr_level, publication_year")
    .eq("is_pd_eu", true)

  const map = new Map<
    string,
    {
      title: string
      author_id: string
      language: string
      cefr_level: string | null
      publication_year: number | null
      chunk_count: number
    }
  >()
  for (const row of data ?? []) {
    const base = (row.title as string).split(" (Teil ")[0]
    const existing = map.get(base)
    if (existing) {
      existing.chunk_count += 1
    } else {
      map.set(base, {
        title: base,
        author_id: row.author_id as string,
        language: row.language as string,
        cefr_level: (row.cefr_level as string) ?? null,
        publication_year: (row.publication_year as number) ?? null,
        chunk_count: 1,
      })
    }
  }
  const books = Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title))

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-[family-name:var(--font-fraunces)] font-light text-5xl md:text-6xl tracking-tight text-[var(--foreground)] mb-3">
        Bücher
      </h1>
      <p className="font-[family-name:var(--font-fraunces)] italic text-[var(--muted)] mb-16">
        {books.length} gemeinfreie Werke, in Chunks geschnitten und stilometrisch vermessen.
      </p>
      <ul className="divide-y divide-[var(--border)]">
        {books.map((b) => {
          const bio = getBioByAuthorId(b.author_id)
          const ts = slugifyTitle(b.title)
          const metaParts = [
            bio?.name ?? "Unbekannt",
            b.publication_year ? String(b.publication_year) : null,
            b.language === "de" ? "Deutsch" : "Englisch",
            b.cefr_level ? b.cefr_level.toUpperCase() : null,
          ].filter(Boolean) as string[]
          return (
            <li key={ts}>
              <Link
                href={`/buecher/${ts}`}
                className="grid grid-cols-[1fr_auto] items-baseline gap-6 py-6 group"
              >
                <div>
                  <h2 className="font-[family-name:var(--font-fraunces)] font-light text-2xl text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                    {b.title}
                  </h2>
                  <p className="text-sm text-[var(--muted)] mt-1">
                    {metaParts.join(" · ")}
                  </p>
                </div>
                <span className="text-xs text-[var(--muted)] font-mono whitespace-nowrap">
                  {b.chunk_count} Stellen
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
