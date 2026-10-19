import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLocal, dayKey, timeLabel, addDays, weekStart, weekDays, monthGrid, addMonths, computeStreak, weekMinutes, isDayKey, localParts } from "../src/calendar.mjs";

test("parseLocal: ida y vuelta en hora de El Salvador (UTC-6) y fechas inexistentes rechazadas", () => {
  const ms = parseLocal("2026-03-15", "09:30");
  assert.equal(new Date(ms).toISOString(), "2026-03-15T15:30:00.000Z");
  assert.equal(dayKey(ms), "2026-03-15"); assert.equal(timeLabel(ms), "09:30");
  for (const bad of [["2026-02-30", "10:00"], ["2026-13-01", "10:00"], ["2026-03-15", "24:00"], ["2026-03-15", "10:60"], ["1999-01-01", "10:00"], ["no", "10:00"], [null, "10:00"]]) assert.equal(parseLocal(...bad), null, bad.join(" "));
  assert.equal(parseLocal("2028-02-29", "00:00") !== null, true, "año bisiesto");
});
test("el cambio de día ocurre a las 00:00 locales (06:00 UTC), no a medianoche UTC", () => {
  assert.equal(dayKey(Date.parse("2026-03-15T05:59:00Z")), "2026-03-14");
  assert.equal(dayKey(Date.parse("2026-03-15T06:00:00Z")), "2026-03-15");
  assert.equal(localParts(Date.parse("2026-03-15T06:00:00Z")).h, 0);
});
test("addDays y semanas (lunes a domingo) cruzan meses y años", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01"); assert.equal(addDays("2026-03-01", -1), "2026-02-28"); assert.equal(addDays("2025-12-31", 1), "2026-01-01");
  assert.equal(weekStart("2026-03-15"), "2026-03-09"); // domingo → lunes anterior
  assert.equal(weekStart("2026-03-09"), "2026-03-09");
  assert.deepEqual(weekDays("2026-03-11"), ["2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13", "2026-03-14", "2026-03-15"]);
});
test("monthGrid: filas completas de 7 días que contienen todo el mes", () => {
  for (const k of ["2026-02-01", "2026-03-01", "2026-08-01", "2024-02-01"]) {
    const g = monthGrid(k), flat = g.flat();
    assert.ok(g.every((w) => w.length === 7) && g.length >= 4 && g.length <= 6, k);
    assert.ok(flat.includes(k) && flat.includes(addDays(addMonths(k, 1), -1)), k);
    assert.equal(new Set(flat).size, flat.length);
  }
  assert.equal(monthGrid("2026-02-01").length, 5, "febrero de 2026 empieza en domingo: 5 filas lun-dom (26 ene a 1 mar)");
  assert.equal(monthGrid("2026-02-01")[0][0], "2026-01-26");
});
test("addMonths", () => { assert.equal(addMonths("2026-12-01", 1), "2027-01-01"); assert.equal(addMonths("2026-01-01", -1), "2025-12-01"); });
test("racha: consecutiva hasta hoy; si hoy aún no hay sesión cuenta desde ayer; un hueco la corta", () => {
  const s = (...d) => new Set(d);
  assert.equal(computeStreak(s("2026-03-15", "2026-03-14", "2026-03-13"), "2026-03-15"), 3);
  assert.equal(computeStreak(s("2026-03-14", "2026-03-13"), "2026-03-15"), 2, "hoy aún no estudió: no se pierde la racha");
  assert.equal(computeStreak(s("2026-03-13", "2026-03-12"), "2026-03-15"), 0, "ayer no hubo: racha rota");
  assert.equal(computeStreak(s("2026-03-15", "2026-03-13"), "2026-03-15"), 1);
  assert.equal(computeStreak(s(), "2026-03-15"), 0);
  assert.equal(computeStreak(s("2026-03-01", "2026-02-28"), "2026-03-01"), 2, "cruza de mes");
});
test("minutos de la semana: 7 días de lunes a domingo, con 0 donde no hubo sesión", () => {
  const w = weekMinutes(new Map([["2026-03-10", 50], ["2026-03-15", 25], ["2026-03-01", 99]]), "2026-03-12");
  assert.deepEqual(w.map((d) => d.minutes), [0, 50, 0, 0, 0, 0, 25]); assert.equal(w[0].key, "2026-03-09");
});
test("isDayKey", () => { assert.ok(isDayKey("2026-03-15")); assert.ok(!isDayKey("2026-02-31")); assert.ok(!isDayKey("x")); });
