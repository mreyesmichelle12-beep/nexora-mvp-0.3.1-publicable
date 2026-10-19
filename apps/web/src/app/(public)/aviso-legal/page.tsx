import { LegalPage, ResponsibleEntity } from "@/components/site/legal";
import { Pending } from "@/components/site/pending";
import { meta } from "@/lib/page-meta";

const T = "Aviso legal", D = "Información legal sobre el titular de este sitio, la propiedad intelectual y los límites de responsabilidad de NEXORA.";
export const metadata = meta({ title: T, description: D, path: "/aviso-legal" });

export default function Page() {
  return (
    <LegalPage title={T} path="/aviso-legal" description={D}>
      <h2>Titular del sitio</h2>
      <ResponsibleEntity />
      <h2>Naturaleza del proyecto</h2>
      <p>NEXORA es un emprendimiento de tecnología educativa en etapa de prototipo. Este sitio no representa a ninguna universidad ni establece alianzas con instituciones. La referencia a la Universidad Don Bosco describe el punto de partida de la propuesta.</p>
      <h2>Propiedad intelectual</h2>
      <p>El nombre, el logo y los contenidos originales de este sitio pertenecen a sus titulares. Su reproducción requiere autorización.</p>
      <h2>Contenido informativo</h2>
      <p>La información de este sitio es de carácter general y describe el diseño de la plataforma. Puede cambiar sin previo aviso mientras NEXORA esté en desarrollo.</p>
      <h2>Enlaces externos</h2>
      <p>No somos responsables del contenido de sitios de terceros enlazados desde aquí (por ejemplo, redes sociales).</p>
      <h2>Registro y datos fiscales</h2>
      <Pending>Registro mercantil, identificación fiscal y demás datos legales, si corresponden</Pending>
    </LegalPage>
  );
}
