/**
 * Política de contraseñas (NIST SP 800-63B): longitud sobre complejidad forzada,
 * bloqueo de contraseñas comunes y de datos personales evidentes.
 */
const COMMON = new Set([
  "password", "password1", "password123", "123456789", "1234567890", "12345678910",
  "qwertyuiop", "qwerty123", "iloveyou12", "contraseña", "contraseña1", "contrasena123",
  "admin12345", "letmein123", "welcome123", "nexora2026", "nexora123", "universidad",
]);

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export type PasswordIssue = "too_short" | "too_long" | "common" | "contains_email" | "contains_name" | "repeated";

export function validatePasswordPolicy(
  password: string,
  ctx: { email?: string; firstName?: string; lastName?: string } = {},
): { ok: boolean; issues: PasswordIssue[] } {
  const issues: PasswordIssue[] = [];
  const lower = password.toLowerCase();

  if (password.length < PASSWORD_MIN) issues.push("too_short");
  if (password.length > PASSWORD_MAX) issues.push("too_long");
  if (COMMON.has(lower)) issues.push("common");
  if (/^(.)\1+$/.test(password)) issues.push("repeated");

  const local = ctx.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) issues.push("contains_email");

  for (const n of [ctx.firstName, ctx.lastName]) {
    if (n && n.trim().length >= 4 && lower.includes(n.trim().toLowerCase())) {
      issues.push("contains_name");
      break;
    }
  }
  return { ok: issues.length === 0, issues };
}

export const PASSWORD_ISSUE_MESSAGES: Record<PasswordIssue, string> = {
  too_short: `Usa al menos ${PASSWORD_MIN} caracteres. Una frase corta funciona mejor que símbolos sueltos.`,
  too_long: `Máximo ${PASSWORD_MAX} caracteres.`,
  common: "Esa contraseña es demasiado común. Elige otra.",
  contains_email: "La contraseña no debe contener tu correo.",
  contains_name: "La contraseña no debe contener tu nombre.",
  repeated: "No uses un único carácter repetido.",
};
