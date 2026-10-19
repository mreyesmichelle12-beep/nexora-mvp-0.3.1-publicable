import Link from "next/link";
import { Check } from "lucide-react";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS, PLAN_PRO_PRICE } from "@/content/site";
import { meta, pageLd } from "@/lib/page-meta";

const T = "Planes: Free y Pro", D = "NEXORA tendrá un plan Free con funciones básicas y un plan Pro con funciones adicionales. Precio previsto del Pro: de US$3 a US$5 mensuales, por confirmar.";
export const metadata = meta({ title: T, description: D, path: "/planes" });

export default function PlanesPage() {
  return (
    <>
      <JsonLd data={pageLd({ title: T, description: D, path: "/planes" })} />
      <PageHero title="Planes" lead="Un plan Free para empezar y un plan Pro con funciones adicionales." note="Los pagos aún no están habilitados y no se realiza ningún cobro. El detalle y el precio definitivos se confirman antes del lanzamiento." />
      <Section id="planes" title="Elige cómo usar NEXORA">
        <div className="plans">
          {PLANS.map((p) => (
            <Card key={p.code} className={`plan${p.code === "PRO" ? " plan--pro" : ""}`}>
              <div><Badge tone={p.code === "PRO" ? "brand" : "neutral"}>{p.name}</Badge></div>
              <h3>{p.tagline}</h3>
              <p className="plan__price">
                {p.code === "FREE" ? "Gratis" : `${PLAN_PRO_PRICE.currency}${PLAN_PRO_PRICE.min}–${PLAN_PRO_PRICE.currency}${PLAN_PRO_PRICE.max} ${PLAN_PRO_PRICE.period}`}
                {p.code === "PRO" && <small>{PLAN_PRO_PRICE.note}</small>}
              </p>
              <ul className="checklist">{p.points.map((pt) => <li key={pt}><Check aria-hidden="true" size={18} /><span>{pt}</span></li>)}</ul>
              {p.code === "FREE"
                ? <Link href="/registro" className={buttonClass("primary")}>Registrarme</Link>
                : <button type="button" className={buttonClass("secondary")} disabled aria-disabled="true">Disponible próximamente</button>}
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
