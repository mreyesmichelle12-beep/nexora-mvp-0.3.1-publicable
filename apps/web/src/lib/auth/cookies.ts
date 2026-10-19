/**
 * Opciones de la cookie de sesión.
 * En producción se usa el prefijo __Host- (obliga Secure, Path=/ y sin Domain).
 */
export const SESSION_IDLE_MS = 14 * 24 * 60 * 60 * 1000; // caduca tras 14 días sin uso
export const SESSION_ABSOLUTE_MS = 30 * 24 * 60 * 60 * 1000; // y como máximo a los 30 días

export function sessionCookieName(isProd: boolean): string {
  return isProd ? "__Host-nexora_session" : "nexora_session";
}

export function sessionCookieOptions(isProd: boolean, maxAgeMs = SESSION_IDLE_MS) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}
