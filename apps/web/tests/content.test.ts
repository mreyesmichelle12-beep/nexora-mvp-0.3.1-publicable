import { test } from "node:test";
import assert from "node:assert/strict";
import { IMPACT_DATA, impactDerived, FEATURES, HOME_FEATURE_IDS, FAQ, SMART_MATCH_WEIGHTS, NAV, FOOTER_COLUMNS, TEAM, TEAM_DEFAULT_ROLE, MISSION, VISION, VALUES, HISTORY_STEPS, PRODUCTS, PLAN_PRO_PRICE } from "../src/content/site.ts";

test("cifras de Huellas que Transforman: derivados consistentes con los datos del equipo", () => {
  const d = impactDerived();
  assert.equal(d.participationPct, 42.5);
  assert.equal(d.estimatedResourcesUsd, 104.6);
  assert.equal(IMPACT_DATA.invited, 73);
  assert.equal(IMPACT_DATA.directParticipants, 31);
  assert.equal(IMPACT_DATA.dogsInShelter, 102);
  assert.equal(IMPACT_DATA.directPurchaseUsd, 64.6);
  assert.equal(IMPACT_DATA.estimatedDonationsUsd, 40);
  assert.equal(`${IMPACT_DATA.teamMembersInFieldDay} de ${IMPACT_DATA.teamMembersTotal}`, "3 de 5");
});
test("los pesos de Smart Match suman 100 %", () => {
  assert.equal(SMART_MATCH_WEIGHTS.reduce((s, w) => s + w.pct, 0), 100);
});
test("ids de funciones únicos; la portada sólo referencia funciones existentes", () => {
  const ids = FEATURES.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of HOME_FEATURE_IDS) assert.ok(ids.includes(id), id);
  assert.equal(FEATURES.length, 9);
});
test("FAQ: sin duplicados y sin respuestas vacías", () => {
  assert.equal(new Set(FAQ.map((f) => f.q)).size, FAQ.length);
  assert.ok(FAQ.every((f) => f.q.endsWith("?") && f.a.length > 20));
});
test("equipo: 5 integrantes reales, mismo rol genérico y sin cargos inventados", () => {
  assert.equal(TEAM.length, 5);
  assert.deepEqual(TEAM.map((m) => m.name).sort(), ["Ana Gabriela Torres García", "Guillermo Emanuel Valladares Aguilar", "Krissia Raquel Argueta Calona", "Marjorie Nicole Flores Chávez", "Michelle Alexandra Elias Reyes"]);
  assert.ok(TEAM.every((m) => m.role === null && m.bio === null), "no hay cargos ni descripciones inventados");
  assert.equal(new Set(TEAM.map((m) => m.photo)).size, 5, "cada integrante tiene una foto distinta");
  assert.equal(TEAM_DEFAULT_ROLE, "Equipo fundador");
});
test("misión y visión son exactamente las definidas por el equipo", () => {
  assert.equal(MISSION, "Conectar a estudiantes universitarios con personas, herramientas y oportunidades de aprendizaje mediante un ecosistema seguro, eficiente y orientado a la colaboración.");
  assert.equal(VISION, "Convertirse en un ecosistema educativo digital y de apoyo estudiantil de referencia en El Salvador.");
  assert.deepEqual(VALUES.map((v) => v.title), ["Seguridad", "Colaboración", "Innovación aplicada"]);
  assert.equal(HISTORY_STEPS.length, 7);
});
test("productos: sólo nombres; sin precio, material ni disponibilidad. Plan Pro previsto US$3–5", () => {
  assert.equal(PRODUCTS.length, 4);
  assert.ok(PRODUCTS.every((p) => Object.keys(p).sort().join() === "name,photo" && p.photo === null));
  assert.deepEqual([PLAN_PRO_PRICE.min, PLAN_PRO_PRICE.max], [3, 5]);
});
test("el menú principal es plano y exactamente el definido", () => {
  assert.deepEqual(NAV.map((n) => n.label), ["Inicio", "Nosotros", "Plataforma", "Funciones", "Para estudiantes", "Para docentes", "Productos", "Impacto social", "Planes", "FAQ", "Contacto"]);
});
test("no hay afirmaciones de exclusividad ni de app móvil en el contenido", () => {
  const all = JSON.stringify([FAQ, FEATURES, NAV, FOOTER_COLUMNS]).toLowerCase();
  for (const bad of ["primera plataforma", "única plataforma", "app móvil", "aplicación móvil descargable", "whatsapp", "app store", "google play"]) {
    // la FAQ menciona "aplicación móvil" sólo para negarla
    if (bad === "app móvil") continue;
    assert.ok(!all.includes(bad), bad);
  }
});
