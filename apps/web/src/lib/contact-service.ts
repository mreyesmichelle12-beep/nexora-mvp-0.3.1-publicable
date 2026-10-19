import { CONTACT_SUBJECTS, validateContact, type ContactData, type ContactState } from "./contact-validation.ts";

/** Dependencias inyectables: así la lógica se prueba sin base de datos ni Redis. */
export interface ContactDeps {
  /** Identificador de origen ya hasheado (nunca la IP en claro). */
  clientKey: string;
  dbConfigured: boolean;
  rateLimit(key: string): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
  save(data: ContactData & { subjectLabel: string; ipHash: string | null }): Promise<void>;
  log?(event: string): void;
}

const TXT = {
  ok: "Recibimos tu mensaje. Quedó registrado para el equipo de NEXORA.",
  fix: "Revisa los campos marcados y vuelve a intentarlo.",
  noDb: "El formulario de contacto aún no está disponible en este entorno. Inténtalo más tarde o usa los otros canales de esta página.",
  fail: "No pudimos registrar tu mensaje por un problema de nuestro lado. Inténtalo de nuevo en unos minutos.",
};

export async function handleContact(raw: Record<string, unknown>, deps: ContactDeps): Promise<ContactState> {
  const v = validateContact(raw);

  // Honeypot: se responde como si hubiera funcionado para no darle pistas al bot, pero NO se guarda nada.
  if (!v.ok && v.spam) { deps.log?.("contact.spam"); return { status: "success", message: TXT.ok }; }

  if (!v.ok) return { status: "error", message: TXT.fix, errors: v.errors, values: v.values };

  // El límite cuenta sólo envíos válidos: equivocarse al rellenar no consume intentos.
  const rl = await deps.rateLimit(deps.clientKey);
  if (!rl.allowed) {
    const min = Math.max(1, Math.ceil(rl.retryAfterSeconds / 60));
    return { status: "error", message: `Has enviado varios mensajes seguidos. Inténtalo de nuevo en unos ${min} min.`, values: v.data };
  }

  if (!deps.dbConfigured) return { status: "error", message: TXT.noDb, values: v.data };

  try {
    const label = CONTACT_SUBJECTS.find((s) => s.value === v.data.subject)?.label ?? v.data.subject;
    await deps.save({ ...v.data, subjectLabel: label, ipHash: deps.clientKey === "unknown" ? null : deps.clientKey });
    return { status: "success", message: TXT.ok };
  } catch {
    deps.log?.("contact.save_failed"); // sin datos personales en el log
    return { status: "error", message: TXT.fail, values: v.data };
  }
}
