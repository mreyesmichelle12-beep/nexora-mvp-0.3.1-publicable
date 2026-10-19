import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBanner } from "@/components/ui/demo-banner";
import { Logo } from "@/components/ui/logo";
import { StateBlock, type StateKind } from "@/components/ui/state-block";
import { TextField } from "@/components/ui/text-field";
import { getIntegrationStatuses } from "@/lib/config/integrations";

export const metadata = { title: "Sistema de diseño", robots: { index: false, follow: false } };

const SWATCHES = [
  { name: "ink", hex: "#0A2744", use: "Texto y fondos oscuros", ratio: "15.15" },
  { name: "brand", hex: "#5B2FC4", use: "Acción principal", ratio: "7.93" },
  { name: "azure.link", hex: "#0B63C5", use: "Enlaces", ratio: "5.82" },
  { name: "muted", hex: "#4A5B78", use: "Texto secundario", ratio: "6.87" },
  { name: "mist", hex: "#F4F6FC", use: "Superficies", ratio: "—" },
  { name: "azure", hex: "#1280EA", use: "Foco y gráficos (no texto)", ratio: "3.96" },
];
const STATES: StateKind[] = ["loading", "empty", "error", "success", "offline", "forbidden", "deleted", "blocked", "file-rejected"];

export default function DesignSystemPage() {
  // Página interna: no existe en producción.
  if (process.env.NODE_ENV === "production") notFound();
  const integrations = getIntegrationStatuses(process.env);

  return (
    <>
      <DemoBanner />
      <main id="contenido" className="ds">
        <header>
          <Logo width={176} />
          <h1>Sistema de diseño</h1>
          <p className="muted">Referencia interna de la Entrega 1. No se publica en producción.</p>
        </header>

        <section aria-labelledby="color">
          <h2 id="color">Color</h2>
          <ul className="ds-swatches">
            {SWATCHES.map((s) => (
              <li key={s.name} className="ds-swatch">
                <span aria-hidden="true" className="ds-swatch__chip" style={{ background: s.hex }} />
                <span>
                  <strong>{s.name} <span className="muted">{s.hex}</span></strong>
                  <small>{s.use}{s.ratio !== "—" && ` · contraste ${s.ratio}:1`}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tipo">
          <h2 id="tipo">Tipografía</h2>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", fontWeight: 700 }}>Sora — títulos</p>
          <p>Figtree — texto de lectura, a 16 px o más y con ancho máximo de 68 caracteres.</p>
        </section>

        <section aria-labelledby="botones">
          <h2 id="botones">Botones</h2>
          <div className="ds-row">
            <Button>Crear cuenta</Button>
            <Button variant="secondary">Probar demo</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="danger">Eliminar archivo</Button>
            <Button loading loadingLabel="Guardando…">Guardar cambios</Button>
            <Button disabled>No disponible</Button>
          </div>
        </section>

        <section aria-labelledby="campos">
          <h2 id="campos">Campos de formulario</h2>
          <Card className="form-grid">
            <TextField label="Correo institucional" type="email" name="email" required hint="Usa el correo de tu universidad." />
            <TextField label="Contraseña" type="password" name="pw" required defaultValue="abc" error="Usa al menos 10 caracteres. Una frase corta funciona mejor que símbolos sueltos." />
          </Card>
        </section>

        <section aria-labelledby="badges">
          <h2 id="badges">Estados con texto e icono</h2>
          <div className="ds-row">
            <Badge tone="ok" icon={<CheckCircle2 aria-hidden="true" size={16} />}>Verificado</Badge>
            <Badge tone="warn" icon={<Clock3 aria-hidden="true" size={16} />}>Pendiente de revisión</Badge>
            <Badge tone="bad" icon={<XCircle aria-hidden="true" size={16} />}>Rechazado</Badge>
            <Badge tone="brand">Plan Pro</Badge>
          </div>
        </section>

        <section aria-labelledby="estados">
          <h2 id="estados">Estados no ideales</h2>
          <div className="ds-states">
            {STATES.map((k) => <StateBlock key={k} kind={k} />)}
          </div>
        </section>

        <section aria-labelledby="integraciones">
          <h2 id="integraciones">Integraciones en este entorno</h2>
          <p className="muted">Lo que no está configurado queda desactivado y se declara así en la interfaz; nunca se simula.</p>
          <ul className="ds-list">
            {integrations.map((i) => (
              <li key={i.id}>
                <strong>{i.label}</strong>
                {i.configured ? (
                  <Badge tone="ok" icon={<CheckCircle2 aria-hidden="true" size={16} />}>Configurada</Badge>
                ) : (
                  <span className="ds-row">
                    <Badge tone="warn" icon={<Clock3 aria-hidden="true" size={16} />}>Falta configurar</Badge>
                    <code>{i.missing.join(", ")}</code>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
