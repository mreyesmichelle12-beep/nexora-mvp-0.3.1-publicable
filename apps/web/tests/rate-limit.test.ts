import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryStore, rateLimit, RULES } from "../src/lib/security/rate-limit.ts";

test("permite hasta el límite y bloquea después, con Retry-After", async () => {
  let t = 0;
  const store = new MemoryStore(() => t);
  for (let i = 1; i <= RULES.login.limit; i++) {
    const r = await rateLimit(store, RULES.login, "a@b.c|1.1.1.1", t);
    assert.equal(r.allowed, true, `intento ${i}`);
  }
  const blocked = await rateLimit(store, RULES.login, "a@b.c|1.1.1.1", t);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("la ventana se reinicia tras expirar", async () => {
  let t = 0;
  const store = new MemoryStore(() => t);
  for (let i = 0; i < 6; i++) await rateLimit(store, RULES.login, "k", t);
  t += RULES.login.windowMs + 1;
  const r = await rateLimit(store, RULES.login, "k", t);
  assert.equal(r.allowed, true);
});

test("los sujetos y las reglas están aislados entre sí", async () => {
  const store = new MemoryStore(() => 0);
  for (let i = 0; i < 10; i++) await rateLimit(store, RULES.login, "victima", 0);
  assert.equal((await rateLimit(store, RULES.login, "otro", 0)).allowed, true);
  assert.equal((await rateLimit(store, RULES.contact, "victima", 0)).allowed, true);
});
