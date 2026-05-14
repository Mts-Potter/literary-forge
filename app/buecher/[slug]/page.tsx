import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getBioByAuthorId, slugifyTitle } from "@/data/authors-bios"
import { bookSchema } from "@/lib/seo/structured-data"

async function loadBookBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("source_texts")
    .select("id, title, author_id, language, content, cefr_level, tags")
    .eq("is_pd_eu", true)
  const rows = data ?? []
  // Find first chunk whose base-title matches the slug
  const matching = rows.filter((r) => slugifyTitle(r.title as string) === slug)
  if (matching.length === 0) return null
  // Sort by " (Teil X)" suffix for stable display
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
    chunks: matching,
  }
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
          · {book.language.toUpperCase()}
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
              {(c.content as string).slice(0, 600)}
              {(c.content as string).length > 600 && "…"}
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

      <p className="text-center">
        <Link href="/buecher" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline">
          ← Alle Bücher
        </Link>
      </p>
    </main>
  )
}
