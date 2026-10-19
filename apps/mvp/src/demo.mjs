// Mundo de demostración: universidad, carreras, materias y estudiantes FICTICIOS (todos is_demo=1).
// Nunca se mezclan con usuarios reales: Smart Match sólo compara demo con demo y real con real.
import { randomBytes } from "node:crypto";
import { slotKey, SLOT_STARTS } from "../../../packages/match-engine/src/index.ts";
import { dayKey, addDays, parseLocal } from "./calendar.mjs";

export const DEMO_UNI = { name: "Universidad Demo", slug: "universidad-demo" };
export const DEMO_CAREERS = ["Ingeniería Demo", "Administración Demo"];
export const DEMO_SUBJECTS = ["Cálculo (demo)", "Programación (demo)", "Física (demo)", "Estadística (demo)", "Bases de Datos (demo)", "Redes (demo)", "Inglés (demo)", "Contabilidad (demo)", "Mercadeo (demo)", "Álgebra (demo)"];
const PEOPLE = ["Camila", "Diego", "Valeria", "Mateo", "Lucía", "Andrés", "Sofía", "Javier", "Daniela", "Rodrigo", "Paula", "Emilio"];
const INTERESTS = ["IA", "Desarrollo web", "Datos", "Emprendimiento", "Diseño", "Redes", "Finanzas"];
const STYLES = ["GROUP_DISCUSSION", "PRACTICE_EXERCISES", "SILENT_COMPANY", "TEACH_EACH_OTHER", "EXAM_PREP", "PROJECT_WORK"];
const MODS = ["ONLINE", "IN_PERSON", "HYBRID"];
const ALL_SLOTS = Array.from({ length: 7 }, (_, d) => SLOT_STARTS.map((s) => slotKey(d, s))).flat();

function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const pick = (r, arr, n) => { const a = [...arr], out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0]); return out; };

export function seedDemoWorld(S) {
  const db = S.db;
  db.prepare("INSERT OR IGNORE INTO universities(id,name,slug,email_domains,active,is_demo) VALUES(?,?,?,?,1,1)").run("demo-uni", DEMO_UNI.name, DEMO_UNI.slug, "[]");
  for (const c of DEMO_CAREERS) S.findOrCreateCareer("demo-uni", c, { demo: 1, source: "seed" });
  const ids = DEMO_SUBJECTS.map((n) => S.findOrCreateSubject("demo-uni", n, { demo: 1, source: "seed" }));
  PEOPLE.forEach((first, i) => {
    const email = `seed-${String(i + 1).padStart(2, "0")}@demo.nexora.invalid`;
    if (S.userByEmail(email)) return;
    const r = rng(1000 + i * 77);
    const uid = S.createStudent({ email, passwordHash: null, firstName: first, lastName: "Demo", uniId: "demo-uni", careerName: DEMO_CAREERS[i % 2], cycle: 1 + (i % 6), modality: MODS[i % 3], demo: 1, demoSeed: 1 });
    const subs = pick(r, ids, 3 + Math.floor(r() * 3));
    subs.forEach((sid, k) => S.setSubject(uid, sid, k === 0 && r() < 0.6 ? "STRUGGLING" : "ENROLLED"));
    S.replaceSlots(uid, pick(r, ALL_SLOTS, 8 + Math.floor(r() * 8)));
    S.updateProfile(uid, { firstName: first, lastName: "Demo", bio: "Perfil de demostración con datos ficticios.", modality: MODS[i % 3], interests: pick(r, INTERESTS, 2 + Math.floor(r() * 2)), studyStyles: pick(r, STYLES, 1 + Math.floor(r() * 3)), discoverable: true, careerName: DEMO_CAREERS[i % 2], cycle: 1 + (i % 6), uniId: "demo-uni", demo: 1 });
  });
}

