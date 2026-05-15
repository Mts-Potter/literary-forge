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
    <main className="max-w-3xl mx-auto px-6 md:px-8 py-20 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema(bio.name, bio.era, bio.slug)) }}
      />
      <header>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
          {bio.era} · {bio.language === "de" ? "Deutsch" : "Englisch"}
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] font-light text-[clamp(40px,6vw,72px)] leading-[1.02] tracking-[-0.015em] text-[var(--foreground)] mt-4">
          {bio.name}
        </h1>
      </header>

      <section className="pt-4 max-w-2xl">
        <p className="text-[var(--foreground)] leading-relaxed font-[family-name:var(--font-fraunces)] text-lg">{bio.bio_de}</p>
      </section>

      {profile && Object.keys(featureMeans).length > 0 && (
        <section className="pt-8">
          <p className="font-[family-name:var(--font-fraunces)] italic text-[var(--muted)] mb-2">
            — Stilprofil
          </p>
          <p className="text-xs text-[var(--muted)] mb-6 max-w-xl">
            Aggregiert aus {profile.chunk_count ?? "?"} Textstellen. Balken zeigt die Abweichung vom Korpus-Mittel (0 = Mittel, +3 = drei Standardabweichungen drüber).
          </p>

          <div className="space-y-4 max-w-2xl">
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
        <section className="pt-8">
          <p className="font-[family-name:var(--font-fraunces)] italic text-[var(--muted)] mb-4">
            — Im Korpus
          </p>
          <ul className="divide-y divide-[var(--border)] max-w-2xl">
            {titles.map(([t, count]) => {
              const ts = slugifyTitle(t)
              return (
                <li key={t}>
                  <Link
                    href={`/buecher/${ts}`}
                    className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-3 group"
                  >
                    <span className="font-[family-name:var(--font-fraunces)] text-lg text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                      {t}
                    </span>
                    <span className="text-xs text-[var(--muted)] font-mono whitespace-nowrap">
                      {count} {count === 1 ? "Stelle" : "Stellen"}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="pt-12">
        <Link
          href={`/login?next=${encodeURIComponent("/train?author=" + bio.slug)}`}
          className="inline-flex items-center gap-3 pb-2 text-[15px] font-medium text-[var(--foreground)] border-b border-[var(--foreground)] hover:gap-4 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-200"
        >
          Mit {bio.name.split(",")[0]} trainieren
          <span aria-hidden>→</span>
        </Link>
      </div>

      <p className="pt-12">
        <Link href="/autoren" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          ← Alle Autoren
        </Link>
      </p>
    </main>
  )
}
