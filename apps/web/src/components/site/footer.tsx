import Link from "next/link";
import { Instagram, Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { FOOTER_COLUMNS, TAGLINE } from "@/content/site";
import type { PublicConfig } from "@/lib/public-config";

export function Footer({ config }: { config: Pick<PublicConfig, "instagramUrl" | "instagramUsername" | "contactEmail"> }) {
  return (
    <footer className="site-footer on-dark">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <p className="footer__brand-name"><Logo variant="mark" width={44} />NEXORA</p>
            <p>{TAGLINE}</p>
            <ul className="stack" style={{ ["--stack" as string]: ".5rem" }}>
              <li>
                {config.instagramUrl ? (
                  <a href={config.instagramUrl} className="footer__social" rel="noopener noreferrer" target="_blank">
                    <Instagram aria-hidden="true" size={18} />
                    Instagram{config.instagramUsername ? ` @${config.instagramUsername}` : ""}<span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </a>
                ) : (
                  <span className="footer__social"><Instagram aria-hidden="true" size={18} />Instagram oficial: pendiente</span>
                )}
              </li>
              <li>
                {config.contactEmail ? (
                  <a href={`mailto:${config.contactEmail}`} className="footer__social"><Mail aria-hidden="true" size={18} />{config.contactEmail}</a>
                ) : (
                  <span className="footer__social"><Mail aria-hidden="true" size={18} />Correo oficial: pendiente</span>
                )}
              </li>
            </ul>
          </div>
          <nav aria-label="Pie de página" className="footer__cols">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h2>{col.title}</h2>
                <ul>{col.links.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="footer__bottom">
          <p>© 2026 NEXORA</p>
          <p>Plataforma web educativa en etapa de prototipo.</p>
        </div>
      </div>
    </footer>
  );
}
