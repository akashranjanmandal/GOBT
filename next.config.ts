import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /* one canonical host: www.gobt.in → gobt.in */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.gobt.in" }],
        destination: "https://gobt.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
