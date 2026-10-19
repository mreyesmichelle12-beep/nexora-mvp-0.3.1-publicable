/** Metadatos y datos estructurados. Sólo se declara lo que es verdad y está visible en la página. */
import type { PublicConfig } from "./public-config.ts";

export const SITE_NAME = "NEXORA";
export const SITE_TAGLINE = "Conecta. Aprende. Evoluciona.";
export const DEFAULT_DESCRIPTION =
  "NEXORA es una plataforma web que conecta estudiantes, docentes y oportunidades de aprendizaje. Diseñada inicialmente para estudiantes universitarios de El Salvador.";

export function absoluteUrl(path: string, siteUrl: string): string {
  return new URL(path, siteUrl).toString();
}

export interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  /** false ⇒ noindex siempre (páginas provisionales). */
  index?: boolean;
  config: Pick<PublicConfig, "siteUrl" | "indexable">;
}

export function pageMetadata({ title, description, path, index = true, config }: PageMetaInput) {
  const url = absoluteUrl(path, config.siteUrl);
  const image = absoluteUrl("/brand/og-default.png", config.siteUrl);
  const allow = index && config.indexable;
  const fullTitle = path === "/" ? title : `${title} · ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: allow ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website" as const, siteName: SITE_NAME, locale: "es_SV", title: fullTitle, description, url, images: [{ url: image, width: 1200, height: 630, alt: "Logo de NEXORA" }] },
    twitter: { card: "summary_large_image" as const, title: fullTitle, description, images: [image] },
  };
}

/** Serializa JSON-LD de forma segura para incrustarlo en <script>: evita cerrar la etiqueta con "</script>". */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function organizationLd(c: PublicConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${c.siteUrl}/#organization`,
    name: SITE_NAME,
    url: c.siteUrl,
    logo: absoluteUrl("/brand/nexora-logo.png", c.siteUrl),
    description: DEFAULT_DESCRIPTION,
    // Sólo si el equipo configuró los datos reales:
    ...(c.instagramUrl ? { sameAs: [c.instagramUrl] } : {}),
    ...(c.contactEmail ? { contactPoint: { "@type": "ContactPoint", email: c.contactEmail, contactType: "customer support", availableLanguage: "es" } } : {}),
  };
}

export function websiteLd(c: PublicConfig) {
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${c.siteUrl}/#website`, name: SITE_NAME, url: c.siteUrl, inLanguage: "es", publisher: { "@id": `${c.siteUrl}/#organization` } };
}

export function webPageLd(c: PublicConfig, p: { name: string; description: string; path: string }) {
  return { "@context": "https://schema.org", "@type": "WebPage", name: p.name, description: p.description, url: absoluteUrl(p.path, c.siteUrl), inLanguage: "es", isPartOf: { "@id": `${c.siteUrl}/#website` } };
}

export function faqLd(items: ReadonlyArray<{ q: string; a: string }>) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) };
}

/** Sin `offers`: todavía no hay precio ni lanzamiento confirmados. */
export function softwareApplicationLd(c: PublicConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: "Plataforma web educativa para conectar estudiantes universitarios, crear Study Rooms y organizar el aprendizaje.",
    url: absoluteUrl("/plataforma", c.siteUrl),
    publisher: { "@id": `${c.siteUrl}/#organization` },
  };
}
