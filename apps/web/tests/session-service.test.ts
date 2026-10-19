import { test } from "node:test";
import assert from "node:assert/strict";
import { createSession, validateSession, revokeSession, revokeAllSessions, type SessionRepo, type SessionRecord } from "../src/lib/auth/session-service.ts";
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS, sessionCookieName, sessionCookieOptions } from "../src/lib/auth/cookies.ts";
import { hashToken } from "../src/lib/security/tokens.ts";

function memoryRepo(): SessionRepo & { rows: SessionRecord[] } {
  const rows: SessionRecord[] = [];
  let n = 0;
  return {
    rows,
    async create(d) {
      const r: SessionRecord = { id: `s${++n}`, userId: d.userId, tokenHash: d.tokenHash, createdAt: new Date(), lastUsedAt: new Date(), expiresAt: d.expiresAt, revokedAt: null };
      rows.push(r);
      return r;
    },
    async findByTokenHash(h) { return rows.find((r) => r.tokenHash === h) ?? null; },
    async touch(id, at) { const r = rows.find((x) => x.id === id); if (r) r.lastUsedAt = at; },
    async revoke(id, at) { const r = rows.find((x) => x.id === id); if (r) r.revokedAt = at; },
    async revokeAllForUser(uid, at) { rows.filter((r) => r.userId === uid).forEach((r) => (r.revokedAt = at)); },
  };
}

test("el token en claro nunca se guarda; sólo su hash", async () => {
  const repo = memoryRepo();
  const { token } = await createSession(repo, "u1");
  assert.equal(repo.rows[0]!.tokenHash, hashToken(token));
  assert.ok(!JSON.stringify(repo.rows).includes(token));
});

test("una sesión válida se valida; un token inventado no", async () => {
  const repo = memoryRepo();
  const { token } = await createSession(repo, "u1");
  assert.equal((await validateSession(repo, token)).ok, true);
  const bad = await validateSession(repo, "inventado");
  assert.deepEqual(bad, { ok: false, reason: "missing" });
  assert.deepEqual(await validateSession(repo, undefined), { ok: false, reason: "missing" });
});

test("cada inicio de sesión genera un token distinto (rotación)", async () => {
  const repo = memoryRepo();
  const a = await createSession(repo, "u1");
  const b = await createSession(repo, "u1");
  assert.notEqual(a.token, b.token);
});

test("revocar una sesión la invalida de inmediato", async () => {
  const repo = memoryRepo();
  const { token, record } = await createSession(repo, "u1");
  await revokeSession(repo, record.id);
  assert.deepEqual(await validateSession(repo, token), { ok: false, reason: "revoked" });
});

test("bloquear a un usuario revoca todas sus sesiones y no las de otros", async () => {
  const repo = memoryRepo();
  const a1 = await createSession(repo, "u1");
  const a2 = await createSession(repo, "u1");
  const b = await createSession(repo, "u2");
  await revokeAllSessions(repo, "u1");
  assert.equal((await validateSession(repo, a1.token)).ok, false);
  assert.equal((await validateSession(repo, a2.token)).ok, false);
  assert.equal((await validateSession(repo, b.token)).ok, true);
});

test("caduca por inactividad y por tiempo absoluto", async () => {
  const repo = memoryRepo();
  const { token, record } = await createSession(repo, "u1");
  const t0 = record.createdAt.getTime();
  assert.deepEqual(await validateSession(repo, token, new Date(t0 + SESSION_IDLE_MS + 1000)), { ok: false, reason: "idle" });
  assert.deepEqual(await validateSession(repo, token, new Date(t0 + SESSION_ABSOLUTE_MS + 1000)), { ok: false, reason: "expired" });
});

test("actualiza lastUsedAt como máximo una vez por hora", async () => {
  const repo = memoryRepo();
  const { token, record } = await createSession(repo, "u1");
  const t0 = record.createdAt.getTime();
  await validateSession(repo, token, new Date(t0 + 10 * 60_000));
  assert.equal(repo.rows[0]!.lastUsedAt.getTime(), t0, "no escribe antes de 1 h");
  await validateSession(repo, token, new Date(t0 + 2 * 3600_000));
  assert.equal(repo.rows[0]!.lastUsedAt.getTime(), t0 + 2 * 3600_000);
});

test("cookie: HttpOnly + SameSite=Lax siempre; Secure y __Host- en producción", () => {
  const prod = sessionCookieOptions(true);
  assert.equal(prod.httpOnly, true);
  assert.equal(prod.sameSite, "lax");
  assert.equal(prod.secure, true);
  assert.equal(prod.path, "/");
  assert.ok(sessionCookieName(true).startsWith("__Host-"));
  assert.equal(sessionCookieOptions(false).secure, false);
});
