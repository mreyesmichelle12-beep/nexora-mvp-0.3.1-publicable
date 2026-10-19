import { readPublicConfig } from "./public-config.ts";
import { pageMetadata, webPageLd } from "./seo.ts";

/** Configuración pública resuelta una vez por proceso (servidor). */
export const publicConfig = readPublicConfig(process.env);

export function meta(o: { title: string; description: string; path: string; index?: boolean }) {
  return pageMetadata({ ...o, config: publicConfig });
}

export function pageLd(o: { title: string; description: string; path: string }) {
  return webPageLd(publicConfig, { name: o.title, description: o.description, path: o.path });
}
