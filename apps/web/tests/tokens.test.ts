import { test } from "node:test";
import assert from "node:assert/strict";
import { generateToken, hashToken, safeEqual, hashForLog, signScopedToken, verifyScopedToken } from "../src/lib/security/tokens.ts";

const SECRET = "x".repeat(40);

test("los tokens son únicos y de alta entropía", () => {
  const set = new Set(Array.from({ length: 500 }, () => generateToken()));
  assert.equal(set.size, 500);
  assert.ok(generateToken().length >= 43); // 32 bytes en base64url
});

test("hashToken es determinista y no revela el token", () => {
  const t = generateToken();
  assert.equal(hashToken(t), hashToken(t));
  assert.notEqual(hashToken(t), t);
  assert.match(hashToken(t), /^[0-9a-f]{64}$/);
});

test("safeEqual compara con longitudes distintas sin lanzar", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});

test("hashForLog depende del pepper", () => {
  assert.notEqual(hashForLog("1.2.3.4", "pepper-aaaaaaaaaaaa"), hashForLog("1.2.3.4", "pepper-bbbbbbbbbbbb"));
});

test("token de sala: ida y vuelta válida", () => {
  const t = signScopedToken({ sub: "u1", purpose: "room:join", scope: "room1" }, SECRET, 60, 1_000_000);
  const c = verifyScopedToken(t, SECRET, { purpose: "room:join", scope: "room1" }, 1_000_000 + 30_000);
  assert.equal(c?.sub, "u1");
});

test("token de sala: expirado, manipulado, otro propósito u otra sala se rechazan", () => {
  const now = 1_000_000;
  const t = signScopedToken({ sub: "u1", purpose: "room:join", scope: "room1" }, SECRET, 60, now);
  assert.equal(verifyScopedToken(t, SECRET, { purpose: "room:join" }, now + 61_000), null, "expirado");
  assert.equal(verifyScopedToken(t, "y".repeat(40), { purpose: "room:join" }, now), null, "otro secreto");
  assert.equal(verifyScopedToken(t, SECRET, { purpose: "admin" }, now), null, "otro propósito");
  assert.equal(verifyScopedToken(t, SECRET, { purpose: "room:join", scope: "room2" }, now), null, "otra sala");
  const [body, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ sub: "admin", purpose: "room:join", scope: "room1", exp: 9e9 })).toString("base64url");
  assert.equal(verifyScopedToken(`${forged}.${sig}`, SECRET, { purpose: "room:join" }, now), null, "payload alterado");
  assert.equal(verifyScopedToken(`${body}`, SECRET, { purpose: "room:join" }, now), null, "sin firma");
  assert.equal(verifyScopedToken("a.b.c", SECRET, { purpose: "room:join" }, now), null, "formato inválido");
});

test("no se firma con un secreto débil", () => {
  assert.throws(() => signScopedToken({ sub: "u", purpose: "p", scope: "s" }, "corto"));
});
