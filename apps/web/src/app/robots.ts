import type { MetadataRoute } from "next";
import { publicConfig } from "@/lib/page-meta";
import { absoluteUrl } from "@/lib/seo";

/** Con SITE_INDEXABLE=false (por defecto) se bloquea TODO el sitio y no se anuncia el sitemap. */
export default function robots(): MetadataRoute.Robots {
  if (!publicConfig.indexable) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/design-system"] }],
    sitemap: absoluteUrl("/sitemap.xml", publicConfig.siteUrl),
    host: publicConfig.siteUrl,
  };
}
