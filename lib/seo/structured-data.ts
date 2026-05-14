const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://literary-forge.vercel.app"

export function personSchema(name: string, era: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    description: `Autor (${era}). Stilprofil und Werke auf The Franklin Method.`,
    url: `${SITE_URL}/autoren/${slug}`,
  }
}

export function bookSchema(title: string, authorName: string, slug: string, language: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: title,
    author: { "@type": "Person", name: authorName },
    inLanguage: language,
    url: `${SITE_URL}/buecher/${slug}`,
  }
}
