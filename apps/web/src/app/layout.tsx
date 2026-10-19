import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Figtree, Sora } from "next/font/google";
import { readPublicConfig } from "@/lib/public-config";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/ui.css";
import "@/styles/pages.css";
import "@/styles/site.css";
import "@/styles/site.css";

// next/font aplica estas familias vía variables; si fallan, queda el stack de sistema definido en tokens.css
const display = Sora({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const config = readPublicConfig(process.env);

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/brand/icon-192.png" },
  // Mientras SITE_INDEXABLE no sea "true", nada se indexa (el sitio aún tiene placeholders).
  robots: config.indexable ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0A2744", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Leer headers() hace el render dinámico, requisito para que Next aplique el nonce de la CSP.
  await headers();
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
