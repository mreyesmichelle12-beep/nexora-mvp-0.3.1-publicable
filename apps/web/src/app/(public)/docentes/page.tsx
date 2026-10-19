import { Check } from "lucide-react";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { buttonClass } from "@/components/ui/button";
import { CLASS_FIELDS, CONFERENCE_FIELDS, CONFERENCE_INTRO, PRODUCT_STATUS, TEACHER_AREAS, VERIFICATION_STEPS } from "@/content/site";
import { meta, pageLd } from "@/lib/page-meta";

const T = "Para docentes, mentores y conferencistas", D = "Crea clases y Study Rooms, comparte materiales y organiza conferencias en NEXORA. Los roles de docente se verifican antes de habilitarse.";
export const metadata = meta({ title: T, description: D, path: "/docentes" });

export default function DocentesPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/docentes" })} />
      <PageHero title="NEXORA para docentes y mentores" lead="Crea espacios académicos, comparte conocimientos y acompaña a estudiantes. También puedes organizar conferencias y actividades académicas." note={PRODUCT_STATUS}
        actions={<><Link href="/registro" className={buttonClass("primary", "lg")}>Registrarme</Link><Link href="/contacto" className={buttonClass("secondary", "lg")}>Escríbenos</Link></>} />

      <Section id="docentes" title="Un espacio propio dentro del ecosistema" lead="Docentes, mentores y conferencistas tienen una experiencia diferenciada: menú, herramientas y permisos propios.">
        <div className="grid grid--2">
          {TEACHER_AREAS.map((a) => <div key={a.id} className="stack" style={{ ["--stack" as string]: ".3rem" }}><h3>{a.title}</h3><p className="muted">{a.text}</p></div>)}
        </div>
      </Section>

      <Section id="verificacion" tone="mist" title="Verificación" lead="La identidad se verifica con correo institucional o profesional, o mediante revisión administrativa. Nadie obtiene permisos de docente sin verificación.">
        <ol className="flow">{VERIFICATION_STEPS.map((s, i) => <li key={i}><p>{s}</p></li>)}</ol>
      </Section>

      <Section id="mentores" title="Docentes y mentores">
        <div className="two-col">
          <p>Docentes y mentores acompañan a estudiantes y comparten su conocimiento mediante clases, Study Rooms, materiales y mensajes dentro de la plataforma. El perfil de mentor pasa por el mismo proceso de verificación.</p>
          <div className="stack"><h3>Al crear una clase defines</h3><ul className="checklist">{CLASS_FIELDS.map((f) => <li key={f}><Check aria-hidden="true" size={18} /><span>{f}</span></li>)}</ul></div>
        </div>
      </Section>

      <Section id="conferencias" tone="mist" title="Conferencias y conferencistas" lead={CONFERENCE_INTRO}>
        <div className="two-col">
          <div className="stack"><h3>Una conferencia puede incluir</h3><ul className="checklist">{CONFERENCE_FIELDS.map((f) => <li key={f}><Check aria-hidden="true" size={18} /><span>{f}</span></li>)}</ul></div>
          <div className="stack"><h3>Privacidad de participantes</h3><p className="muted">Antes de entrar a una sesión solo se muestra la información que cada persona permite, por ejemplo cuántos participantes hay y cuántas de tus conexiones están presentes.</p></div>
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
