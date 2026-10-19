// Reglas de conexiones y mensajería (puras y probadas). El estado vive en SQLite; aquí sólo se decide.
export const COOLDOWN_MS = 30 * 24 * 3600_000; // quien fue rechazado no puede volver a pedir durante 30 días
export const MESSAGE_MAX = 2000;
export const REPORT_REASONS = { HARASSMENT: "Acoso o comportamiento ofensivo", SPAM: "Spam", IMPERSONATION: "Suplantación de identidad", INAPPROPRIATE: "Contenido inapropiado", OTHER: "Otro motivo" };

export const pairOf = (a, b) => (a < b ? [a, b] : [b, a]);

/**
 * Decide qué pasa cuando `me` pulsa "Conectar" con `other`.
 * existing: fila de connections entre ambos (o null). blocked: hay un bloqueo en cualquier sentido.
 */
export function decideRequest({ existing, me, other, blocked, now = Date.now() }) {
  if (me === other) return { ok: false, code: "self" };
  if (blocked) return { ok: false, code: "blocked" };
  if (!existing) return { ok: true, action: "create" };
  if (existing.status === "ACCEPTED") return { ok: false, code: "already" };
  if (existing.status === "PENDING") return existing.requester_id === me ? { ok: false, code: "pending" } : { ok: true, action: "accept" };
  // DECLINED
  if (existing.requester_id === me && now - (existing.responded_at ?? 0) < COOLDOWN_MS) return { ok: false, code: "cooldown" };
  return { ok: true, action: "recreate" };
}

/** Estado de la relación visto por `me`. Quien fue rechazado ve "enviada": no se le revela el rechazo. */
export function relationView(row, me) {
  if (!row) return { state: "none" };
  if (row.status === "ACCEPTED") return { state: "connected" };
  if (row.status === "PENDING") return { state: row.requester_id === me ? "sent" : "received" };
  return row.requester_id === me ? { state: "sent" } : { state: "none" };
}

/** Limpia un mensaje: quita caracteres de control (salvo saltos de línea), normaliza saltos y recorta. */
export function cleanMessage(raw) {
  const s = String(raw ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!s) return { ok: false, error: "Escribe un mensaje antes de enviarlo." };
  if (s.length > MESSAGE_MAX) return { ok: false, error: `El mensaje no puede superar ${MESSAGE_MAX} caracteres.` };
  return { ok: true, body: s };
}

export const FLASH = {
  ok: {
    "solicitud-enviada": "Solicitud enviada. La otra persona decidirá si acepta.",
    "solicitud-aceptada": "Ahora están conectados.",
    "solicitud-rechazada": "Solicitud rechazada.",
    "solicitud-cancelada": "Solicitud cancelada.",
    "conexion-eliminada": "Conexión eliminada.",
    bloqueado: "Persona bloqueada. Ya no podrán verse ni escribirse.",
    desbloqueado: "Persona desbloqueada.",
    "reporte-enviado": "Reporte enviado. Gracias por ayudarnos a cuidar la comunidad.",
  },
  error: {
    blocked: "No puedes interactuar con esa persona.",
    already: "Ya están conectados.",
    pending: "Ya enviaste una solicitud a esa persona.",
    cooldown: "No puedes volver a enviar una solicitud a esa persona por ahora.",
    self: "No puedes conectarte contigo mismo.",
    "no-encontrada": "No encontramos a esa persona.",
    "no-conectados": "Solo puedes escribir a tus conexiones.",
    "demasiados": "Estás haciendo demasiadas acciones seguidas. Espera unos minutos.",
    "reporte-invalido": "Revisa el motivo del reporte.",
  },
};
