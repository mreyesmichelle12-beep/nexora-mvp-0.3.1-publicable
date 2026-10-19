import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Pending } from "@/components/site/pending";
import { Section } from "@/components/site/section";
import { TeamGrid } from "@/components/site/team-grid";
import { meta, pageLd } from "@/lib/page-meta";

const T = "Conoce al equipo detrás de NEXORA", D = "El equipo fundador de NEXORA: Krissia Raquel Argueta Calona, Marjorie Nicole Flores Chávez, Ana Gabriela Torres García, Guillermo Emanuel Valladares Aguilar y Michelle Alexandra Elias Reyes.";
export const metadata = meta({ title: T, description: D, path: "/equipo" });

export default function EquipoPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/equipo" })} />
      <PageHero title="Conoce al equipo detrás de NEXORA" lead="Cinco integrantes que desarrollaron la propuesta de NEXORA como equipo fundador." />
      <Section id="integrantes" title="Equipo fundador">
        <TeamGrid />
        <div style={{ marginTop: "2rem" }}><Pending>Los roles individuales se publicarán cuando el equipo los confirme</Pending></div>
      </Section>
      <Section id="mas" tone="mist" title="Más sobre el equipo">
        <p>El equipo también desarrolló <strong>Huellas que Transforman</strong>, una iniciativa de responsabilidad social independiente de la plataforma educativa.</p>
        <Link href="/impacto-social" className="link-more">Conocer Huellas que Transforman<ChevronRight aria-hidden="true" size={18} /></Link>
      </Section>
      <CtaBand />
    </>
  );
}
