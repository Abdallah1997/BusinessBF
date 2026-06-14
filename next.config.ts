import type { NextConfig } from "next";

const securityHeaders = [
  // Clickjacking protection: nothing on this app should ever be framed.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires inline styles (styled-jsx/Tailwind) and, in dev, eval.
      // Plaid Link loads its SDK script from cdn.plaid.com.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://cdn.plaid.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      // Plaid Link makes API calls to *.plaid.com.
      "connect-src 'self' https://*.plaid.com",
      // Plaid Link renders its modal in an iframe served from cdn.plaid.com.
      "frame-src 'self' https://cdn.plaid.com https://*.plaid.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
