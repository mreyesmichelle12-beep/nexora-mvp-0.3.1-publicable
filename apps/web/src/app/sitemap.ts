import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { publicConfig } from "@/lib/page-meta";
import { absoluteUrl } from "@/lib/seo";

/** Sólo páginas indexables; las provisionales (login, registro, demo) no aparecen. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.filter((r) => r.indexable).map((r) => ({ url: absoluteUrl(r.path, publicConfig.siteUrl), priority: r.priority }));
}
