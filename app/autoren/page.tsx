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
    <main className="max-w-3xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-[family-name:var(--font-fraunces)] font-light text-5xl md:text-6xl tracking-tight text-[var(--foreground)] mb-3">
        Autoren
      </h1>
      <p className="font-[family-name:var(--font-fraunces)] italic text-[var(--muted)] mb-16">
        Zwölf Stimmen, ein Korpus. Lesen, imitieren, vergleichen.
      </p>
      <ul className="divide-y divide-[var(--border)]">
        {AUTHOR_BIOS.map((a) => {
          const chunks = chunkCountByAuthor[a.author_id] ?? 0
          return (
            <li key={a.slug}>
              <Link
                href={`/autoren/${a.slug}`}
                className="grid grid-cols-[1fr_auto] items-baseline gap-6 py-6 group"
              >
                <div>
                  <h2 className="font-[family-name:var(--font-fraunces)] font-light text-2xl text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                    {a.name}
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {a.era} · {a.language === "de" ? "Deutsch" : "Englisch"}
                  </p>
                  <p className="text-sm text-[var(--muted)] mt-3 leading-relaxed line-clamp-2 max-w-xl">
                    {a.bio_de}
                  </p>
                </div>
                {chunks > 0 && (
                  <span className="text-xs text-[var(--muted)] font-mono whitespace-nowrap">
                    {chunks} Stellen
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
