import type { NextConfig } from "next";

const STATIC_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.onrender.com https://va.vercel-scripts.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ")

const COMMON_SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
]

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        // Marketing/landing routes get a static CSP (no nonce) so they remain
        // CDN-cacheable. The dynamic-nonce CSP is set by middleware.ts only on
        // app routes (/train, /dashboard, /settings, /admin, /read, /welcome).
        source: "/((?!train|dashboard|settings|admin|read|welcome|api).*)",
        headers: [
          { key: "Content-Security-Policy", value: STATIC_CSP },
          ...COMMON_SECURITY_HEADERS,
        ],
      },
      {
        // App routes: middleware injects nonce-based CSP at runtime. Keep
        // the other security headers static here.
        source: "/:path*",
        headers: COMMON_SECURITY_HEADERS,
      },
    ]
  },
}

export default nextConfig
