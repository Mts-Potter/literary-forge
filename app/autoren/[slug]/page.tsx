import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AUTHOR_BIOS, getBioBySlug, slugifyTitle } from "@/data/authors-bios"
import { personSchema } from "@/lib/seo/structured-data"
import { createClient } from "@/lib/supabase/server"

export async function generateStaticParams() {
  return AUTHOR_BIOS.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const bio = getBioBySlug(slug)
  if (!bio) return { title: "Autor nicht gefunden" }
  return {
    title: `${bio.name} — Stilprofil | The Franklin Method`,
    description: bio.bio_de.slice(0, 155),
    alternates: { canonical: `/autoren/${bio.slug}` },
  }
}

export default async function AutorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const bio = getBioBySlug(slug)
  if (!bio) notFound()

  const supabase = await createClient()
  const [{ data: profile }, { data: chunks }] = await Promise.all([
    supabase
      .from("author_style_profiles")
      .select("feature_means, chunk_count")
      .eq("author_id", bio.author_id)
      .single(),
    supabase
      .from("source_texts")
      .select("title")
      .eq("author_id", bio.author_id)
      .eq("is_pd_eu", true),
  ])

  const uniqueTitlesMap = new Map<string, string>()
  for (const c of chunks ?? []) {
    const base = (c.title as string).split(" (Teil ")[0]
    if (!uniqueTitlesMap.has(base)) uniqueTitlesMap.set(base, base)
  }
  const titles = Array.from(uniqueTitlesMap.keys())
  const featureMeans = (profile?.feature_means ?? {}) as Record<string, number>

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema(bio.name, bio.era, bio.slug)) }}
      />
      <header>
        <p className="text-sm text-[var(--muted)] uppercase tracking-wide">
          {bio.era} · {bio.language === "de" ? "Deutsch" : "Englisch"}
        </p>
        <h1 className="text-4xl font-bold text-[var(--foreground)] mt-2">{bio.name}</h1>
      </header>

      <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
        <p className="text-[var(--foreground)] leading-relaxed">{bio.bio_de}</p>
      </section>

      {profile && Object.keys(featureMeans).length > 0 && (
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Stilprofil</h2>
          <p className="text-xs text-[var(--muted)] mb-4">
            Aggregiert aus {profile.chunk_count ?? "?"} Textstellen.
          </p>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {Object.entries(featureMeans).slice(0, 9).map(([key, value]) => (
              <div key={key}>
                <dt className="text-[var(--muted)] text-xs">{key}</dt>
                <dd className="text-[var(--foreground)] font-mono">
                  {typeof value === "number" ? value.toFixed(2) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {titles.length > 0 && (
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Im Korpus</h2>
          <ul className="space-y-2">
            {titles.map((t) => {
              const ts = slugifyTitle(t)
              return (
                <li key={t}>
                  <Link
                    href={`/buecher/${ts}`}
                    className="text-[var(--foreground)] underline hover:text-[var(--muted)]"
                  >
                    {t}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="mt-10 p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
        <p className="text-[var(--foreground)] text-base">
          {bio.name} imitieren? Direkt starten.
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <Link
            href={`/login?next=${encodeURIComponent('/train?author=' + bio.slug)}`}
            className="px-5 py-2 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Mit {bio.name.split(',')[0]} trainieren →
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
        <Link href="/autoren" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline">
          ← Alle Autoren
        </Link>
      </p>
    </main>
  )
}
