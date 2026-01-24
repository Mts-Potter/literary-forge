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
            // NOTE: Conservative settings to avoid breaking Next.js functionality
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: Allow self + inline (Next.js requires inline scripts)
              // In production, consider using nonces or hashes instead of unsafe-inline
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: Allow self + inline (Next.js requires inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images: Allow self + data URIs + external CDNs if needed
              "img-src 'self' data: https:",
              // Fonts: Allow self + Google Fonts
              "font-src 'self' data: https://fonts.gstatic.com",
              // Connections (fetch/XHR): Allow self + Supabase + AWS Bedrock
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://bedrock-runtime.*.amazonaws.com",
              // Frames: Disallow all iframes (clickjacking protection)
              "frame-src 'none'",
              // Objects: Disallow plugins (Flash, etc.)
              "object-src 'none'",
              // Base URI: Only allow same origin
              "base-uri 'self'",
              // Form actions: Only allow same origin
              "form-action 'self'",
              // Upgrade insecure requests to HTTPS
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
