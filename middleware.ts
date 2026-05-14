import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Phase 7.5 — CSP with per-request nonces.
 *
 * Replaces the static 'unsafe-inline' CSP from next.config.ts. Generates a
 * cryptographic nonce per request, exposes it via the `x-nonce` request header
 * (Next.js 15+ then auto-stamps its framework scripts and <Script> elements),
 * and emits a strict CSP on the response.
 *
 * `'strict-dynamic'` allows nonced loader scripts (e.g. Next.js runtime,
 * Vercel Analytics) to fetch further scripts without each one needing its own
 * nonce — required for the framework to work without breakage.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isProd = process.env.NODE_ENV === 'production'

  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic'`

  const cspHeader = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.onrender.com https://va.vercel-scripts.com`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', cspHeader)
  return response
}

export const config = {
  matcher: [
    {
      // Match all paths except API routes and static assets.
      // Skip prefetch requests so cached document responses stay reusable.
      source: '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
