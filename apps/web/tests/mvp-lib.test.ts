import { test } from "node:test";
import assert from "node:assert/strict";
import { ALGORITHM_VERSION, WEIGHTS, computeMatch, isValidSlot, slotLabel, slotKey, type MatchProfile } from "../../../packages/match-engine/src/index.ts";
import { hashPassword, verifyPassword } from "../src/lib/security/password-scrypt.ts";
import { buildStaticCsp } from "../src/lib/security/csp.ts";

const P = (o: Partial<MatchProfile> = {}): MatchProfile => ({ subjectsEnrolled: [], subjectsStruggling: [], slots: [], interests: [], studyStyles: [], skills: null, modality: null, ...o });

test("los pesos de Smart Match son los definidos y suman 100", () => {
  assert.deepEqual({ ...WEIGHTS }, { subjects: 35, schedule: 25, interests: 15, studyStyles: 10, skills: 10, modality: 5 });
  assert.equal(Object.values(WEIGHTS).reduce((a, b) => a + b, 0), 100);
  assert.equal(ALGORITHM_VERSION, "mvp-0.1");
});
test("perfiles idénticos ⇒ 100; sin coincidencias reales de materias ni horarios ⇒ 0", () => {
  const a = P({ subjectsEnrolled: ["a", "b"], slots: ["0-9", "1-9"], modality: "ONLINE" });
  assert.equal(computeMatch(a, a).score, 100);
  const x = P({ subjectsEnrolled: ["a"], slots: ["0-9"], modality: "ONLINE", interests: ["x"] });
  const y = P({ subjectsEnrolled: ["z"], slots: ["3-15"], modality: "ONLINE", interests: ["x"] });
  assert.equal(computeMatch(x, y).score, 0, "mismos intereses y modalidad no bastan sin materias/horarios en común");
});
test("sólo se evalúan los factores con datos de ambas partes y se normaliza", () => {
  const a = P({ subjectsEnrolled: ["a", "b"], slots: ["0-9"] }), b = P({ subjectsEnrolled: ["a", "b"], slots: ["0-9"] });
  const r = computeMatch(a, b);
  assert.equal(r.evaluatedWeight, 60);
  assert.equal(r.score, 100);
  const half = computeMatch(P({ subjectsEnrolled: ["a", "b"], slots: ["0-9", "1-9"] }), P({ subjectsEnrolled: ["a", "c"], slots: ["0-9", "2-9"] }));
  assert.equal(half.score, Math.round((100 * (35 * 0.5 + 25 * 0.5)) / 60));
});
test("simetría: score(a,b) = score(b,a)", () => {
  const a = P({ subjectsEnrolled: ["a", "b", "c"], slots: ["0-9", "1-11"], interests: ["ia", "web"], modality: "HYBRID", studyStyles: ["EXAM_PREP"] });
  const b = P({ subjectsEnrolled: ["b", "c", "d"], slots: ["1-11", "2-13"], interests: ["web"], modality: "ONLINE", studyStyles: ["EXAM_PREP", "PROJECT_WORK"] });
  assert.equal(computeMatch(a, b).score, computeMatch(b, a).score);
});
test("detecta quién puede apoyar a quién en materias compartidas", () => {
  const me = P({ subjectsEnrolled: ["a"], subjectsStruggling: ["b"] });
  const o = P({ subjectsEnrolled: ["a", "b"], subjectsStruggling: ["a"] });
  const r = computeMatch(me, o);
  assert.deepEqual(r.canHelpYou, ["b"]);
  assert.deepEqual(r.youCanHelp, ["a"]);
  assert.deepEqual(r.sharedSubjects.sort(), ["a", "b"]);
});
test("modalidad: igual 1, híbrida 0.5, en línea vs presencial 0", () => {
  const f = (m1: MatchProfile["modality"], m2: MatchProfile["modality"]) => computeMatch(P({ subjectsEnrolled: ["a"], modality: m1 }), P({ subjectsEnrolled: ["a"], modality: m2 })).breakdown.find((x) => x.key === "modality")!.ratio;
  assert.equal(f("ONLINE", "ONLINE"), 1); assert.equal(f("HYBRID", "ONLINE"), 0.5); assert.equal(f("ONLINE", "IN_PERSON"), 0); assert.equal(f(null, "ONLINE"), null);
});
test("bloques horarios: validación y etiquetas legibles; los inválidos se rechazan", () => {
  assert.ok(isValidSlot(slotKey(0, 9)) && isValidSlot("6-19"));
  for (const bad of ["7-9", "0-8", "0-9; DROP", "", "a-b"]) assert.ok(!isValidSlot(bad), bad);
  assert.equal(slotLabel("0-9"), "Lun 9:00–11:00");
  const r = computeMatch(P({ slots: ["2-13", "0-9"] }), P({ slots: ["0-9", "2-13", "4-7"] }));
  assert.deepEqual(r.sharedSlots, ["0-9", "2-13"]);
});
test("scrypt: verifica la correcta, rechaza la incorrecta y el formato inválido; sal distinta cada vez", async () => {
  const h1 = await hashPassword("una frase larga de prueba"), h2 = await hashPassword("una frase larga de prueba");
  assert.notEqual(h1, h2);
  assert.ok(h1.startsWith("scrypt$65536$8$1$"));
  assert.equal(await verifyPassword(h1, "una frase larga de prueba"), true);
  assert.equal(await verifyPassword(h1, "otra"), false);
  assert.equal(await verifyPassword("basura", "x"), false);
  assert.equal(await verifyPassword("", "x"), false);
});
test("CSP del MVP: sólo scripts propios, sin inline ni eval, sin frames", () => {
  const c = buildStaticCsp();
  assert.match(c, /script-src 'self'(;|$)/);
  assert.ok(!/script-src[^;]*unsafe/.test(c) && c.includes("frame-ancestors 'none'") && c.includes("object-src 'none'") && c.includes("upgrade-insecure-requests"));
  assert.ok(!buildStaticCsp({ isDev: true }).includes("upgrade-insecure-requests"));
});