/** Visitante de la feria: cuenta demo efímera (sin contraseña) con datos de ejemplo editables. */
export function createDemoVisitor(S) {
  const email = `demo-${randomBytes(6).toString("hex")}@demo.nexora.invalid`;
  const uid = S.createStudent({ email, passwordHash: null, firstName: "Visitante", lastName: "Demo", uniId: "demo-uni", careerName: DEMO_CAREERS[0], cycle: 3, modality: "HYBRID", demo: 1 });
  const id = (n) => S.findOrCreateSubject("demo-uni", n, { demo: 1, source: "seed" });
  S.setSubject(uid, id("Cálculo (demo)"), "ENROLLED"); S.setSubject(uid, id("Programación (demo)"), "ENROLLED");
  S.setSubject(uid, id("Estadística (demo)"), "ENROLLED"); S.setSubject(uid, id("Física (demo)"), "STRUGGLING");
  S.replaceSlots(uid, ["0-9", "1-9", "2-15", "3-15", "4-11", "5-9", "0-15", "2-9", "3-9", "4-15"]);
  S.updateProfile(uid, { firstName: "Visitante", lastName: "Demo", bio: "", modality: "HYBRID", interests: ["Desarrollo web", "Datos"], studyStyles: ["PRACTICE_EXERCISES", "GROUP_DISCUSSION"], discoverable: true, careerName: DEMO_CAREERS[0], cycle: 3, uniId: "demo-uni", demo: 1 });
  // Actividad social de ejemplo (ficticia): dos solicitudes recibidas y una conversación con una conexión ya aceptada
  const seed = (n) => S.userByEmail(`seed-${String(n).padStart(2, "0")}@demo.nexora.invalid`)?.id;
  const hour = 3600_000, t = Date.now();
  if (seed(1) && seed(2) && seed(3)) {
    S.createConnection(seed(1), uid, t - 5 * hour); S.createConnection(seed(2), uid, t - 3 * hour);
    const cid = S.createConnection(seed(3), uid, t - 26 * hour); S.setConnection(cid, "ACCEPTED");
    const conv = S.conversationFor(seed(3), uid);
    S.addMessage(conv, seed(3), "¡Hola! Vi que compartimos Cálculo. ¿Estudiamos juntos esta semana?", t - 2 * hour);
  }
  // Progreso y calendario de ejemplo (ficticios): 3 días de estudio, 2 objetivos y 3 eventos
  const today = dayKey(Date.now()), at = (k, hm) => parseLocal(k, hm);
  S.addSession(uid, 25, { endedAt: at(addDays(today, -2), "19:30"), source: "timer" }); S.addSession(uid, 50, { endedAt: at(addDays(today, -1), "20:15"), source: "timer" }); S.addSession(uid, 25, { endedAt: Date.now() - 60_000, source: "timer" });
  const g1 = S.addGoal(uid, { title: "Repasar la unidad 2 de Cálculo (demo)", subjectId: id("Cálculo (demo)"), targetDate: addDays(today, 5) });
  S.addGoal(uid, { title: "Entregar el proyecto de Programación (demo)", subjectId: id("Programación (demo)"), targetDate: addDays(today, 12) }); S.setGoalStatus(uid, g1, "ACTIVE");
  S.addEvent(uid, { title: "Clase de Cálculo (demo)", kind: "CLASS", startsAt: at(addDays(today, 1), "10:00"), endsAt: at(addDays(today, 1), "11:40") });
  S.addEvent(uid, { title: "Estudio en grupo (demo)", kind: "STUDY", startsAt: at(addDays(today, 2), "15:00"), endsAt: at(addDays(today, 2), "17:00") });
  S.addEvent(uid, { title: "Examen parcial de Física (demo)", kind: "EXAM", startsAt: at(addDays(today, 6), "08:00"), endsAt: at(addDays(today, 6), "10:00") });
  return uid;
}

export function seedRealCatalog(S) {
  S.db.prepare("INSERT OR IGNORE INTO universities(id,name,slug,email_domains,active,is_demo) VALUES(?,?,?,?,1,0)").run("udb", "Universidad Don Bosco", "universidad-don-bosco", "[]");
}
