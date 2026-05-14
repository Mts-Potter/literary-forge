import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AUTHOR_BIOS, slugifyTitle } from '@/data/authors-bios'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://literary-forge.vercel.app'
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${siteUrl}/methode`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/demo`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${siteUrl}/autoren`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/buecher`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/kontakt`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/impressum`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/datenschutz`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/urheberrecht`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const authorEntries: MetadataRoute.Sitemap = AUTHOR_BIOS.map((a) => ({
    url: `${siteUrl}/autoren/${a.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Books: query distinct titles from DB
  let bookEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('source_texts')
      .select('title')
      .eq('is_pd_eu', true)
    const seen = new Set<string>()
    for (const r of data ?? []) {
      const base = (r.title as string).split(' (Teil ')[0]
      const s = slugifyTitle(base)
      if (s && !seen.has(s)) {
        seen.add(s)
        bookEntries.push({
          url: `${siteUrl}/buecher/${s}`,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    }
  } catch {
    // best-effort; if DB is unreachable at build time, ship the static portion
  }

  return [...staticEntries, ...authorEntries, ...bookEntries]
}
