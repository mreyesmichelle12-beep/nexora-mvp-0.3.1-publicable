import { hash, verify, Algorithm } from "@node-rs/argon2";

/** argon2id con parámetros mínimos recomendados por OWASP (19 MiB, t=2, p=1). */
const OPTS = { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTS);
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}

/** Hash ficticio para igualar tiempos cuando el correo no existe (evita enumeración por latencia). */
let dummy: Promise<string> | undefined;
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword("nexora-dummy-password-for-timing");
  return dummy;
}
