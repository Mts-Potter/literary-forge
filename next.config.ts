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
