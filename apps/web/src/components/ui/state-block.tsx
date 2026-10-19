import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileX2, Inbox, Loader2, Lock, ShieldBan, Trash2, WifiOff } from "lucide-react";
import { cn } from "@/lib/cn";

export type StateKind = "loading" | "empty" | "error" | "success" | "offline" | "forbidden" | "deleted" | "blocked" | "file-rejected";

const DEFAULTS = {
  loading: { Icon: Loader2, tone: "brand", title: "Cargando", description: "Estamos preparando tu información." },
  empty: { Icon: Inbox, tone: "muted", title: "Aún no hay nada aquí", description: "Cuando haya contenido, lo verás en este espacio." },
  error: { Icon: AlertTriangle, tone: "bad", title: "No pudimos completar la acción", description: "Revisa los datos e inténtalo de nuevo. Si el problema continúa, escríbenos desde Contacto." },
  success: { Icon: CheckCircle2, tone: "ok", title: "Listo", description: "Los cambios se guardaron." },
  offline: { Icon: WifiOff, tone: "warn", title: "Sin conexión", description: "Revisa tu internet e inténtalo de nuevo cuando vuelva." },
  forbidden: { Icon: Lock, tone: "muted", title: "No tienes permiso para ver esto", description: "Tu cuenta no tiene acceso a esta sección. Si crees que es un error, contacta a un administrador." },
  deleted: { Icon: Trash2, tone: "muted", title: "Este contenido ya no está disponible", description: "Fue eliminado por su autor o por moderación." },
  blocked: { Icon: ShieldBan, tone: "bad", title: "No puedes interactuar con este usuario", description: "Existe un bloqueo entre ambas cuentas. Puedes gestionarlo en Privacidad." },
  "file-rejected": { Icon: FileX2, tone: "bad", title: "Archivo rechazado", description: "El tipo o el tamaño del archivo no está permitido. Revisa los formatos y el límite indicados." },
} as const;

export interface StateBlockProps { kind: StateKind; title?: string; description?: string; action?: ReactNode; className?: string }

/** Un solo componente para los estados no ideales: icono + texto y rol ARIA adecuado. */
export function StateBlock({ kind, title, description, action, className }: StateBlockProps) {
  const { Icon, tone, ...d } = DEFAULTS[kind];
  const role = kind === "error" || kind === "file-rejected" ? "alert" : kind === "loading" || kind === "success" || kind === "offline" ? "status" : undefined;
  return (
    <div role={role} aria-busy={kind === "loading" || undefined} className={cn("state", className)}>
      <Icon aria-hidden="true" className={cn("state__icon", `state__icon--${tone}`, kind === "loading" && "state__icon--spin")} />
      <h3>{title ?? d.title}</h3>
      <p>{description ?? d.description}</p>
      {action}
    </div>
  );
}
