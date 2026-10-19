/** Validación de correo compartida (formulario de contacto y configuración pública). Pragmática, no RFC completa. */
const EMAIL = /^[^\s@<>()"';,]+@[^\s@<>()"';,]+\.[^\s@<>()"';,]{2,}$/;
export const EMAIL_MAX = 254;
export function isValidEmail(v: string): boolean {
  return v.length <= EMAIL_MAX && EMAIL.test(v);
}
