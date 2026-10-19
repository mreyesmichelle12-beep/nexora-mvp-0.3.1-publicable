// Fechas, calendario y rachas. Zona horaria fija de El Salvador (UTC-6, sin horario de verano).
export const TZ_OFFSET_MIN = -360;
export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const KINDS = { CLASS: "Clase", STUDY: "Sesión de estudio", EXAM: "Examen", OTHER: "Otro" };
export const pad = (n) => String(n).padStart(2, "0");

export function localParts(ms) {
  const d = new Date(ms + TZ_OFFSET_MIN * 60_000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes(), dow: (d.getUTCDay() + 6) % 7 }; // dow: 0 = lunes
}
export const dayKey = (ms) => { const p = localParts(ms); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };
export const timeLabel = (ms) => { const p = localParts(ms); return `${pad(p.h)}:${pad(p.min)}`; };

/** "2026-03-15" + "09:30" (hora local de El Salvador) → ms UTC. Devuelve null si la fecha u hora no existen. */
export function parseLocal(dateStr, timeStr = "00:00") {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr ?? ""), tm = /^(\d{2}):(\d{2})$/.exec(timeStr ?? "");
  if (!dm || !tm) return null;
  const [y, mo, d, h, mi] = [dm[1], dm[2], dm[3], tm[1], tm[2]].map(Number);
  if (y < 2000 || y > 2100 || h > 23 || mi > 59) return null;
  const ms = Date.UTC(y, mo - 1, d, h, mi) - TZ_OFFSET_MIN * 60_000;
  const p = localParts(ms);
  return p.y === y && p.m === mo && p.d === d && p.h === h && p.min === mi ? ms : null; // ida y vuelta: rechaza 30 de febrero, etc.
}
export const startOfDayMs = (key) => parseLocal(key, "00:00");
export const isDayKey = (k) => parseLocal(k, "00:00") !== null;
export function addDays(key, n) { const ms = startOfDayMs(key) + n * 86_400_000 + 3_600_000; return dayKey(ms); }
export function weekStart(key) { const p = localParts(startOfDayMs(key) + 3_600_000); return addDays(key, -p.dow); }
export const weekDays = (key) => { const s = weekStart(key); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); };
export const monthOf = (key) => { const [y, m] = key.split("-").map(Number); return { y, m }; };
export const addMonths = (key, n) => { const { y, m } = monthOf(key); const t = y * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}-01`; };

/** Semanas (lunes a domingo) que cubren el mes, con los días de relleno de los meses vecinos. */
export function monthGrid(key) {
  const { y, m } = monthOf(key), first = `${y}-${pad(m)}-01`;
  const weeks = []; let cur = weekStart(first);
  do { weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cur, i))); cur = addDays(cur, 7); } while (monthOf(cur).m === m && monthOf(cur).y === y);
  return weeks;
}

/** Racha = días consecutivos con al menos una sesión, terminando hoy (o ayer, si hoy aún no estudiaste). */
export function computeStreak(daySet, todayKey) {
  let cur = daySet.has(todayKey) ? todayKey : addDays(todayKey, -1), n = 0;
  while (daySet.has(cur)) { n++; cur = addDays(cur, -1); }
  return n;
}
/** Minutos por día de la semana actual (lunes a domingo). */
export function weekMinutes(minutesByDay, todayKey) { return weekDays(todayKey).map((k) => ({ key: k, minutes: minutesByDay.get(k) ?? 0 })); }
export const longDate = (key) => { const [y, m, d] = key.split("-").map(Number); return `${d} de ${MONTHS[m - 1]} de ${y}`; };
