import type { ReactNode } from "react";
import { FileWarning } from "lucide-react";
import { JsonLd } from "./json-ld";
import { PageHero } from "./page-hero";
import { Pending } from "./pending";
import { pageLd } from "@/lib/page-meta";

/** Estructura común de páginas legales. Son BORRADORES: deben ser revisados por un abogado antes del lanzamiento. */
export function LegalPage({ title, path, description, children }: { title: string; path: string; description: string; children: ReactNode }) {
  return (
    <>
      <JsonLd data={pageLd({ title, description, path })} />
      <PageHero title={title} lead="Última actualización: pendiente de definir al publicar la versión oficial." />
      <div className="section">
        <div className="container stack" style={{ ["--stack" as string]: "1.5rem" }}>
          <p className="legal-draft" role="note"><FileWarning aria-hidden="true" size={20} /><span><strong>Borrador pendiente de revisión legal.</strong> Este texto describe cómo está diseñado NEXORA y no constituye asesoría jurídica ni afirma cumplimiento de ninguna normativa. Será revisado por un profesional antes del lanzamiento.</span></p>
          <div className="prose">{children}</div>
        </div>
      </div>
    </>
  );
}

export const ResponsibleEntity = () => <Pending>Nombre o razón social, domicilio y datos de contacto de la persona o entidad responsable</Pending>;
