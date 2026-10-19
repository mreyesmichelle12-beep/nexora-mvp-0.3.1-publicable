import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePasswordPolicy } from "../src/lib/security/password-policy.ts";

test("acepta una frase larga sin exigir símbolos", () => {
  assert.deepEqual(validatePasswordPolicy("cafe con leche en la u").issues, []);
});
test("rechaza cortas, comunes, repetidas y largas", () => {
  assert.ok(validatePasswordPolicy("abc123").issues.includes("too_short"));
  assert.ok(validatePasswordPolicy("Password123").issues.includes("common"));
  assert.ok(validatePasswordPolicy("aaaaaaaaaaaa").issues.includes("repeated"));
  assert.ok(validatePasswordPolicy("a".repeat(129)).issues.includes("too_long"));
});
test("rechaza contraseñas que contienen el correo o el nombre", () => {
  const ctx = { email: "maria.lopez@ejemplo.edu", firstName: "María", lastName: "López" };
  assert.ok(validatePasswordPolicy("xx-maria.lopez-xx!!", ctx).issues.includes("contains_email"));
  assert.ok(validatePasswordPolicy("mi nombre es maría hoy", ctx).issues.includes("contains_name"));
});
