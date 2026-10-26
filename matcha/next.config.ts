import type { NextConfig } from "next";

// same test as src/server/nextHandler.ts
const isDev = process.env.NODE_ENV !== "production";

// Everything is same-origin: pictures come from /api, geolocation services are
// called server-side, socket.io and the dev HMR websocket go through 'self'.
// 'unsafe-inline' scripts: Next.js inlines its hydration data without a nonce
// (a nonce would require a proxy and dynamic rendering of every page).
// 'unsafe-eval' in dev only: React dev tooling and HMR use eval.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  assetPrefix: '',
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
