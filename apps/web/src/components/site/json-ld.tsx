import { serializeJsonLd } from "@/lib/seo";

/** Datos estructurados. El contenido se escapa para que no pueda cerrar la etiqueta <script>. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
