/**
 * Last updated: 2026-04-27
 * Purpose: Next.js configuration — adds security response headers (OWASP Top 10
 *          mitigation) applied to every route via the headers() hook.
 */

import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Security headers applied to every route
// ---------------------------------------------------------------------------

const SECURITY_HEADERS = [
  // Prevent clickjacking — disallow embedding in <iframe>.
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer information sent to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by this app.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=()" },
  // Basic CSP: same-origin for scripts/styles, allow geolocation fonts from Google.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-* required for Next.js dev/prod hydration
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to every route in the application.
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
