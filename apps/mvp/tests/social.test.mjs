import { test } from "node:test";
import assert from "node:assert/strict";
import { decideRequest, relationView, cleanMessage, pairOf, COOLDOWN_MS, MESSAGE_MAX } from "../src/social.mjs";

const row = (o) => ({ requester_id: "a", status: "PENDING", responded_at: null, ...o });

test("pairOf ordena siempre igual", () => { assert.deepEqual(pairOf("b", "a"), ["a", "b"]); assert.deepEqual(pairOf("a", "b"), ["a", "b"]); });
test("solicitar: sin relación → crear; bloqueo y uno mismo → no", () => {
  assert.deepEqual(decideRequest({ existing: null, me: "a", other: "b", blocked: false }), { ok: true, action: "create" });
  assert.equal(decideRequest({ existing: null, me: "a", other: "b", blocked: true }).code, "blocked");
  assert.equal(decideRequest({ existing: null, me: "a", other: "a", blocked: false }).code, "self");
});
test("si la otra persona ya me pidió conexión, 'Conectar' la acepta; si yo ya pedí, queda pendiente", () => {
  assert.deepEqual(decideRequest({ existing: row({ requester_id: "b" }), me: "a", other: "b", blocked: false }), { ok: true, action: "accept" });
  assert.equal(decideRequest({ existing: row({ requester_id: "a" }), me: "a", other: "b", blocked: false }).code, "pending");
  assert.equal(decideRequest({ existing: row({ status: "ACCEPTED" }), me: "a", other: "b", blocked: false }).code, "already");
});
test("rechazo: quien fue rechazado espera 30 días; el rechazante sí puede pedir y pasado el plazo se reabre", () => {
  const now = 1_000_000_000_000, declined = row({ status: "DECLINED", requester_id: "a", responded_at: now - 1000 });
  assert.equal(decideRequest({ existing: declined, me: "a", other: "b", blocked: false, now }).code, "cooldown");
  assert.equal(decideRequest({ existing: declined, me: "b", other: "a", blocked: false, now }).action, "recreate");
  assert.equal(decideRequest({ existing: declined, me: "a", other: "b", blocked: false, now: now + COOLDOWN_MS }).action, "recreate");
});
test("quien fue rechazado ve 'solicitud enviada' (no se le revela el rechazo)", () => {
  assert.equal(relationView(row({ status: "DECLINED", requester_id: "a" }), "a").state, "sent");
  assert.equal(relationView(row({ status: "DECLINED", requester_id: "a" }), "b").state, "none");
  assert.equal(relationView(row({ status: "PENDING", requester_id: "b" }), "a").state, "received");
  assert.equal(relationView(row({ status: "ACCEPTED" }), "a").state, "connected");
  assert.equal(relationView(null, "a").state, "none");
});
test("mensajes: se limpian, se limitan y no admiten vacíos", () => {
  assert.equal(cleanMessage("   ").ok, false); assert.equal(cleanMessage(null).ok, false);
  assert.equal(cleanMessage("x".repeat(MESSAGE_MAX + 1)).ok, false);
  assert.equal(cleanMessage("x".repeat(MESSAGE_MAX)).ok, true);
  assert.equal(cleanMessage("Hola\u0000\u0007 mundo\r\n\r\n\r\n\r\nfin").body, "Hola mundo\n\nfin");
  assert.equal(cleanMessage("<b>negrita</b>").body, "<b>negrita</b>", "el HTML se conserva como texto: se escapa al mostrarlo");
});
