import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AUTHOR_BIOS, getBioBySlug, slugifyTitle } from "@/data/authors-bios"
import { personSchema } from "@/lib/seo/structured-data"
import { FEATURE_META, FEATURE_DISPLAY_ORDER, sigmaFromCorpus } from "@/lib/seo/feature-labels"
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

function computeCorpusStats(
  profiles: Array<{ feature_means: Record<string, number> }>
): Record<string, { mean: number; stddev: number }> {
  const stats: Record<string, { mean: number; stddev: number }> = {}
  if (profiles.length < 2) return stats

  // Pull each feature value across all profiles
  const collected: Record<string, number[]> = {}
  for (const p of profiles) {
    const fm = p.feature_means ?? {}
    for (const [k, v] of Object.entries(fm)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        collected[k] ??= []
        collected[k].push(v)
      }
    }
  }

  for (const [k, values] of Object.entries(collected)) {
    if (values.length < 2) continue
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    stats[k] = { mean, stddev: Math.sqrt(variance) }
  }
  return stats
}

function SigmaBar({ sigma }: { sigma: number }) {
  // Center-pivot horizontal bar; -3..+3 maps to 0..100% on a 7-step scale
  const pct = ((sigma + 3) / 6) * 100
  const leftBar = sigma < 0 ? Math.abs(sigma) * (100 / 6) : 0
  const rightBar = sigma > 0 ? sigma * (100 / 6) : 0
  return (
    <div className="relative h-2 mt-2 bg-[var(--border)] rounded overflow-hidden" aria-hidden>
      {/* Center marker */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[var(--muted)]" />
      {/* User value bar */}
      {sigma < 0 && (
        <div
          className="absolute top-0 bottom-0 bg-[var(--foreground)] opacity-80"
          style={{ right: "50%", width: `${leftBar}%` }}
        />
      )}
      {sigma > 0 && (
        <div
          className="absolute top-0 bottom-0 bg-[var(--foreground)] opacity-80"
          style={{ left: "50%", width: `${rightBar}%` }}
        />
      )}
      {/* Dot at exact position */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-[var(--foreground)]"
        style={{ left: `calc(${pct}% - 2px)` }}
      />
    </div>
  )
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
  const [{ data: profile }, { data: chunks }, { data: allProfiles }] =
    await Promise.all([
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
      supabase.from("author_style_profiles").select("feature_means"),
    ])

  const uniqueTitlesMap = new Map<string, number>()
  for (const c of chunks ?? []) {
    const base = (c.title as string).split(" (Teil ")[0]
    uniqueTitlesMap.set(base, (uniqueTitlesMap.get(base) ?? 0) + 1)
  }
  const titles = Array.from(uniqueTitlesMap.entries())
  const featureMeans = (profile?.feature_means ?? {}) as Record<string, number>
  const corpusStats = computeCorpusStats(
    (allProfiles ?? []) as Array<{ feature_means: Record<string, number> }>
  )

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
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">Stilprofil</h2>
          <p className="text-xs text-[var(--muted)] mb-5">
            Aggregiert aus {profile.chunk_count ?? "?"} Textstellen. Balken
            zeigt die Abweichung vom Korpus-Mittel (0 = Mittel, +3 = drei
            Standardabweichungen drüber).
          </p>

          <div className="space-y-4">
            {FEATURE_DISPLAY_ORDER.filter(
              (key) => featureMeans[key] !== undefined && corpusStats[key]
            )
              .slice(0, 10)
              .map((key) => {
                const meta = FEATURE_META[key]
                const value = featureMeans[key] as number
                const cs = corpusStats[key]
                const sigma = sigmaFromCorpus(value, cs.mean, cs.stddev)
                const sign = sigma >= 0 ? "+" : ""
                return (
                  <div key={key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--foreground)]">
                          {meta?.label ?? key}
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-0.5">
                          {meta?.short ?? "—"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono text-[var(--foreground)]">
                          {value.toFixed(2)}
                          {meta?.unit ? ` ${meta.unit}` : ""}
                        </div>
                        <div className="text-xs text-[var(--muted)] font-mono">
                          {sign}
                          {sigma.toFixed(1)} σ
                        </div>
                      </div>
                    </div>
                    <SigmaBar sigma={sigma} />
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {titles.length > 0 && (
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Im Korpus</h2>
          <ul className="space-y-2">
            {titles.map(([t, count]) => {
              const ts = slugifyTitle(t)
              return (
                <li key={t} className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/buecher/${ts}`}
                    className="text-[var(--foreground)] underline hover:text-[var(--muted)]"
                  >
                    {t}
                  </Link>
                  <span className="text-xs text-[var(--muted)] font-mono">
                    {count} {count === 1 ? "Textstelle" : "Textstellen"}
                  </span>
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
            href={`/login?next=${encodeURIComponent("/train?author=" + bio.slug)}`}
            className="px-5 py-2 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Mit {bio.name.split(",")[0]} trainieren →
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
