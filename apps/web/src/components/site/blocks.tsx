import Link from "next/link";
import type { ReactNode } from "react";
import { Camera, Info } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { readPublicConfig } from "@/lib/public-config";
import { webPageLd } from "@/lib/seo";
import { Icon } from "./icons";
import { JsonLd } from "./json-ld";

export { JsonLd };

/** Datos estructurados WebPage de cada página, construidos con la configuración real. */
export function PageLd({ path, name, description }: { path: string; name: string; description: string }) {
  return <JsonLd data={webPageLd(readPublicConfig(process.env), { name, description, path })} />;
}

export function PageHero({ title, lead, crumb }: { title: string; lead: string; crumb?: string }) {
  return (
    <header className="page-header">
      <div className="container page-header__inner">
        {crumb && (
          <nav aria-label="Ruta de navegación" className="crumbs">
            <ol><li><Link href="/">Inicio</Link></li><li aria-current="page">{crumb}</li></ol>
          </nav>
        )}
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </div>
    </header>
  );
}

export function Section({ children, tone, labelledBy, id }: { children: ReactNode; tone?: "mist" | "ink"; labelledBy?: string; id?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`section${tone ? ` section--${tone}` : ""}${tone === "ink" ? " on-dark" : ""}`}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHead({ id, title, lead }: { id?: string; title: string; lead?: string }) {
  return (
    <div className="section__head">
      <h2 id={id}>{title}</h2>
      {lead && <p>{lead}</p>}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="note" role="note">
      <Info aria-hidden="true" size={18} />
      <p>{children}</p>
    </div>
  );
}

/** Contenido que el equipo aún debe proporcionar: visible, sobrio y siempre identificado. */
export function Pending({ what, children }: { what: string; children?: ReactNode }) {
  return (
    <div className="pending" data-pending="true">
      <span className="badge badge--warn">Pendiente</span>
      <p><strong>{what}</strong>{children ? <> — {children}</> : null}</p>
    </div>
  );
}

export function PhotoPlaceholder({ label, round = false }: { label: string; round?: boolean }) {
  return (
    <div className={`photo-slot${round ? " photo-slot--round" : ""}`} role="img" aria-label={`Espacio reservado, fotografía pendiente: ${label}`} data-pending="true">
      <Camera aria-hidden="true" size={26} strokeWidth={1.5} />
      <span>Fotografía pendiente</span>
      <small>{label}</small>
    </div>
  );
}

export function LinkMore({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="text-link">{children}</Link>;
}

export function CtaBand({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <section className="section section--ink on-dark" aria-label={title}>
      <div className="container cta-band">
        <div><h2>{title}</h2><p>{lead}</p></div>
        <div className="actions">{children}</div>
      </div>
    </section>
  );
}

/** Pareja de CTA habitual sobre fondo oscuro. */
export function CtaLinks() {
  return (
    <>
      <Link href="/demo" className={buttonClass("on-dark", "lg")}>Probar demo</Link>
      <Link href="/registro" className={buttonClass("outline-on-dark", "lg")}>Registrarme</Link>
    </>
  );
}

export function CheckList({ items, plain = false }: { items: string[]; plain?: boolean }) {
  return (
    <ul className={`bullets${plain ? " bullets--plain" : ""}`}>
      {items.map((t) => (
        <li key={t}>{!plain && <Icon name="check" size={18} className="bullets__icon" />}<span>{t}</span></li>
      ))}
    </ul>
  );
}

/** Ocho pasos del flujo. `compact` oculta el texto largo (versión de la página de inicio). */
export function FlowSteps({ steps, compact = false }: { steps: Array<{ title: string; text: string }>; compact?: boolean }) {
  return (
    <ol className={`flow${compact ? " flow--compact" : ""}`}>
      {steps.map((s, i) => (
        <li key={s.title} className="flow__item">
          <span className="flow__num" aria-hidden="true">{i + 1}</span>
          <h3>{s.title}</h3>
          {!compact && <p>{s.text}</p>}
        </li>
      ))}
    </ol>
  );
}

/** Pesos de Smart Match como barras con porcentaje en texto (no depende del color). */
export function WeightBars({ weights }: { weights: ReadonlyArray<{ label: string; weight: number }> }) {
  return (
    <ul className="weights">
      {weights.map((w) => (
        <li key={w.label}>
          <div className="weights__head"><span>{w.label}</span><strong>{w.weight} %</strong></div>
          <div className="weights__bar" aria-hidden="true"><span style={{ width: `${w.weight}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

/** Preguntas frecuentes con <details>: accesible por teclado y sin JavaScript. */
export function FaqList({ items }: { items: ReadonlyArray<{ id?: string; q: string; a: string }> }) {
  return (
    <div className="faq">
      {items.map((it) => (
        <details key={it.q}>
          <summary>{it.q}</summary>
          <div><p>{it.a}</p></div>
        </details>
      ))}
    </div>
  );
}

export function Illustrative({ children = "Ejemplo ilustrativo · datos ficticios" }: { children?: ReactNode }) {
  return <span className="badge badge--brand">{children}</span>;
}
