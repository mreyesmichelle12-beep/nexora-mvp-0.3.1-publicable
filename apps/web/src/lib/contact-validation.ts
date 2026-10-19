import { isValidEmail } from "./email.ts";

/** Validación del formulario de contacto. Se ejecuta en el navegador (mensajes rápidos) Y en el servidor (la que cuenta). */
export const CONTACT_SUBJECTS = [
  { value: "general", label: "Consulta general" },
  { value: "alianzas", label: "Alianzas y colaboración" },
  { value: "prensa", label: "Prensa y medios" },
  { value: "problema", label: "Reportar un problema" },
  { value: "otro", label: "Otro" },
] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]["value"];

export type ContactField = "name" | "email" | "subject" | "message";
export interface ContactData { name: string; email: string; subject: ContactSubject; message: string }
export type ContactErrors = Partial<Record<ContactField, string>>;

export type ContactState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; errors?: ContactErrors; values?: Partial<Record<ContactField, string>> };

export const LIMITS = { nameMin: 2, nameMax: 120, messageMin: 10, messageMax: 3000 } as const;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const oneLine = (s: string) => s.replace(CONTROL, "").replace(/\s+/g, " ").trim();

export type ContactResult = { ok: true; data: ContactData } | { ok: false; spam: boolean; errors: ContactErrors; values: Partial<Record<ContactField, string>> };

export function validateContact(raw: Record<string, unknown>): ContactResult {
  const name = oneLine(str(raw.name));
  const email = oneLine(str(raw.email)).toLowerCase();
  const subject = str(raw.subject);
  const message = str(raw.message).replace(CONTROL, "").replace(/\r\n/g, "\n").trim();
  const values = { name, email, subject, message };

  // Honeypot: un campo oculto que una persona nunca rellena.
  if (str(raw.website).trim() !== "") return { ok: false, spam: true, errors: {}, values };

  const errors: ContactErrors = {};
  if (name.length < LIMITS.nameMin) errors.name = "Escribe tu nombre (mínimo 2 caracteres).";
  else if (name.length > LIMITS.nameMax) errors.name = `El nombre no puede superar ${LIMITS.nameMax} caracteres.`;

  if (!email) errors.email = "Escribe tu correo para poder responderte.";
  else if (!isValidEmail(email)) errors.email = "Revisa el correo: debe tener el formato nombre@dominio.com.";

  if (!CONTACT_SUBJECTS.some((s) => s.value === subject)) errors.subject = "Elige un asunto de la lista.";

  if (message.length < LIMITS.messageMin) errors.message = `Cuéntanos un poco más (mínimo ${LIMITS.messageMin} caracteres).`;
  else if (message.length > LIMITS.messageMax) errors.message = `El mensaje no puede superar ${LIMITS.messageMax} caracteres.`;

  if (Object.keys(errors).length) return { ok: false, spam: false, errors, values };
  return { ok: true, data: { name, email, subject: subject as ContactSubject, message } };
}
