import { test } from "node:test";
import assert from "node:assert/strict";
import { can, assertCan, ForbiddenError, effectiveRoles, type Actor } from "../src/lib/auth/permissions.ts";

const actor = (over: Partial<Actor> = {}): Actor => ({
  id: "u1",
  status: "ACTIVE",
  isDemo: false,
  roles: [{ role: "STUDENT", verification: "NOT_REQUIRED" }],
  ...over,
});

test("sin actor no hay acceso a nada", () => {
  assert.equal(can(null, "social:use"), false);
  assert.equal(can(undefined, "admin:access"), false);
});

test("un estudiante activo puede usar lo social y subir archivos, pero no administrar", () => {
  const s = actor();
  assert.equal(can(s, "social:use"), true);
  assert.equal(can(s, "library:upload"), true);
  assert.equal(can(s, "admin:access"), false);
  assert.equal(can(s, "class:create"), false);
  assert.equal(can(s, "library:moderate"), false);
});

test("cuentas no activas pierden todo acceso", () => {
  for (const status of ["PENDING_VERIFICATION", "SUSPENDED", "BLOCKED", "DELETED"] as const) {
    assert.equal(can(actor({ status }), "social:use"), false, status);
  }
});

test("un docente sin verificación aprobada NO puede crear clases", () => {
  for (const verification of ["PENDING", "REJECTED"] as const) {
    const t = actor({ roles: [{ role: "TEACHER", verification }] });
    assert.equal(can(t, "class:create"), false, verification);
    assert.equal(can(t, "conference:create"), false, verification);
  }
});

test("un docente verificado sí puede crear clases y conferencias", () => {
  const t = actor({ roles: [{ role: "TEACHER", verification: "APPROVED" }] });
  assert.equal(can(t, "class:create"), true);
  assert.equal(can(t, "conference:create"), true);
});

test("auto-asignarse ADMIN con verificación PENDING no concede nada", () => {
  const a = actor({ roles: [{ role: "ADMIN", verification: "PENDING" }] });
  assert.deepEqual(effectiveRoles(a), []);
  assert.equal(can(a, "admin:access"), false);
});

test("el conferencista verificado puede crear conferencias pero no clases ni salas", () => {
  const h = actor({ roles: [{ role: "CONFERENCE_HOST", verification: "APPROVED" }] });
  assert.equal(can(h, "conference:create"), true);
  assert.equal(can(h, "class:create"), false);
  assert.equal(can(h, "room:create"), false);
});

test("acciones de propietario: sólo el dueño o un admin", () => {
  const owner = actor({ id: "u1" });
  const other = actor({ id: "u2" });
  const admin = actor({ id: "u9", roles: [{ role: "ADMIN", verification: "NOT_REQUIRED" }] });
  assert.equal(can(owner, "file:delete", { ownerId: "u1" }), true);
  assert.equal(can(other, "file:delete", { ownerId: "u1" }), false);
  assert.equal(can(owner, "file:delete"), false, "sin ownerId se deniega");
  assert.equal(can(admin, "file:delete", { ownerId: "u1" }), true);
  assert.equal(can(other, "room:manage", { ownerId: "u1" }), false);
});

test("un actor demo jamás accede a administración, aunque tenga rol ADMIN", () => {
  const d = actor({ isDemo: true, roles: [{ role: "ADMIN", verification: "NOT_REQUIRED" }] });
  assert.equal(can(d, "admin:access"), false);
  assert.equal(can(d, "library:moderate"), false);
});

test("un usuario con varios roles acumula permisos sólo de los vigentes", () => {
  const u = actor({
    roles: [
      { role: "STUDENT", verification: "NOT_REQUIRED" },
      { role: "MENTOR", verification: "APPROVED" },
      { role: "CONFERENCE_HOST", verification: "PENDING" },
    ],
  });
  assert.deepEqual(effectiveRoles(u).sort(), ["MENTOR", "STUDENT"]);
  assert.equal(can(u, "class:create"), true);
});

test("assertCan lanza ForbiddenError", () => {
  assert.throws(() => assertCan(actor(), "admin:access"), ForbiddenError);
  assert.doesNotThrow(() => assertCan(actor(), "social:use"));
});
