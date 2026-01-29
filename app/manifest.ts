import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Literary Forge - KI Schreibtraining',
    short_name: 'LitForge',
    description: 'KI-gestütztes Training für stilistische Mimesis und literarischen Schreibstil',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['education', 'productivity', 'writing'],
    lang: 'de',
    dir: 'ltr',
    orientation: 'any',
  }
}
