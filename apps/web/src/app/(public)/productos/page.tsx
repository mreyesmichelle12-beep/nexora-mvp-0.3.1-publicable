import Link from "next/link";
import { Camera } from "lucide-react";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Pending } from "@/components/site/pending";
import { Section } from "@/components/site/section";
import { PENDING_LABELS, PRODUCTS, PRODUCTS_INTRO } from "@/content/site";
import { meta, pageLd } from "@/lib/page-meta";

const T = "Nuestros productos", D = "Productos físicos que forman parte de la identidad de NEXORA y de sus iniciativas de sostenibilidad: termos reutilizables, agendas, tote bags y papelería.";
export const metadata = meta({ title: T, description: D, path: "/productos" });

export default function ProductosPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/productos" })} />
      <PageHero title="Nuestros productos" lead={PRODUCTS_INTRO} note="Esta página no es una tienda: NEXORA es una plataforma educativa y estos productos son una línea secundaria de identidad." />
      <Section id="linea" title="La línea NEXORA">
        <ul className="products">
          {PRODUCTS.map((p) => (
            <li key={p.name} className="product">
              <div className="product__photo" role="img" aria-label={`${p.name}: fotografía pendiente`}><Camera aria-hidden="true" size={30} strokeWidth={1.5} /><span>{PENDING_LABELS.product}</span></div>
              <h3>{p.name}</h3>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: "2rem" }}>
          <Pending>Materiales, características, precios y disponibilidad se publicarán cuando el equipo los confirme.</Pending>
        </div>
        <p className="muted" style={{ marginTop: "1.25rem" }}>¿Tienes preguntas sobre los productos? <Link href="/contacto">Escríbenos</Link>.</p>
      </Section>
      <CtaBand />
    </>
  );
}
