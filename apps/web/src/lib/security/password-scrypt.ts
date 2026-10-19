import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Hash de contraseñas con scrypt (módulo nativo de Node, sin dependencias): N=2^16, r=8, p=1 (~64 MiB),
 * el mínimo recomendado por OWASP para scrypt. Lo usa el MVP 0.1; la arquitectura final prevé argon2id (password.ts).
 * Formato: scrypt$N$r$p$salt$hash (base64url).
 */
const N = 65536, R = 8, P = 1, KEYLEN = 32, MAXMEM = 256 * 1024 * 1024;

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password.normalize("NFKC"), salt, KEYLEN, { N: n, r, p, maxmem: MAXMEM }, (e, k) => (e ? reject(e) : resolve(k))));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    const [alg, n, r, p, salt, hash] = stored.split("$");
    if (alg !== "scrypt" || !n || !r || !p || !salt || !hash) return false;
    const expected = Buffer.from(hash, "base64url");
    const key = await derive(password, Buffer.from(salt, "base64url"), Number(n), Number(r), Number(p));
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** Hash ficticio para igualar tiempos cuando el correo no existe (evita enumerar cuentas por latencia). */
let dummy: Promise<string> | undefined;
export const dummyHash = (): Promise<string> => (dummy ??= hashPassword("nexora-dummy-password-for-timing"));
