import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
import { CtaBand } from "@/components/site/cta-band";
import { FeatureIcon } from "@/components/site/icon-map";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { ValueCards } from "@/components/site/value-cards";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { AUDIENCES, FEATURES, FLOW, INTEGRATIONS_PENDING, PRODUCT_STATUS, WEB_NOT_APP } from "@/content/site";
import { meta, pageLd, publicConfig } from "@/lib/page-meta";
import { softwareApplicationLd } from "@/lib/seo";

const T = "Plataforma: cómo funciona NEXORA", D = "Del registro al seguimiento de tu progreso: perfil académico, Smart Match, conexiones, Study Rooms, biblioteca y NEXORA AI en una plataforma web.";
export const metadata = meta({ title: T, description: D, path: "/plataforma" });

export default function PlataformaPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/plataforma" })} />
      <JsonLd data={softwareApplicationLd(publicConfig)} />
      <PageHero title="La plataforma NEXORA" lead={`Una plataforma web que reúne a estudiantes, docentes y recursos de aprendizaje. ${WEB_NOT_APP}`} note={PRODUCT_STATUS}
        actions={<><Link href="/demo" className={buttonClass("primary", "lg")}>Probar demo</Link><Link href="/funciones" className={buttonClass("secondary", "lg")}>Ver funciones</Link></>} />

      <Section id="flujo" title="Cómo funciona" lead="El recorrido de una persona dentro de NEXORA, paso a paso.">
        <ol className="flow">{FLOW.map((s) => <li key={s.title}><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
      </Section>

      <Section id="incluye" tone="mist" title="Qué integra la plataforma" lead="Nueve funciones que trabajan juntas, más espacios para docentes, mentores y anfitriones de conferencias.">
        <ul className="feature-list">
          {FEATURES.map((f) => (
            <li key={f.id} className="feature-row">
              <span className="feature-row__icon"><FeatureIcon name={f.icon} /></span>
              <div><h3>{f.name}</h3><p>{f.summary}</p></div>
              <Link href={`/funciones#${f.id}`} className="link-more feature-row__link" style={{ marginTop: 0 }}>Más sobre {f.name}<ChevronRight aria-hidden="true" size={18} /></Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="para-quien" title="Para quién es">
        <div className="grid grid--3">
          {AUDIENCES.map((a) => <div key={a.id} className="stack"><h3>{a.title}</h3><p className="muted">{a.text}</p><Link href={a.href} className="link-more">Ver más<ChevronRight aria-hidden="true" size={18} /></Link></div>)}
        </div>
      </Section>

      <Section id="valores" tone="mist" title="Principios que la guían"><ValueCards /></Section>

      <Section id="estado" title="Estado del prototipo" lead="Qué necesita cada capacidad para ser real. Ninguna de estas integraciones está configurada todavía, y NEXORA no simula que lo esté.">
        <ul className="deps">
          {INTEGRATIONS_PENDING.map((i) => (
            <li key={i.name}><strong>{i.name}</strong><span className="muted">Requiere: {i.needed}</span><Badge tone="warn" icon={<Clock3 aria-hidden="true" size={14} />}>Integración pendiente</Badge></li>
          ))}
        </ul>
      </Section>
      <CtaBand />
    </>
  );
}
