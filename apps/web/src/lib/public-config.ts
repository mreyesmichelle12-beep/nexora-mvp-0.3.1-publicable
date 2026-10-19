/**
 * Configuración pública leída del entorno. Nada de esto se inventa: si falta, la interfaz
 * muestra un placeholder identificado. Recibe `env` como argumento para poder probarse.
 */
import { isValidEmail } from "./email.ts";

export interface PublicConfig {
  siteUrl: string;
  contactEmail: string | null;
  instagramUrl: string | null;
  instagramUsername: string | null;
  /** Sólo true cuando se decide lanzar. Mientras tanto: noindex + robots.txt que bloquea todo. */
  indexable: boolean;
  analytics: { provider: "plausible"; domain: string } | null;
}

type Env = Record<string, string | undefined>;

function cleanInstagramUrl(v: string | undefined): string | null {
  if (!v?.trim()) return null;
  try {
    const u = new URL(v.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (u.protocol !== "https:" || host !== "instagram.com") return null; // evita javascript: y dominios ajenos
    return u.toString();
  } catch {
    return null;
  }
}

export function readPublicConfig(env: Env): PublicConfig {
  const email = env.CONTACT_EMAIL?.trim();
  const user = env.INSTAGRAM_USERNAME?.trim().replace(/^@/, "");
  const domain = env.PLAUSIBLE_DOMAIN?.trim();
  return {
    siteUrl: (env.APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, ""),
    contactEmail: email && isValidEmail(email) ? email : null,
    instagramUrl: cleanInstagramUrl(env.INSTAGRAM_URL),
    instagramUsername: user && /^[A-Za-z0-9._]{1,30}$/.test(user) ? user : null,
    indexable: env.SITE_INDEXABLE === "true",
    analytics: env.ANALYTICS_PROVIDER === "plausible" && domain && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain) ? { provider: "plausible", domain } : null,
  };
}
