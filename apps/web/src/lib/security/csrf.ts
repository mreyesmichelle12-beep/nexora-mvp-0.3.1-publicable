/**
 * Defensa CSRF para route handlers y webhooks que NO pasan por Server Actions:
 * en métodos que modifican estado se exige que Origin (o Referer) coincida con un origen permitido.
 * Combinado con cookies SameSite=Lax y sin endpoints GET que muten estado.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSameOriginRequest(
  method: string,
  headers: { get(name: string): string | null },
  allowedOrigins: readonly string[],
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  const allowed = new Set(allowedOrigins.map((o) => new URL(o).origin));

  const origin = headers.get("origin");
  if (origin) return allowed.has(origin);

  const referer = headers.get("referer");
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  return false; // sin Origin ni Referer en una petición que muta: se rechaza
}
