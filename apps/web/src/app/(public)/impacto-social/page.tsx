import { Camera, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Pending } from "@/components/site/pending";
import { Section } from "@/components/site/section";
import { IMPACT_DATA, IMPACT_GRAPHIC, IMPACT_ROLES, IMPACT_SECTIONS, IMPACT_SLOGAN, IMPACT_SUMMARY, PENDING_LABELS, impactDerived } from "@/content/site";
import { meta, pageLd } from "@/lib/page-meta";

const T = "Impacto social: Huellas que Transforman", D = "Huellas que Transforman es una iniciativa de responsabilidad social del equipo de NEXORA, orientada al bienestar animal y la participación comunitaria.";
export const metadata = meta({ title: T, description: D, path: "/impacto-social" });

const usd = (n: number) => `US$${n.toFixed(2)}`;

export default function ImpactoPage() {
  const d = IMPACT_DATA, x = impactDerived();
  const stats: Array<{ v: string; l: string; tag?: string }> = [
    { v: String(d.invited), l: "personas encuestadas/invitadas", tag: "Por confirmar: ¿encuestadas o invitadas?" },
    { v: String(d.directParticipants), l: "participantes directos" },
    { v: `${x.participationPct}%`, l: "de participación" },
    { v: String(d.dogsInShelter), l: "perros en el refugio" },
    { v: usd(d.directPurchaseUsd), l: "de compra directa" },
    { v: usd(d.estimatedDonationsUsd), l: "de donaciones estimadas" },
    { v: usd(x.estimatedResourcesUsd), l: "de recursos estimados" },
    { v: `${d.teamMembersInFieldDay} de ${d.teamMembersTotal}`, l: "integrantes participaron en la jornada de campo" },
  ];
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/impacto-social" })} />
      <PageHero title="HUELLAS QUE TRANSFORMAN" lead={IMPACT_SLOGAN} />

      <Section id="alcance" title="Una iniciativa del equipo, aparte de la plataforma">
        <p className="scope-note"><Info aria-hidden="true" size={20} /><span><strong>NEXORA</strong> es el emprendimiento y la plataforma educativa. <strong>Huellas que Transforman</strong> es una iniciativa de responsabilidad social desarrollada por el equipo, orientada al bienestar animal y la participación comunitaria. No forma parte del producto tecnológico.</span></p>
        <p style={{ marginTop: "1.25rem" }}>{IMPACT_SUMMARY}</p>
      </Section>

      <Section id="cifras" tone="mist" title="La iniciativa en cifras" lead="Datos proporcionados por el equipo. Las cifras marcadas como estimadas lo son.">
        <ul className="stats">
          {stats.map((s) => (
            <li key={s.l} className="stat"><span className="stat__value">{s.v}</span><span className="stat__label">{s.l}</span>{s.tag && <span className="badge badge--warn">{s.tag}</span>}</li>
          ))}
        </ul>
      </Section>

      <Section id="roles" title="Cinco roles, un mismo propósito" lead="Así se organizó el equipo para pasar de una invitación a una acción real.">
        <div>
          <ol className="roles">{IMPACT_ROLES.map((r) => <li key={r.n} className="role"><span className="role__n">{r.n}</span><h3>{r.title}</h3><p>{r.text}</p></li>)}</ol>
        </div>
      </Section>

      <Section id="detalle" tone="mist" title="Cómo se desarrolló">
        <nav aria-label="Secciones de la iniciativa"><ul className="impact-nav">{IMPACT_SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ul></nav>
        <div style={{ marginTop: "1.5rem" }}>
          {IMPACT_SECTIONS.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="impact-sec">
              <h3 id={`${s.id}-t`}>{s.title}</h3>
              <div className="impact-sec__body">
                {s.id === "contexto" && <p>Huellas que Transforman es una iniciativa de responsabilidad social del equipo de NEXORA. Partió de una invitación a participar y se concretó en una acción con un refugio que alberga {d.dogsInShelter} perros.</p>}
                {s.id === "planificacion" && <p>El trabajo se organizó en cinco roles: coordinación y organización; comunicación, convocatoria y vinculación; logística y donaciones; documentación y audiovisual; y resultados, evaluación y análisis.</p>}
                {s.id === "ejecucion" && <p>El equipo realizó una jornada de campo en la que participaron {d.teamMembersInFieldDay} de sus {d.teamMembersTotal} integrantes. Se realizó una compra directa de {usd(d.directPurchaseUsd)} y se estimaron {usd(d.estimatedDonationsUsd)} en donaciones.</p>}
                {s.id === "participacion" && <p>De {d.invited} personas encuestadas/invitadas, {d.directParticipants} participaron directamente: {x.participationPct}% de participación.</p>}
                {s.id === "resultados" && <p>Se estimaron {usd(x.estimatedResourcesUsd)} en recursos: {usd(d.directPurchaseUsd)} de compra directa y {usd(d.estimatedDonationsUsd)} de donaciones estimadas.</p>}
                {s.id === "evidencias" && (<>
                  <figure className="figure-img">
                    <Image src={IMPACT_GRAPHIC.src} alt={IMPACT_GRAPHIC.alt} width={IMPACT_GRAPHIC.width} height={IMPACT_GRAPHIC.height} sizes="(min-width: 900px) 864px, 100vw" loading="lazy" />
                    <figcaption>Gráfico de la iniciativa elaborado por el equipo.</figcaption>
                  </figure>
                  <ul className="gallery">{[1, 2, 3].map((n) => <li key={n} className="gallery__tile" role="img" aria-label={`Fotografía ${n} de la jornada: pendiente`}><Camera aria-hidden="true" size={26} strokeWidth={1.5} /><span>{PENDING_LABELS.photo}</span></li>)}</ul>
                  <Pending>Las fotografías y evidencias definitivas se publicarán cuando el equipo las entregue, con su texto alternativo.</Pending>
                </>)}
                {["problematica", "objetivos", "aprendizajes", "ods"].includes(s.id) && <Pending>{PENDING_LABELS.impact}</Pending>}
              </div>
            </section>
          ))}
        </div>
      </Section>

      <Section id="volver" title="¿Quieres saber más?">
        <p className="muted">Si te interesa la iniciativa o quieres colaborar, <Link href="/contacto?asunto=alianzas">escríbenos</Link>.</p>
      </Section>
      <CtaBand />
    </>
  );
}
