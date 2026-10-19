import Link from "next/link";
import { Check } from "lucide-react";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { buttonClass } from "@/components/ui/button";
import { PRODUCT_STATUS, SCOPE, STUDENT_EXPERIENCE, STUDENT_PROFILE_FIELDS } from "@/content/site";
import { meta, pageLd } from "@/lib/page-meta";

const T = "Para estudiantes", D = "Encuentra compañeros con tus materias y horarios, estudia en Study Rooms, consulta recursos y da seguimiento a tu progreso con NEXORA.";
export const metadata = meta({ title: T, description: D, path: "/estudiantes" });

export default function EstudiantesPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/estudiantes" })} />
      <PageHero title="NEXORA para estudiantes" lead={`Encuentra compañeros, organiza sesiones y aprende colaborativamente. ${SCOPE}`} note={PRODUCT_STATUS}
        actions={<><Link href="/registro" className={buttonClass("primary", "lg")}>Registrarme</Link><Link href="/demo" className={buttonClass("secondary", "lg")}>Probar demo</Link></>} />

      <Section id="experiencia" title="Tu experiencia en NEXORA">
        <div className="grid grid--2">
          {STUDENT_EXPERIENCE.map((e) => <div key={e.id} className="stack" style={{ ["--stack" as string]: ".3rem" }}><h3>{e.title}</h3><p className="muted">{e.text}</p></div>)}
        </div>
      </Section>

      <Section id="datos" tone="mist" title="Qué te pedimos al registrarte" lead="Solo la información necesaria para conectar a estudiantes. No pedimos tu edad exacta.">
        <ul className="checklist">{STUDENT_PROFILE_FIELDS.map((f) => <li key={f}><Check aria-hidden="true" size={18} /><span>{f}</span></li>)}</ul>
        <p className="muted" style={{ marginTop: "1.25rem" }}>Tú decides quién ve tu perfil y si apareces como conexión presente en una Study Room. Consulta la <Link href="/privacidad">política de privacidad</Link>.</p>
      </Section>
      <CtaBand />
    </>
  );
}
