import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";

/** Texto exacto requerido por el proyecto. Debe verse en TODA pantalla del modo demo. */
export function DemoBanner({ action }: { action?: ReactNode }) {
  return (
    <div role="note" className="demo-banner">
      <span><FlaskConical aria-hidden="true" size={16} />MODO DEMO — Datos ficticios</span>
      {action}
    </div>
  );
}
