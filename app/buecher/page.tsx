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
    .select("title, author_id, language")
    .eq("is_pd_eu", true)

  const map = new Map<string, { title: string; author_id: string; language: string }>()
  for (const row of data ?? []) {
    const base = (row.title as string).split(" (Teil ")[0]
    if (!map.has(base)) map.set(base, { title: base, author_id: row.author_id, language: row.language })
  }
  const books = Array.from(map.values())

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Bücher</h1>
      <p className="text-[var(--muted)] mb-8">
        {books.length} Werke aus dem Trainings-Korpus, kuratiert nach stilistischer Vielfalt.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {books.map((b) => {
          const bio = getBioByAuthorId(b.author_id)
          const ts = slugifyTitle(b.title)
          return (
            <Link
              key={ts}
              href={`/buecher/${ts}`}
              className="block bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 hover:bg-[var(--card-hover)] transition-colors"
            >
              <p className="text-xs text-[var(--muted)]">
                {bio?.name ?? "Unbekannt"} · {b.language?.toUpperCase()}
              </p>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mt-1">{b.title}</h2>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
