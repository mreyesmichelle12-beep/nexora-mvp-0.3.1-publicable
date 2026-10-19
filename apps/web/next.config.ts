import type { NextConfig } from "next";
import { STATIC_SECURITY_HEADERS } from "./src/lib/security/csp.ts";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no anunciar la tecnología del servidor
  transpilePackages: ["@nexora/db"],
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      { source: "/:path*", headers: [...STATIC_SECURITY_HEADERS] },
      // Los archivos de marca son inmutables por versión: caché larga.
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default config;
