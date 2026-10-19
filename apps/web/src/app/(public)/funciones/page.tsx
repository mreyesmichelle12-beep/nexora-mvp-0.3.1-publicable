import { Check, Clock3 } from "lucide-react";
import { CtaBand } from "@/components/site/cta-band";
import { FeatureIcon } from "@/components/site/icon-map";
import { JsonLd } from "@/components/site/json-ld";
import { MockAI, MockLibrary, MockStudyRoom } from "@/components/site/mocks";
import { PageHero } from "@/components/site/page-hero";
import { Badge } from "@/components/ui/badge";
import { AI_CAN, AI_TAGLINE, FEATURES, LIBRARY_ACTIONS, LIBRARY_CATEGORIES, PRODUCT_STATUS, SMART_MATCH_INPUTS, SMART_MATCH_WEIGHTS, STUDY_ROOM_CAPS } from "@/content/site";
import { meta, pageLd } from "@/lib/page-meta";

const T = "Funciones: Smart Match, Study Rooms, biblioteca y más", D = "Smart Match, Study Rooms, Biblioteca, NEXORA AI, Conexiones, Mensajería, Calendario, Habilidades y Progreso: qué hace cada función de NEXORA.";
export const metadata = meta({ title: T, description: D, path: "/funciones" });

const Chips = ({ items }: { items: readonly string[] }) => <ul className="chips" style={{ gap: ".5rem" }}>{items.map((i) => <li key={i}><span style={{ display: "inline-block", padding: ".2rem .7rem", borderRadius: 999, background: "var(--mist)", border: "1px solid var(--line)", fontWeight: 600, fontSize: ".9rem" }}>{i}</span></li>)}</ul>;

export default function FuncionesPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/funciones" })} />
      <PageHero title="Funciones" lead="Nueve herramientas pensadas para estudiar acompañado, organizarte y avanzar con constancia." note={PRODUCT_STATUS} />
      <div className="section" style={{ paddingBlock: "1rem 4rem" }}>
        <div className="container">
          {FEATURES.map((f) => (
            <section key={f.id} id={f.id} aria-labelledby={`${f.id}-t`} className="feature-detail">
              <div className="feature-detail__head">
                <span className="feature-row__icon"><FeatureIcon name={f.icon} /></span>
                <h2 id={`${f.id}-t`}>{f.name}</h2>
                <p>{f.summary}</p>
              </div>
              <div className="stack" style={{ ["--stack" as string]: "1.25rem" }}>
                <ul className="checklist">{f.bullets.map((b) => <li key={b}><Check aria-hidden="true" size={18} /><span>{b}</span></li>)}</ul>

                {f.id === "smart-match" && (<>
                  <h3>Qué considera</h3><Chips items={SMART_MATCH_INPUTS} />
                  <h3>Peso de cada factor</h3>
                  <ul className="weights" aria-label="Peso de cada factor en Smart Match">{SMART_MATCH_WEIGHTS.map((w) => <li key={w.factor}><span>{w.factor}</span><span className="weights__bar" aria-hidden="true"><span style={{ width: `${w.pct}%` }} /></span><span className="weights__pct">{w.pct} %</span></li>)}</ul>
                  <p className="muted">Es un algoritmo ponderado, no inteligencia artificial: por eso se muestra como “compatibilidad estimada”.</p>
                </>)}

                {f.id === "study-rooms" && (<>
                  <h3>Qué incluye y de qué depende</h3>
                  <ul className="cap">{STUDY_ROOM_CAPS.map((c) => <li key={c.name}>{c.name}{c.depends && <Badge tone="warn" icon={<Clock3 aria-hidden="true" size={14} />}>Requiere: {c.depends}</Badge>}</li>)}</ul>
                  <p className="muted">Las capacidades marcadas se activan cuando se integren esos servicios; NEXORA no las simula.</p>
                  <MockStudyRoom />
                </>)}

                {f.id === "biblioteca" && (<>
                  <h3>Tipos de recurso</h3><Chips items={LIBRARY_CATEGORIES} />
                  <h3>Qué puedes hacer</h3><Chips items={LIBRARY_ACTIONS} />
                  <p className="muted">Subir archivos requiere un almacenamiento seguro que todavía no está configurado.</p>
                  <MockLibrary />
                </>)}

                {f.id === "nexora-ai" && (<>
                  <p className="quote" style={{ fontSize: "1.15rem" }}>{AI_TAGLINE}</p>
                  <h3>Puede</h3><Chips items={AI_CAN} />
                  <p className="muted">No está pensada para hacer las tareas por ti. Requiere un proveedor de IA que todavía no está configurado.</p>
                  <MockAI />
                </>)}
              </div>
            </section>
          ))}
        </div>
      </div>
      <CtaBand />
    </>
  );
}
