import { Ban, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { TeamGrid } from "@/components/site/team-grid";
import { ValueCards } from "@/components/site/value-cards";
import { COMMITMENT, COMMITMENT_QUOTE, EVOLUTION, FACILITATES, HISTORY_STEPS, MISSION, NAME_CONCEPT, NOT_LIST, PROBLEMS, PROBLEM_STATEMENT, PURPOSE, SCOPE, VALUE_PROPS, VALUE_PROP_CLOSING, VISION, WEB_NOT_APP, WHAT_IS } from "@/content/site";
import { meta, pageLd } from "@/lib/page-meta";

const T = "Nosotros: identidad, misión, visión y valores", D = "Conoce qué es NEXORA, su propósito, misión, visión y valores, cómo nació y quién está detrás del proyecto.";
export const metadata = meta({ title: T, description: D, path: "/nosotros" });

const More = ({ href, children }: { href: string; children: React.ReactNode }) => <Link href={href} className="link-more">{children}<ChevronRight aria-hidden="true" size={18} /></Link>;

export default function NosotrosPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/nosotros" })} />
      <PageHero title="Nosotros" lead={WHAT_IS} />

      <Section id="identidad" title="Qué es NEXORA">
        <div className="two-col">
          <div className="stack">
            <p>{SCOPE}</p>
            <p>{FACILITATES}</p>
            <p className="muted">{WEB_NOT_APP}</p>
          </div>
          <div className="stack">
            <p className="name-concept" aria-label="Nexo más Hora"><span className="part">{NAME_CONCEPT.nexo}</span><span className="plus" aria-hidden="true">+</span><span className="part part--b">{NAME_CONCEPT.hora}</span></p>
            <p className="muted">{NAME_CONCEPT.text}</p>
          </div>
        </div>
      </Section>

      <Section id="proposito" tone="mist" title="Nuestro propósito">
        <div className="statement"><h3>Propósito</h3><p>{PURPOSE}</p></div>
      </Section>

      <Section id="propuesta" title="Propuesta de valor" lead="NEXORA crea conexiones académicas relevantes alrededor de lo que cada estudiante necesita.">
        <div className="two-col">
          <ul className="checklist">{VALUE_PROPS.map((v) => <li key={v}><Check aria-hidden="true" size={18} /><span>{v}</span></li>)}</ul>
          <div className="stack">
            <h3>NEXORA no es</h3>
            <ul className="not-list">{NOT_LIST.map((n) => <li key={n}><Ban aria-hidden="true" size={16} />{n}</li>)}</ul>
            <p className="muted">{VALUE_PROP_CLOSING}</p>
          </div>
        </div>
      </Section>

      <Section id="mision-vision" tone="mist" title="Misión y visión">
        <div className="grid grid--2">
          <div className="statement" id="mision"><h3>Misión</h3><p>{MISSION}</p></div>
          <div className="statement" id="vision"><h3>Visión</h3><p>{VISION}</p></div>
        </div>
      </Section>

      <Section id="valores" title="Valores"><ValueCards /></Section>

      <Section id="problema" tone="mist" title="Problema identificado" lead={PROBLEM_STATEMENT}>
        <div className="two-col">
          <ul className="checklist checklist--muted">{PROBLEMS.map((p) => <li key={p}><Check aria-hidden="true" size={18} /><span>{p}</span></li>)}</ul>
          <div className="stack"><p>La propuesta de NEXORA evoluciona de un problema a una experiencia de aprendizaje colaborativo:</p><ol className="evolution" aria-label="Evolución de NEXORA">{EVOLUTION.map((e) => <li key={e}>{e}</li>)}</ol></div>
        </div>
      </Section>

      <Section id="historia" title="¿Cómo nació NEXORA?" lead="Un recorrido en siete pasos, de la necesidad al prototipo.">
        <ol className="path" aria-label="Recorrido de NEXORA">{HISTORY_STEPS.map((s) => <li key={s.id}>{s.title}</li>)}</ol>
        <More href="/historia">Leer la historia completa</More>
      </Section>

      <Section id="compromiso" tone="mist" title="Nuestro compromiso" lead="Cinco ideas que guían lo que construimos.">
        <ul className="commit">{COMMITMENT.map((c) => <li key={c.id}><h3>{c.title}</h3><p>{c.text}</p></li>)}</ul>
        <blockquote className="quote" style={{ margin: "2.5rem 0 0" }}>{COMMITMENT_QUOTE}</blockquote>
      </Section>

      <Section id="equipo" title="Conoce al equipo detrás de NEXORA" lead="Equipo fundador de cinco integrantes.">
        <TeamGrid compact />
        <More href="/equipo">Ver al equipo</More>
      </Section>
      <CtaBand />
    </>
  );
}
