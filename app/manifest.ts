import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Franklin Method',
    short_name: 'Franklin Method',
    description: 'Schreibstil-Training nach Benjamin Franklins Methode, mit KI-Feedback.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf7f0',
    theme_color: '#1a1612',
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
