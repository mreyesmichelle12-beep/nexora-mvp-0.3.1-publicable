import { JsonLd } from "@/components/site/json-ld";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { FAQ } from "@/content/site";
import { meta, pageLd } from "@/lib/page-meta";
import { faqLd } from "@/lib/seo";

const T = "Preguntas frecuentes", D = "Respuestas sobre qué es NEXORA, para quién es, cómo funcionan Smart Match y NEXORA AI, la verificación de docentes, los planes y tus datos.";
export const metadata = meta({ title: T, description: D, path: "/faq" });

export default function FaqPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/faq" })} />
      <JsonLd data={faqLd(FAQ)} />
      <PageHero title="Preguntas frecuentes" lead="Lo que más nos preguntan sobre NEXORA." />
      <Section id="preguntas" title="Sobre NEXORA">
        <div className="faq">{FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
      </Section>
      <CtaBand title="¿No encuentras tu respuesta?" text="Escríbenos y te ayudamos." />
    </>
  );
}
