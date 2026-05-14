import type { Metadata } from "next"
import Link from "next/link"
import { AUTHOR_BIOS } from "@/data/authors-bios"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Autoren | The Franklin Method",
  description: "Zwölf Autoren von Kafka bis Austen — Stilprofile und Bibliografien aus dem Lern-Korpus.",
  alternates: { canonical: "/autoren" },
}

export default async function AutorenIndex() {
  // Fetch chunk_count per author so cards can show corpus depth
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from("author_style_profiles")
    .select("author_id, chunk_count")
  const chunkCountByAuthor: Record<string, number> = {}
  for (const p of profiles ?? []) {
    chunkCountByAuthor[p.author_id as string] = (p.chunk_count as number) ?? 0
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Autoren</h1>
      <p className="text-[var(--muted)] mb-8">
        Die zwölf Stimmen, an denen du trainieren kannst.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AUTHOR_BIOS.map((a) => {
          const chunks = chunkCountByAuthor[a.author_id] ?? 0
          return (
            <Link
              key={a.slug}
              href={`/autoren/${a.slug}`}
              className="block bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 hover:bg-[var(--card-hover)] transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{a.name}</h2>
                {chunks > 0 && (
                  <span className="text-xs text-[var(--muted)] font-mono shrink-0">
                    {chunks} Textstellen
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                {a.era} · {a.language === "de" ? "Deutsch" : "Englisch"}
              </p>
              <p className="text-sm text-[var(--foreground)] mt-3 leading-relaxed line-clamp-3">
                {a.bio_de}
              </p>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
