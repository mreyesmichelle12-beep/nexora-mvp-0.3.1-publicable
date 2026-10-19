import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Token aleatorio de alta entropía (256 bits por defecto), apto para cookies y enlaces. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** En BD sólo se guarda el hash del token: si la tabla se filtra, los tokens no sirven. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Hash con pepper para registrar IPs en logs sin guardar la IP en claro. */
export function hashForLog(value: string, pepper: string): string {
  return createHmac("sha256", pepper).update(value).digest("hex").slice(0, 32);
}

/* ───────── Tokens firmados de corta duración (servicio en tiempo real / salas) ───────── */

export interface ScopedClaims {
  sub: string; // id de usuario
  purpose: string; // p. ej. "room:join"
  scope: string; // p. ej. id de sala
  exp: number; // epoch en segundos
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");

export function signScopedToken(
  claims: Omit<ScopedClaims, "exp">,
  secret: string,
  ttlSeconds = 60,
  nowMs = Date.now(),
): string {
  if (secret.length < 32) throw new Error("secret demasiado corto");
  const body = b64(JSON.stringify({ ...claims, exp: Math.floor(nowMs / 1000) + ttlSeconds }));
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyScopedToken(
  token: string,
  secret: string,
  expected: { purpose: string; scope?: string },
  nowMs = Date.now(),
): ScopedClaims | null {
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const good = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(sig, good)) return null;
  let claims: ScopedClaims;
  try {
    claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof claims.exp !== "number" || claims.exp * 1000 < nowMs) return null;
  if (claims.purpose !== expected.purpose) return null;
  if (expected.scope !== undefined && claims.scope !== expected.scope) return null;
  return claims;
}
