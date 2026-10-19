import { ComingSoon } from "@/components/site/coming-soon";
import { meta } from "@/lib/page-meta";

// Página provisional: noindex siempre y sin formularios falsos.
export const metadata = meta({ title: "Iniciar sesión", description: "Las cuentas todavía no están habilitadas porque NEXORA está en etapa de prototipo. Cuando lo estén, podrás entrar desde aquí.", path: "/iniciar-sesion", index: false });

export default function Page() {
  return <ComingSoon title="El inicio de sesión aún no está disponible" text="Las cuentas todavía no están habilitadas porque NEXORA está en etapa de prototipo. Cuando lo estén, podrás entrar desde aquí." />;
}
