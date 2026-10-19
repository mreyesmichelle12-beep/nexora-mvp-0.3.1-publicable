// Validación de entradas del servidor (la que cuenta). Funciones puras: reciben el cuerpo ya parseado.
import { isValidEmail } from "../../web/src/lib/email.ts";
import { validatePasswordPolicy, PASSWORD_ISSUE_MESSAGES } from "../../web/src/lib/security/password-policy.ts";
import { isValidSlot } from "../../../packages/match-engine/src/index.ts";
import { MODALITIES, STUDY_STYLES, RELATIONS, LIMITS } from "./constants.mjs";

const CONTROL = /[\u0000-\u001F\u007F]/g;
const NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]{0,79}$/u;
export const clean = (v, max = 500) => String(v ?? "").replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, max);

export function parseTags(v) {
  const seen = new Set(), out = [];
  for (const t of String(v ?? "").replace(CONTROL, " ").split(",")) {
    const x = t.replace(/\s+/g, " ").trim();
    if (x.length < 2 || x.length > 30 || seen.has(x.toLowerCase())) continue;
    seen.add(x.toLowerCase()); out.push(x); if (out.length >= LIMITS.interests) break;
  }
  return out;
}

export function validateRegister(b, { universityIds }) {
  const e = {}, v = { firstName: clean(b.first_name, 80), lastName: clean(b.last_name, 80), email: clean(b.email, 254).toLowerCase(), uniId: clean(b.university, 64), careerName: clean(b.career, 120), cycle: Number(b.cycle), modality: clean(b.modality, 20), terms: b.terms === "on" };
  if (!NAME.test(v.firstName)) e.first_name = "Escribe tu nombre (solo letras, espacios y . ' -).";
  if (!NAME.test(v.lastName)) e.last_name = "Escribe tu apellido (solo letras, espacios y . ' -).";
  if (!isValidEmail(v.email)) e.email = "Revisa el correo: debe tener el formato nombre@dominio.com.";
  if (!universityIds.includes(v.uniId)) e.university = "Elige una universidad de la lista.";
  if (v.careerName.length < 2) e.career = "Escribe el nombre de tu carrera.";
  if (!Number.isInteger(v.cycle) || v.cycle < 1 || v.cycle > 15) e.cycle = "Indica tu ciclo o nivel (número del 1 al 15).";
  if (!(v.modality in MODALITIES)) e.modality = "Elige una modalidad de estudio.";
  const pw = String(b.password ?? "");
  const pol = validatePasswordPolicy(pw, { email: v.email, firstName: v.firstName, lastName: v.lastName });
  if (!pol.ok) e.password = pol.issues.map((i) => PASSWORD_ISSUE_MESSAGES[i]).join(" ");
  if (!v.terms) e.terms = "Debes aceptar los Términos y la Política de privacidad (borradores) para crear tu cuenta.";
  return { ok: Object.keys(e).length === 0, errors: e, values: v, password: pw };
}

export function validateProfile(b) {
  const e = {}, styles = [].concat(b.study_style ?? []).filter((s) => s in STUDY_STYLES);
  const v = { firstName: clean(b.first_name, 80), lastName: clean(b.last_name, 80), bio: clean(b.bio, 400), careerName: clean(b.career, 120), cycle: Number(b.cycle), modality: clean(b.modality, 20), interests: parseTags(b.interests), studyStyles: [...new Set(styles)], discoverable: b.discoverable === "on" };
  if (!NAME.test(v.firstName)) e.first_name = "Escribe tu nombre.";
  if (!NAME.test(v.lastName)) e.last_name = "Escribe tu apellido.";
  if (v.careerName.length < 2) e.career = "Escribe el nombre de tu carrera.";
  if (!Number.isInteger(v.cycle) || v.cycle < 1 || v.cycle > 15) e.cycle = "Indica tu ciclo o nivel (1 a 15).";
  if (!(v.modality in MODALITIES)) e.modality = "Elige una modalidad.";
  return { ok: Object.keys(e).length === 0, errors: e, values: v };
}

export function validateSubject(b) {
  const name = clean(b.name, 80), relation = clean(b.relation, 12);
  if (name.length < 2) return { ok: false, error: "Escribe el nombre de la materia (mínimo 2 caracteres)." };
  if (!/[\p{L}\p{N}]/u.test(name)) return { ok: false, error: "El nombre de la materia debe incluir letras o números." };
  if (!(relation in RELATIONS)) return { ok: false, error: "Indica si la cursas o se te dificulta." };
  return { ok: true, name, relation };
}

/** Sólo bloques válidos y sin repetir (la rejilla permite 49 como máximo). */
export const parseSlots = (v) => [...new Set([].concat(v ?? []).map(String).filter(isValidSlot))];

export function validateTeacherRegister(b) {
  const e = {}, v = { firstName: clean(b.first_name, 80), lastName: clean(b.last_name, 80), email: clean(b.email, 254).toLowerCase(), role: clean(b.role, 20), institution: clean(b.institution, 120), evidence: clean(b.evidence, 500), terms: b.terms === "on" };
  if (!NAME.test(v.firstName)) e.first_name = "Escribe tu nombre."; if (!NAME.test(v.lastName)) e.last_name = "Escribe tu apellido.";
  if (!isValidEmail(v.email)) e.email = "Revisa el correo: debe tener el formato nombre@dominio.com.";
  if (!["TEACHER", "MENTOR", "CONFERENCE_HOST"].includes(v.role)) e.role = "Elige el rol que solicitas.";
  if (v.institution.length < 2) e.institution = "Indica tu institución.";
  const pw = String(b.password ?? ""), pol = validatePasswordPolicy(pw, { email: v.email, firstName: v.firstName, lastName: v.lastName });
  if (!pol.ok) e.password = pol.issues.map((i) => PASSWORD_ISSUE_MESSAGES[i]).join(" ");
  if (!v.terms) e.terms = "Debes aceptar los Términos y la Política de privacidad (borradores) para crear tu cuenta.";
  return { ok: Object.keys(e).length === 0, errors: e, values: v, password: pw };
}
/** Dominios de correo institucional: minúsculas, sin @, válidos y sin repetir (máximo 10). */
export function parseDomains(v) {
  const out = [];
  for (const d of String(v ?? "").toLowerCase().split(/[\s,;]+/).map((x) => x.replace(/^@/, "").trim()).filter(Boolean)) { if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d)) return null; if (!out.includes(d)) out.push(d); }
  return out.length <= 10 ? out : null;
}
