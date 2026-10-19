import { ComingSoon } from "@/components/site/coming-soon";
import { meta } from "@/lib/page-meta";

// Página provisional: noindex siempre y sin formularios falsos.
export const metadata = meta({ title: "Probar demo", description: "Estamos preparando una demostración con datos ficticios para que explores NEXORA sin crear una cuenta. Todavía no está lista.", path: "/demo", index: false });

export default function Page() {
  return <ComingSoon title="El modo demo aún no está disponible" text="Estamos preparando una demostración con datos ficticios para que explores NEXORA sin crear una cuenta. Todavía no está lista." />;
}
