import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * SECURITY L-1: Security Headers
   * Protects against XSS, Clickjacking, MITM, and other common attacks
   */
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            // Prevents clickjacking attacks by disallowing iframe embedding
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Prevents MIME-sniffing attacks
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Controls how much referrer information is sent
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Restricts browser features (camera, microphone, geolocation)
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Content Security Policy - protects against XSS attacks
            // NOTE: 'unsafe-eval' nur in Dev (Next.js HMR), 'unsafe-inline' bleibt
            // für Production (Next.js injiziert inline scripts; nonce-Migration
            // ist eigene Phase, siehe Plan Phase 7.5 für Followup).
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              process.env.NODE_ENV === 'production'
                ? "script-src 'self' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              // Connections: self + Supabase + Render NLP + Vercel Analytics
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co " +
                "https://*.onrender.com https://va.vercel-scripts.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            // Strict-Transport-Security (HSTS): Force HTTPS for 1 year
            // NOTE: Only applied in production by Vercel
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
