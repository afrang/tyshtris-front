import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5068",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5068",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5070",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5070",
        pathname: "/uploads/**",
      },
    ],
  },
  // Keep document/RSC responses out of CDN/browser caches so CMS edits show up.
  // Skip hashed build assets and files with extensions (images, fonts, etc.).
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|.*\\..*).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
