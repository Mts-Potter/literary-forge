import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://literary-forge.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/dashboard',
          '/train',
          '/books',
          '/settings',
          '/login',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
