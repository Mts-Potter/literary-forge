import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getBioByAuthorId, slugifyTitle } from "@/data/authors-bios"
import { bookSchema } from "@/lib/seo/structured-data"

function cutAtSentence(text: string, target: number): string {
  if (text.length <= target) return text
  // Look for a sentence end within ±60 chars of target
  const slice = text.slice(0, target + 60)
  const lastBoundary = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?")
  )
  if (lastBoundary >= target - 60 && lastBoundary >= 100) {
    return text.slice(0, lastBoundary + 1) + "…"
  }
  return text.slice(0, target) + "…"
}

async function loadBookBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("source_texts")
    .select("id, title, author_id, language, content, cefr_level, tags, publication_year")
    .eq("is_pd_eu", true)
  const rows = data ?? []
  const matching = rows.filter((r) => slugifyTitle(r.title as string) === slug)
  if (matching.length === 0) return null
  matching.sort((a, b) => {
    const an = parseInt((a.title.match(/Teil (\d+)/) ?? [])[1] ?? "0", 10)
    const bn = parseInt((b.title.match(/Teil (\d+)/) ?? [])[1] ?? "0", 10)
    return an - bn
  })
  const base = (matching[0].title as string).split(" (Teil ")[0]
  return {
    base_title: base,
    author_id: matching[0].author_id as string,
    language: matching[0].language as string,
    publication_year: (matching[0].publication_year as number) ?? null,
    cefr_level: (matching[0].cefr_level as string) ?? null,
    chunks: matching,
  }
}

async function loadRelatedBooks(author_id: string, currentSlug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("source_texts")
    .select("title")
    .eq("author_id", author_id)
    .eq("is_pd_eu", true)
  const seen = new Set<string>()
  const related: { title: string; slug: string }[] = []
  for (const r of data ?? []) {
    const base = (r.title as string).split(" (Teil ")[0]
    const ts = slugifyTitle(base)
    if (ts !== currentSlug && !seen.has(ts)) {
      seen.add(ts)
      related.push({ title: base, slug: ts })
    }
  }
  return related
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const book = await loadBookBySlug(slug)
  if (!book) return { title: "Buch nicht gefunden" }
  const bio = getBioByAuthorId(book.author_id)
  return {
    title: `${book.base_title} — ${bio?.name ?? "Unbekannt"} | The Franklin Method`,
    description: `${bio?.name ?? "Unbekannt"}: ${book.base_title}. ${book.chunks.length} Textstellen im Korpus, Public Domain, mit stilometrischer Analyse.`,
    alternates: { canonical: `/buecher/${slug}` },
  }
}

export default async function BuchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const book = await loadBookBySlug(slug)
  if (!book) notFound()
  const bio = getBioByAuthorId(book.author_id)
  const related = await loadRelatedBooks(book.author_id, slug)

  const metaParts = [
    book.language.toUpperCase(),
    book.publication_year ? String(book.publication_year) : null,
    book.cefr_level ? book.cefr_level.toUpperCase() : null,
  ].filter(Boolean) as string[]

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            bookSchema(book.base_title, bio?.name ?? "Unbekannt", slug, book.language)
          ),
        }}
      />

      <header>
        <p className="text-sm text-[var(--muted)] uppercase tracking-wide">
          {bio ? (
            <Link href={`/autoren/${bio.slug}`} className="underline hover:text-[var(--foreground)]">
              {bio.name}
            </Link>
          ) : (
            "Unbekannt"
          )}{" "}
          · {metaParts.join(" · ")}
        </p>
        <h1 className="text-4xl font-bold text-[var(--foreground)] mt-2">{book.base_title}</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          {book.chunks.length} Textstellen im Korpus
        </p>
      </header>

      <section className="space-y-4">
        {book.chunks.slice(0, 5).map((c) => (
          <article key={c.id} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
            <p className="text-xs text-[var(--muted)] mb-2">{c.title}</p>
            <p className="text-[var(--foreground)] leading-relaxed font-serif text-base">
              {cutAtSentence(c.content as string, 600)}
            </p>
          </article>
        ))}
        {book.chunks.length > 5 && (
          <p className="text-sm text-[var(--muted)] text-center">
            + {book.chunks.length - 5} weitere Textstellen — komplett im Training.
          </p>
        )}
      </section>

      <div className="mt-6 p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
        <p className="text-[var(--foreground)] text-base">
          {book.base_title} imitieren? Direkt starten.
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <Link
            href={`/login?next=${encodeURIComponent('/train?book=' + book.base_title)}`}
            className="px-5 py-2 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Mit diesem Werk trainieren →
          </Link>
          <Link
            href="/demo"
            className="px-5 py-2 border border-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--card-hover)] transition-colors"
          >
            Erst Demo
          </Link>
        </div>
      </div>

      {related.length > 0 && bio && (
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
            Andere Werke von {bio.name.split(",")[0]}
          </h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/buecher/${r.slug}`}
                  className="text-[var(--foreground)] underline hover:text-[var(--muted)]"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center">
        <Link href="/buecher" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline">
          ← Alle Bücher
        </Link>
      </p>
    </main>
  )
}
