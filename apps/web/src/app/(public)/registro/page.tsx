import { ComingSoon } from "@/components/site/coming-soon";
import { meta } from "@/lib/page-meta";

// Página provisional: noindex siempre y sin formularios falsos.
export const metadata = meta({ title: "Registrarme", description: "Las cuentas todavía no están habilitadas porque NEXORA está en etapa de prototipo. Cuando abramos el registro, lo anunciaremos en este sitio.", path: "/registro", index: false });

export default function Page() {
  return <ComingSoon title="El registro aún no está disponible" text="Las cuentas todavía no están habilitadas porque NEXORA está en etapa de prototipo. Cuando abramos el registro, lo anunciaremos en este sitio." />;
}
