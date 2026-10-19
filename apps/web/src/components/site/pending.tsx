import type { ReactNode } from "react";

/**
 * Marcador de contenido pendiente. Se ve elegante pero inequívoco: nadie confundirá un
 * placeholder con información real. Se reemplaza editando src/content/site.ts (o desde admin en la Fase 13).
 */
export function Pending({ children, tag = "Pendiente", quiet = false }: { children: ReactNode; tag?: string; quiet?: boolean }) {
  return (
    <span className={quiet ? "pending pending--quiet" : "pending"}>
      <span className="pending__tag">{tag}</span>
      <span>{children}</span>
    </span>
  );
}
