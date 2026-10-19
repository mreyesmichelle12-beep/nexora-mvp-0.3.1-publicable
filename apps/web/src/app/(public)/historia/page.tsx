import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { EVOLUTION, HISTORY_NOTE, HISTORY_STEPS } from "@/content/site";
import { meta, pageLd } from "@/lib/page-meta";

const T = "¿Cómo nació NEXORA?", D = "La historia de NEXORA: del problema de encontrar compañeros compatibles a una plataforma web educativa en etapa de prototipo.";
export const metadata = meta({ title: T, description: D, path: "/historia" });

export default function HistoriaPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/historia" })} />
      <PageHero title="¿Cómo nació NEXORA?" lead="Del problema de encontrar compañeros compatibles a una plataforma web pensada para conectar el aprendizaje." note={HISTORY_NOTE} />
      <Section id="relato" title="Siete pasos, de la necesidad al prototipo">
        <ol className="history">
          {HISTORY_STEPS.map((s) => <li key={s.id}><h3>{s.title}</h3><p className="muted" style={{ gridColumn: 2 }}>{s.text}</p></li>)}
        </ol>
      </Section>
      <Section id="evolucion" tone="mist" title="La idea, en una línea">
        <ol className="evolution" aria-label="Evolución de NEXORA">{EVOLUTION.map((e) => <li key={e}>{e}</li>)}</ol>
        <Link href="/equipo" className="link-more">Conocer al equipo<ChevronRight aria-hidden="true" size={18} /></Link>
      </Section>
      <CtaBand />
    </>
  );
}
