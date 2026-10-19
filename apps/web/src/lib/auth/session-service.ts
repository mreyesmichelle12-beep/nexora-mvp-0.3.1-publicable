import { generateToken, hashToken } from "../security/tokens.ts";
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS } from "./cookies.ts";

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

/** Contrato de persistencia. La implementación Prisma vive en session-repo.prisma.ts. */
export interface SessionRepo {
  create(data: { userId: string; tokenHash: string; expiresAt: Date; ipHash?: string; userAgent?: string }): Promise<SessionRecord>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  touch(id: string, at: Date): Promise<void>;
  revoke(id: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
}

export type SessionCheck =
  | { ok: true; session: SessionRecord }
  | { ok: false; reason: "missing" | "revoked" | "expired" | "idle" };

/** Crea una sesión nueva. Llamar SIEMPRE al iniciar sesión (rotación: nunca reutilizar un token previo). */
export async function createSession(
  repo: SessionRepo,
  userId: string,
  meta: { ipHash?: string; userAgent?: string } = {},
  now: Date = new Date(),
) {
  const token = generateToken();
  const record = await repo.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_MS),
    ...meta,
    userAgent: meta.userAgent?.slice(0, 255),
  });
  return { token, record };
}

export async function validateSession(repo: SessionRepo, token: string | undefined, now: Date = new Date()): Promise<SessionCheck> {
  if (!token) return { ok: false, reason: "missing" };
  const s = await repo.findByTokenHash(hashToken(token));
  if (!s) return { ok: false, reason: "missing" };
  if (s.revokedAt) return { ok: false, reason: "revoked" };
  if (s.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  if (now.getTime() - s.lastUsedAt.getTime() > SESSION_IDLE_MS) return { ok: false, reason: "idle" };

  // Actualiza el último uso como máximo una vez por hora para no escribir en cada petición.
  if (now.getTime() - s.lastUsedAt.getTime() > 60 * 60 * 1000) await repo.touch(s.id, now);
  return { ok: true, session: s };
}

export function revokeSession(repo: SessionRepo, id: string, now: Date = new Date()) {
  return repo.revoke(id, now);
}

/** Cierra todas las sesiones: cambio de contraseña, bloqueo o suspensión por un admin. */
export function revokeAllSessions(repo: SessionRepo, userId: string, now: Date = new Date()) {
  return repo.revokeAllForUser(userId, now);
}
