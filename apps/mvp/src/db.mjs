import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { pairOf } from "./social.mjs";
import { dayKey } from "./calendar.mjs";

export const now = () => Date.now();
export const newId = () => randomUUID();
/** Normaliza nombres de materias/carreras para que "Cálculo II" y "calculo ii" coincidan entre estudiantes. */
export const normName = (s) => String(s).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

const SCHEMA = `
CREATE TABLE users(
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE',
  is_demo INTEGER NOT NULL DEFAULT 0, demo_seed INTEGER NOT NULL DEFAULT 0, email_verified_at INTEGER,
  created_at INTEGER NOT NULL, last_login_at INTEGER);
CREATE TABLE user_roles(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL, verification TEXT NOT NULL DEFAULT 'NOT_REQUIRED', PRIMARY KEY(user_id, role));
CREATE TABLE sessions(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL, last_used_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, revoked_at INTEGER, ip_hash TEXT, user_agent TEXT);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE profiles(
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, first_name TEXT NOT NULL, last_name TEXT NOT NULL, bio TEXT,
  modality TEXT, interests TEXT NOT NULL DEFAULT '[]', study_styles TEXT NOT NULL DEFAULT '[]', discoverable INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL);
CREATE TABLE universities(id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, email_domains TEXT NOT NULL DEFAULT '[]', active INTEGER NOT NULL DEFAULT 1, is_demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE careers(id TEXT PRIMARY KEY, university_id TEXT NOT NULL REFERENCES universities(id), name TEXT NOT NULL, name_norm TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'user', is_demo INTEGER NOT NULL DEFAULT 0, UNIQUE(university_id, name_norm));
-- Catálogo de materias por universidad (no por carrera) para que materias comunes coincidan entre carreras. Se cura desde el panel admin (fase posterior).
CREATE TABLE subjects(id TEXT PRIMARY KEY, university_id TEXT NOT NULL REFERENCES universities(id), name TEXT NOT NULL, name_norm TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'user', is_demo INTEGER NOT NULL DEFAULT 0, UNIQUE(university_id, name_norm));
CREATE TABLE student_profiles(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, university_id TEXT NOT NULL REFERENCES universities(id), career_id TEXT NOT NULL REFERENCES careers(id), cycle INTEGER NOT NULL);
CREATE TABLE student_subjects(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE, relation TEXT NOT NULL CHECK(relation IN ('ENROLLED','STRUGGLING')), PRIMARY KEY(user_id, subject_id));
CREATE TABLE availability(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, slot TEXT NOT NULL, PRIMARY KEY(user_id, slot));
CREATE TABLE consents(id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, type TEXT NOT NULL, granted INTEGER NOT NULL, policy_version TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE contact_messages(id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'NEW', ip_hash TEXT, created_at INTEGER NOT NULL);
CREATE TABLE audit_logs(id TEXT PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, target TEXT, meta TEXT, ip_hash TEXT, created_at INTEGER NOT NULL);
CREATE INDEX audit_action ON audit_logs(action, created_at);
`;
const SCHEMA_2 = `
-- Conexiones académicas: una fila por pareja (user_a < user_b). requester_id dice quién la inició.
CREATE TABLE connections(
  id TEXT PRIMARY KEY, user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('PENDING','ACCEPTED','DECLINED')), created_at INTEGER NOT NULL, responded_at INTEGER,
  UNIQUE(user_a, user_b), CHECK(user_a < user_b));
CREATE INDEX connections_a ON connections(user_a, status); CREATE INDEX connections_b ON connections(user_b, status);
CREATE TABLE blocks(blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER NOT NULL, PRIMARY KEY(blocker_id, blocked_id));
-- Conversaciones 1 a 1. Si una de las dos cuentas se elimina, se elimina la conversación completa.
CREATE TABLE conversations(id TEXT PRIMARY KEY, user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER NOT NULL, UNIQUE(user_a, user_b), CHECK(user_a < user_b));
CREATE TABLE conversation_reads(conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, last_read_at INTEGER NOT NULL, PRIMARY KEY(conversation_id, user_id));
CREATE TABLE messages(id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX messages_conv ON messages(conversation_id, created_at);
-- Reportes de usuarios (los revisará el panel admin en una fase posterior)
CREATE TABLE reports(id TEXT PRIMARY KEY, reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL, details TEXT, status TEXT NOT NULL DEFAULT 'OPEN', created_at INTEGER NOT NULL);
CREATE INDEX reports_status ON reports(status, created_at);
`;
const SCHEMA_3 = `
ALTER TABLE profiles ADD COLUMN show_streak INTEGER NOT NULL DEFAULT 1;
CREATE TABLE goals(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL, target_date TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','DONE')), created_at INTEGER NOT NULL, done_at INTEGER);
CREATE INDEX goals_user ON goals(user_id, status);
-- Sesiones de estudio: tiempo autodeclarado desde el temporizador (o registrado a mano)
CREATE TABLE study_sessions(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, focus_minutes INTEGER NOT NULL CHECK(focus_minutes BETWEEN 1 AND 180), goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL, ended_at INTEGER NOT NULL, source TEXT NOT NULL DEFAULT 'timer');
CREATE INDEX sessions_user_time ON study_sessions(user_id, ended_at);
CREATE TABLE calendar_events(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('CLASS','STUDY','EXAM','OTHER')), starts_at INTEGER NOT NULL, ends_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX events_user_time ON calendar_events(user_id, starts_at);
`;
const SCHEMA_4 = `
ALTER TABLE reports ADD COLUMN resolved_by TEXT; ALTER TABLE reports ADD COLUMN resolved_at INTEGER; ALTER TABLE reports ADD COLUMN resolution_note TEXT;
-- "Oculta en sugerencias": las materias/carreras inactivas siguen vinculadas a quien ya las usa
ALTER TABLE subjects ADD COLUMN active INTEGER NOT NULL DEFAULT 1; ALTER TABLE careers ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
-- Verificación manual de docentes, mentores y conferencistas. Nadie obtiene el rol sin aprobación.
CREATE TABLE verification_requests(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK(role IN ('TEACHER','MENTOR','CONFERENCE_HOST')), institution TEXT NOT NULL, evidence_note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')), reviewed_by TEXT, reviewed_at INTEGER, review_note TEXT, created_at INTEGER NOT NULL);
CREATE INDEX verif_status ON verification_requests(status, created_at);
`;
const MIGRATIONS = [SCHEMA, SCHEMA_2, SCHEMA_3, SCHEMA_4]; // versión = índice + 1 (PRAGMA user_version)

export function openDb(file) {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  const v = db.prepare("PRAGMA user_version").get().user_version;
  for (let i = v; i < MIGRATIONS.length; i++) { db.exec("BEGIN"); try { db.exec(MIGRATIONS[i]); db.exec(`PRAGMA user_version = ${i + 1}`); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; } }
  return db;
}

export function tx(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try { const r = fn(); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; }
}

/** Consultas de la aplicación. Todas parametrizadas: nunca se concatena entrada del usuario en el SQL. */
export function makeStore(db) {
  const q = (sql) => db.prepare(sql);
  const S = {
    db,
    audit(actorId, action, target, meta, ipHash) { q("INSERT INTO audit_logs(id,actor_id,action,target,meta,ip_hash,created_at) VALUES(?,?,?,?,?,?,?)").run(newId(), actorId ?? null, action, target ?? null, meta ? JSON.stringify(meta) : null, ipHash ?? null, now()); },

    universities: () => q("SELECT id,name,slug FROM universities WHERE active=1 AND is_demo=0 ORDER BY name").all(),
    university: (id) => q("SELECT * FROM universities WHERE id=?").get(id),
    careerNames: (uniId) => q("SELECT name FROM careers WHERE university_id=? AND active=1 ORDER BY name").all(uniId).map((r) => r.name),
    subjectNames: (uniId) => q("SELECT name FROM subjects WHERE university_id=? AND active=1 ORDER BY name").all(uniId).map((r) => r.name),

    userByEmail: (email) => q("SELECT * FROM users WHERE email=?").get(email),
    userById: (id) => q("SELECT * FROM users WHERE id=?").get(id),
    roles: (id) => q("SELECT role, verification FROM user_roles WHERE user_id=?").all(id),

    findOrCreateCareer(uniId, name, { demo = 0, source = "user" } = {}) {
      const n = normName(name);
      const row = q("SELECT id FROM careers WHERE university_id=? AND name_norm=?").get(uniId, n);
      if (row) return row.id;
      const id = newId(); q("INSERT INTO careers(id,university_id,name,name_norm,source,is_demo) VALUES(?,?,?,?,?,?)").run(id, uniId, name.trim(), n, source, demo); return id;
    },
    findOrCreateSubject(uniId, name, { demo = 0, source = "user" } = {}) {
      const n = normName(name);
      const row = q("SELECT id FROM subjects WHERE university_id=? AND name_norm=?").get(uniId, n);
      if (row) return row.id;
      const id = newId(); q("INSERT INTO subjects(id,university_id,name,name_norm,source,is_demo) VALUES(?,?,?,?,?,?)").run(id, uniId, name.trim(), n, source, demo); return id;
    },

    createStudent({ email, passwordHash, firstName, lastName, uniId, careerName, cycle, modality, demo = 0, demoSeed = 0 }) {
      return tx(db, () => {
        const id = newId(), t = now();
        q("INSERT INTO users(id,email,password_hash,status,is_demo,demo_seed,created_at) VALUES(?,?,?,?,?,?,?)").run(id, email, passwordHash, "ACTIVE", demo, demoSeed, t);
        q("INSERT INTO user_roles(user_id,role,verification) VALUES(?,?,?)").run(id, "STUDENT", "NOT_REQUIRED");
        q("INSERT INTO profiles(user_id,first_name,last_name,modality,updated_at) VALUES(?,?,?,?,?)").run(id, firstName, lastName, modality, t);
        const careerId = S.findOrCreateCareer(uniId, careerName, { demo });
        q("INSERT INTO student_profiles(user_id,university_id,career_id,cycle) VALUES(?,?,?,?)").run(id, uniId, careerId, cycle);
        return id;
      });
    },

    /** Todo lo que el MVP sabe de un estudiante. */
    bundle(userId) {
      const user = S.userById(userId); if (!user) return null;
      const profile = q("SELECT * FROM profiles WHERE user_id=?").get(userId);
      const sp = q("SELECT sp.cycle, sp.university_id, sp.career_id, u.name AS university, c.name AS career FROM student_profiles sp JOIN universities u ON u.id=sp.university_id JOIN careers c ON c.id=sp.career_id WHERE sp.user_id=?").get(userId);
      const subjects = q("SELECT s.id, s.name, ss.relation FROM student_subjects ss JOIN subjects s ON s.id=ss.subject_id WHERE ss.user_id=? ORDER BY s.name").all(userId);
      const slots = q("SELECT slot FROM availability WHERE user_id=?").all(userId).map((r) => r.slot);
      return { user, profile: profile && { ...profile, interests: JSON.parse(profile.interests), study_styles: JSON.parse(profile.study_styles) }, student: sp, subjects, slots };
    },

    setSubject(userId, subjectId, relation) { q("INSERT INTO student_subjects(user_id,subject_id,relation) VALUES(?,?,?) ON CONFLICT(user_id,subject_id) DO UPDATE SET relation=excluded.relation").run(userId, subjectId, relation); },
    removeSubject(userId, subjectId) { q("DELETE FROM student_subjects WHERE user_id=? AND subject_id=?").run(userId, subjectId); },
    subjectCount: (userId) => q("SELECT COUNT(*) n FROM student_subjects WHERE user_id=?").get(userId).n,
    hasSubject: (userId, subjectId) => !!q("SELECT 1 FROM student_subjects WHERE user_id=? AND subject_id=?").get(userId, subjectId),
    subjectInUniversity: (subjectId, uniId) => !!q("SELECT 1 FROM subjects WHERE id=? AND university_id=?").get(subjectId, uniId),
    replaceSlots(userId, slots) { tx(db, () => { q("DELETE FROM availability WHERE user_id=?").run(userId); const ins = q("INSERT INTO availability(user_id,slot) VALUES(?,?)"); for (const s of slots) ins.run(userId, s); }); },

    updateProfile(userId, { firstName, lastName, bio, modality, interests, studyStyles, discoverable, careerName, cycle, uniId, demo }) {
      tx(db, () => {
        q("UPDATE profiles SET first_name=?, last_name=?, bio=?, modality=?, interests=?, study_styles=?, discoverable=?, updated_at=? WHERE user_id=?").run(firstName, lastName, bio || null, modality, JSON.stringify(interests), JSON.stringify(studyStyles), discoverable ? 1 : 0, now(), userId);
        const careerId = S.findOrCreateCareer(uniId, careerName, { demo });
        q("UPDATE student_profiles SET career_id=?, cycle=? WHERE user_id=?").run(careerId, cycle, userId);
      });
    },

    /** Candidatos para Smart Match: misma universidad, mismo "mundo" (demo con demo, real con real), cuenta activa y visible. */
    candidates(userId, uniId, isDemo) {
      return q(`SELECT u.id, u.is_demo, p.first_name, p.last_name, p.modality, p.interests, p.study_styles, sp.cycle, c.name AS career
        FROM users u JOIN profiles p ON p.user_id=u.id JOIN student_profiles sp ON sp.user_id=u.id JOIN careers c ON c.id=sp.career_id
        WHERE u.status='ACTIVE' AND u.is_demo=? AND sp.university_id=? AND u.id<>? AND p.discoverable=1`).all(isDemo ? 1 : 0, uniId, userId);
    },
    subjectsOf: (ids) => (ids.length ? q(`SELECT user_id, subject_id, relation FROM student_subjects WHERE user_id IN (${ids.map(() => "?").join(",")})`).all(...ids) : []),
    slotsOf: (ids) => (ids.length ? q(`SELECT user_id, slot FROM availability WHERE user_id IN (${ids.map(() => "?").join(",")})`).all(...ids) : []),
    subjectNameMap(uniId) { return new Map(q("SELECT id,name FROM subjects WHERE university_id=?").all(uniId).map((r) => [r.id, r.name])); },

    deleteUser: (id) => q("DELETE FROM users WHERE id=?").run(id),
    purgeOldDemoUsers(olderThanMs) { return q("DELETE FROM users WHERE is_demo=1 AND demo_seed=0 AND created_at<?").run(now() - olderThanMs).changes; },
    saveContact(m) { q("INSERT INTO contact_messages(id,name,email,subject,message,ip_hash,created_at) VALUES(?,?,?,?,?,?,?)").run(newId(), m.name, m.email, m.subject, m.message, m.ipHash, now()); },
    recordConsent(userId, type, granted, version) { q("INSERT INTO consents(id,user_id,type,granted,policy_version,created_at) VALUES(?,?,?,?,?,?)").run(newId(), userId, type, granted ? 1 : 0, version, now()); },


    /* ───── Conexiones ───── */
    userCard: (id) => q("SELECT u.id, u.status, u.is_demo, p.first_name, p.last_name, sp.university_id, sp.cycle, c.name AS career FROM users u JOIN profiles p ON p.user_id=u.id JOIN student_profiles sp ON sp.user_id=u.id JOIN careers c ON c.id=sp.career_id WHERE u.id=?").get(id),
    connectionBetween(a, b) { const [x, y] = pairOf(a, b); return q("SELECT * FROM connections WHERE user_a=? AND user_b=?").get(x, y) ?? null; },
    createConnection(requester, other, at = now()) { const [x, y] = pairOf(requester, other); const id = newId(); q("INSERT INTO connections(id,user_a,user_b,requester_id,status,created_at) VALUES(?,?,?,?,'PENDING',?)").run(id, x, y, requester, at); return id; },
    setConnection(id, status, requester) { q("UPDATE connections SET status=?, requester_id=COALESCE(?, requester_id), responded_at=?, created_at=CASE WHEN ? IS NOT NULL THEN ? ELSE created_at END WHERE id=?").run(status, requester ?? null, status === "PENDING" ? null : now(), requester ?? null, now(), id); },
    deleteConnection(a, b) { const [x, y] = pairOf(a, b); q("DELETE FROM connections WHERE user_a=? AND user_b=?").run(x, y); },
    /** Mapa otraPersona -> fila, para decorar las tarjetas de Smart Match. */
    connectionMap(me) { return new Map(q("SELECT * FROM connections WHERE user_a=? OR user_b=?").all(me, me).map((r) => [r.user_a === me ? r.user_b : r.user_a, r])); },
    connectionsOf(me) {
      return q(`SELECT cn.id, cn.status, cn.requester_id, cn.created_at, cn.responded_at, o.id AS other_id, p.first_name, p.last_name, sp.cycle, c.name AS career, o.is_demo
        FROM connections cn JOIN users o ON o.id = CASE WHEN cn.user_a=? THEN cn.user_b ELSE cn.user_a END
        JOIN profiles p ON p.user_id=o.id JOIN student_profiles sp ON sp.user_id=o.id JOIN careers c ON c.id=sp.career_id
        WHERE (cn.user_a=? OR cn.user_b=?) AND o.status='ACTIVE' ORDER BY cn.created_at DESC`).all(me, me, me);
    },
    pendingIncoming: (me) => q("SELECT COUNT(*) n FROM connections WHERE status='PENDING' AND requester_id<>? AND (user_a=? OR user_b=?)").get(me, me, me).n,

    /* ───── Bloqueos ───── */
    isBlocked: (a, b) => !!q("SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)").get(a, b, b, a),
    blockedIds: (me) => new Set(q("SELECT blocked_id AS id FROM blocks WHERE blocker_id=? UNION SELECT blocker_id FROM blocks WHERE blocked_id=?").all(me, me).map((r) => r.id)),
    block(blocker, blocked) { tx(db, () => { q("INSERT OR IGNORE INTO blocks(blocker_id,blocked_id,created_at) VALUES(?,?,?)").run(blocker, blocked, now()); S.deleteConnection(blocker, blocked); S.deleteConversation(blocker, blocked); }); },
    unblock(blocker, blocked) { q("DELETE FROM blocks WHERE blocker_id=? AND blocked_id=?").run(blocker, blocked); },
    blockedList: (me) => q("SELECT b.blocked_id AS id, p.first_name, p.last_name FROM blocks b JOIN profiles p ON p.user_id=b.blocked_id WHERE b.blocker_id=? ORDER BY b.created_at DESC").all(me),

    /* ───── Mensajes ───── */
    conversationFor(a, b) {
      const [x, y] = pairOf(a, b);
      const row = q("SELECT id FROM conversations WHERE user_a=? AND user_b=?").get(x, y);
      if (row) return row.id;
      const id = newId(); q("INSERT INTO conversations(id,user_a,user_b,created_at) VALUES(?,?,?,?)").run(id, x, y, now()); return id;
    },
    deleteConversation(a, b) { const [x, y] = pairOf(a, b); q("DELETE FROM conversations WHERE user_a=? AND user_b=?").run(x, y); },
    conversation: (id) => q("SELECT * FROM conversations WHERE id=?").get(id) ?? null,
    addMessage(convId, senderId, body, at = now()) { const id = newId(); q("INSERT INTO messages(id,conversation_id,sender_id,body,created_at) VALUES(?,?,?,?,?)").run(id, convId, senderId, body, at); return id; },
    messagesOf: (convId) => q("SELECT id, sender_id, body, created_at FROM messages WHERE conversation_id=? ORDER BY created_at ASC, rowid ASC LIMIT 300").all(convId),
    markRead(convId, userId) { q("INSERT INTO conversation_reads(conversation_id,user_id,last_read_at) VALUES(?,?,?) ON CONFLICT(conversation_id,user_id) DO UPDATE SET last_read_at=excluded.last_read_at").run(convId, userId, now()); },
    lastRead: (convId, userId) => q("SELECT last_read_at FROM conversation_reads WHERE conversation_id=? AND user_id=?").get(convId, userId)?.last_read_at ?? 0,
    recentDuplicates: (convId, senderId, body, since) => q("SELECT COUNT(*) n FROM messages WHERE conversation_id=? AND sender_id=? AND body=? AND created_at>?").get(convId, senderId, body, since).n,
    /** Bandeja: sólo conversaciones con una conexión ACEPTADA y sin bloqueo. */
    inbox(me) {
      return q(`SELECT cv.id, o.id AS other_id, p.first_name, p.last_name, o.is_demo,
          (SELECT body FROM messages m WHERE m.conversation_id=cv.id ORDER BY m.created_at DESC, m.rowid DESC LIMIT 1) AS last_body,
          (SELECT created_at FROM messages m WHERE m.conversation_id=cv.id ORDER BY m.created_at DESC, m.rowid DESC LIMIT 1) AS last_at,
          (SELECT COUNT(*) FROM messages m WHERE m.conversation_id=cv.id AND m.sender_id<>? AND m.created_at > COALESCE((SELECT last_read_at FROM conversation_reads r WHERE r.conversation_id=cv.id AND r.user_id=?),0)) AS unread
        FROM conversations cv JOIN users o ON o.id = CASE WHEN cv.user_a=? THEN cv.user_b ELSE cv.user_a END JOIN profiles p ON p.user_id=o.id
        JOIN connections cn ON cn.user_a=cv.user_a AND cn.user_b=cv.user_b AND cn.status='ACCEPTED'
        WHERE (cv.user_a=? OR cv.user_b=?) AND o.status='ACTIVE'
          AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=cv.user_a AND b.blocked_id=cv.user_b) OR (b.blocker_id=cv.user_b AND b.blocked_id=cv.user_a))
        ORDER BY COALESCE(last_at, cv.created_at) DESC`).all(me, me, me, me, me);
    },
    unreadTotal: (me) => S.inbox(me).reduce((n, c) => n + c.unread, 0),

    report(reporterId, type, targetId, reason, details) { q("INSERT INTO reports(id,reporter_id,target_type,target_id,reason,details,created_at) VALUES(?,?,?,?,?,?,?)").run(newId(), reporterId, type, targetId, reason, details || null, now()); },


    /* ───── Progreso: objetivos y sesiones ───── */
    addGoal(uid, { title, subjectId, targetDate }) { const id = newId(); q("INSERT INTO goals(id,user_id,title,subject_id,target_date,created_at) VALUES(?,?,?,?,?,?)").run(id, uid, title, subjectId ?? null, targetDate ?? null, now()); return id; },
    goalCount: (uid) => q("SELECT COUNT(*) n FROM goals WHERE user_id=?").get(uid).n,
    goalsOf: (uid) => q("SELECT g.*, s.name AS subject FROM goals g LEFT JOIN subjects s ON s.id=g.subject_id WHERE g.user_id=? ORDER BY (g.status='DONE'), COALESCE(g.target_date,'9999'), g.created_at DESC").all(uid),
    setGoalStatus(uid, id, status) { return q("UPDATE goals SET status=?, done_at=? WHERE id=? AND user_id=?").run(status, status === "DONE" ? now() : null, id, uid).changes; },
    deleteGoal(uid, id) { return q("DELETE FROM goals WHERE id=? AND user_id=?").run(id, uid).changes; },
    goalOwned: (uid, id) => !!q("SELECT 1 FROM goals WHERE id=? AND user_id=?").get(id, uid),
    addSession(uid, minutes, { goalId = null, endedAt = now(), source = "timer" } = {}) { const id = newId(); q("INSERT INTO study_sessions(id,user_id,focus_minutes,goal_id,ended_at,source) VALUES(?,?,?,?,?,?)").run(id, uid, minutes, goalId, endedAt, source); return id; },
    sessionsSince: (uid, sinceMs) => q("SELECT id, focus_minutes, ended_at, source, goal_id FROM study_sessions WHERE user_id=? AND ended_at>=? ORDER BY ended_at DESC").all(uid, sinceMs),
    recentSessions: (uid, n = 15) => q("SELECT ss.id, ss.focus_minutes, ss.ended_at, ss.source, g.title AS goal FROM study_sessions ss LEFT JOIN goals g ON g.id=ss.goal_id WHERE ss.user_id=? ORDER BY ss.ended_at DESC LIMIT ?").all(uid, n),
    sessionTotals: (uid) => q("SELECT COUNT(*) n, COALESCE(SUM(focus_minutes),0) minutes FROM study_sessions WHERE user_id=?").get(uid),
    sessionsLastHour: (uid) => q("SELECT COUNT(*) n FROM study_sessions WHERE user_id=? AND ended_at>?").get(uid, now() - 3600_000).n,
    /** Minutos por día local y conjunto de días con estudio (últimos 400 días). */
    studyDays(uid) { const byDay = new Map(); for (const r of S.sessionsSince(uid, now() - 400 * 86400_000)) { const k = dayKey(r.ended_at); byDay.set(k, (byDay.get(k) ?? 0) + r.focus_minutes); } return byDay; },
    setShowStreak(uid, on) { q("UPDATE profiles SET show_streak=? WHERE user_id=?").run(on ? 1 : 0, uid); },

    /* ───── Calendario ───── */
    addEvent(uid, { title, kind, startsAt, endsAt }) { const id = newId(); q("INSERT INTO calendar_events(id,user_id,title,kind,starts_at,ends_at,created_at) VALUES(?,?,?,?,?,?,?)").run(id, uid, title, kind, startsAt, endsAt, now()); return id; },
    eventCount: (uid) => q("SELECT COUNT(*) n FROM calendar_events WHERE user_id=?").get(uid).n,
    eventsBetween: (uid, from, to) => q("SELECT id, title, kind, starts_at, ends_at FROM calendar_events WHERE user_id=? AND starts_at>=? AND starts_at<? ORDER BY starts_at").all(uid, from, to),
    nextEvent: (uid) => q("SELECT id, title, kind, starts_at FROM calendar_events WHERE user_id=? AND starts_at>=? ORDER BY starts_at LIMIT 1").get(uid, now()) ?? null,
    deleteEvent(uid, id) { return q("DELETE FROM calendar_events WHERE id=? AND user_id=?").run(id, uid).changes; },
    goalsDueBetween: (uid, fromKey, toKey) => q("SELECT id, title, target_date, status FROM goals WHERE user_id=? AND target_date>=? AND target_date<=? ORDER BY target_date").all(uid, fromKey, toKey),


    /* ───── Docentes, mentores y conferencistas (verificación manual) ───── */
    createTeacher({ email, passwordHash, firstName, lastName, role, institution, evidence }) {
      return tx(db, () => {
        const id = newId(), t = now();
        q("INSERT INTO users(id,email,password_hash,status,is_demo,created_at) VALUES(?,?,?,'ACTIVE',0,?)").run(id, email, passwordHash, t);
        q("INSERT INTO user_roles(user_id,role,verification) VALUES(?,?,'PENDING')").run(id, role);
        q("INSERT INTO profiles(user_id,first_name,last_name,updated_at) VALUES(?,?,?,?)").run(id, firstName, lastName, t);
        q("INSERT INTO verification_requests(id,user_id,role,institution,evidence_note,created_at) VALUES(?,?,?,?,?,?)").run(newId(), id, role, institution, evidence || null, t);
        return id;
      });
    },
    createAdmin({ email, passwordHash, firstName, lastName }) {
      return tx(db, () => { const id = newId(), t = now(); q("INSERT INTO users(id,email,password_hash,status,is_demo,created_at) VALUES(?,?,?,'ACTIVE',0,?)").run(id, email, passwordHash, t); q("INSERT INTO user_roles(user_id,role,verification) VALUES(?,'ADMIN','NOT_REQUIRED')").run(id); q("INSERT INTO profiles(user_id,first_name,last_name,updated_at) VALUES(?,?,?,?)").run(id, firstName, lastName, t); return id; });
    },
    grantAdmin(uid) { q("INSERT INTO user_roles(user_id,role,verification) VALUES(?,'ADMIN','NOT_REQUIRED') ON CONFLICT(user_id,role) DO UPDATE SET verification='NOT_REQUIRED'").run(uid); },
    revokeAdmin(uid) { q("DELETE FROM user_roles WHERE user_id=? AND role='ADMIN'").run(uid); },
    admins: () => q("SELECT u.id, u.email, u.status FROM users u JOIN user_roles r ON r.user_id=u.id WHERE r.role='ADMIN' ORDER BY u.created_at").all(),
    isAdmin: (uid) => !!q("SELECT 1 FROM user_roles WHERE user_id=? AND role='ADMIN'").get(uid),
    requestsOf: (uid) => q("SELECT * FROM verification_requests WHERE user_id=? ORDER BY created_at DESC").all(uid),
    verificationQueue: (status) => q(`SELECT v.*, u.email, p.first_name, p.last_name FROM verification_requests v JOIN users u ON u.id=v.user_id JOIN profiles p ON p.user_id=u.id WHERE (?='ALL' OR v.status=?) ORDER BY (v.status='PENDING') DESC, v.created_at DESC LIMIT 100`).all(status, status),
    verificationById: (id) => q("SELECT * FROM verification_requests WHERE id=?").get(id) ?? null,
    reviewVerification(id, status, reviewerId, note) {
      tx(db, () => { const v = S.verificationById(id); q("UPDATE verification_requests SET status=?, reviewed_by=?, reviewed_at=?, review_note=? WHERE id=?").run(status, reviewerId, now(), note || null, id); q("UPDATE user_roles SET verification=? WHERE user_id=? AND role=?").run(status, v.user_id, v.role); });
    },
    pendingVerificationCount: () => q("SELECT COUNT(*) n FROM verification_requests WHERE status='PENDING'").get().n,

    /* ───── Administración ───── */
    adminStats() {
      const c = (sql, ...a) => q(sql).get(...a).n, week = now() - 7 * 86400_000;
      return {
        users: c("SELECT COUNT(*) n FROM users WHERE is_demo=0"), newWeek: c("SELECT COUNT(*) n FROM users WHERE is_demo=0 AND created_at>?", week),
        students: c("SELECT COUNT(DISTINCT user_id) n FROM student_profiles sp JOIN users u ON u.id=sp.user_id WHERE u.is_demo=0"), suspended: c("SELECT COUNT(*) n FROM users WHERE is_demo=0 AND status<>'ACTIVE'"),
        openReports: c("SELECT COUNT(*) n FROM reports WHERE status IN ('OPEN','REVIEWING')"), pendingVerif: S.pendingVerificationCount(), newContact: c("SELECT COUNT(*) n FROM contact_messages WHERE status='NEW'"),
        connections: c("SELECT COUNT(*) n FROM connections WHERE status='ACCEPTED'"), messages: c("SELECT COUNT(*) n FROM messages m JOIN users u ON u.id=m.sender_id WHERE u.is_demo=0"), sessions: c("SELECT COUNT(*) n FROM study_sessions s JOIN users u ON u.id=s.user_id WHERE u.is_demo=0"),
        demoVisitors: c("SELECT COUNT(*) n FROM users WHERE is_demo=1 AND demo_seed=0"),
      };
    },
    listUsers({ q: text = "", status = "", role = "", demo = false, limit = 25, offset = 0 }) {
      const like = `%${String(text).replace(/[\\%_]/g, "\\$&").toLowerCase()}%`;
      const where = `u.is_demo=? AND (?='' OR u.status=?) AND (?='' OR EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id=u.id AND r.role=?)) AND (?='' OR lower(u.email) LIKE ? ESCAPE '\\' OR lower(p.first_name||' '||p.last_name) LIKE ? ESCAPE '\\')`;
      const args = [demo ? 1 : 0, status, status, role, role, text, like, like];
      const total = q(`SELECT COUNT(*) n FROM users u JOIN profiles p ON p.user_id=u.id WHERE ${where}`).get(...args).n;
      const rows = q(`SELECT u.id, u.email, u.status, u.created_at, u.last_login_at, p.first_name, p.last_name, (SELECT group_concat(role||':'||verification) FROM user_roles r WHERE r.user_id=u.id) AS roles FROM users u JOIN profiles p ON p.user_id=u.id WHERE ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`).all(...args, limit, offset);
      return { total, rows };
    },
    adminUser(id) {
      const u = q("SELECT u.*, p.first_name, p.last_name FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=?").get(id); if (!u) return null;
      const c = (sql, n = 1) => q(sql).get(...Array(n).fill(id)).n;
      return { ...u, roles: S.roles(id), requests: S.requestsOf(id), counts: { subjects: c("SELECT COUNT(*) n FROM student_subjects WHERE user_id=?"), connections: c("SELECT COUNT(*) n FROM connections WHERE (user_a=? OR user_b=?)".replace("(user_a=? OR user_b=?)", "(user_a=? OR user_b=?)")), sessions: c("SELECT COUNT(*) n FROM study_sessions WHERE user_id=?"), reportsAbout: c("SELECT COUNT(*) n FROM reports WHERE target_id=?"), reportsFiled: c("SELECT COUNT(*) n FROM reports WHERE reporter_id=?") } };
    },
    setUserStatus(id, status) { q("UPDATE users SET status=? WHERE id=?").run(status, id); },
    reportsList: (status) => q(`SELECT r.*, rp.first_name AS rep_first, rp.last_name AS rep_last, ru.email AS rep_email, tp.first_name AS tgt_first, tp.last_name AS tgt_last, tu.email AS tgt_email, tu.status AS tgt_status,
        (SELECT COUNT(*) FROM reports x WHERE x.target_id=r.target_id) AS tgt_total FROM reports r LEFT JOIN users ru ON ru.id=r.reporter_id LEFT JOIN profiles rp ON rp.user_id=r.reporter_id LEFT JOIN users tu ON tu.id=r.target_id LEFT JOIN profiles tp ON tp.user_id=r.target_id
        WHERE (?='ALL' OR (?='OPEN' AND r.status IN ('OPEN','REVIEWING')) OR r.status=?) ORDER BY (r.status IN ('OPEN','REVIEWING')) DESC, r.created_at DESC LIMIT 100`).all(status, status, status),
    reportById: (id) => q("SELECT * FROM reports WHERE id=?").get(id) ?? null,
    setReport(id, status, adminId, note) { q("UPDATE reports SET status=?, resolved_by=?, resolved_at=?, resolution_note=? WHERE id=?").run(status, status === "OPEN" ? null : adminId, status === "OPEN" ? null : now(), note || null, id); },
    contactList: (status) => q("SELECT * FROM contact_messages WHERE (?='ALL' OR status=?) ORDER BY (status='NEW') DESC, created_at DESC LIMIT 100").all(status, status),
    setContactStatus(id, status) { return q("UPDATE contact_messages SET status=? WHERE id=?").run(status, id).changes; },
    auditList(prefix, limit = 200) { return q("SELECT a.id, a.action, a.target, a.meta, a.ip_hash, a.created_at, u.email AS actor_email FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id WHERE (?='' OR a.action LIKE ? ESCAPE '\\') ORDER BY a.created_at DESC, a.rowid DESC LIMIT ?").all(prefix, `${String(prefix).replace(/[\\%_]/g, "\\$&")}%`, limit); },

    /* ───── Catálogo académico ───── */
    universitiesAll: () => q("SELECT u.*, (SELECT COUNT(*) FROM student_profiles sp WHERE sp.university_id=u.id) AS students FROM universities u ORDER BY u.is_demo, u.name").all(),
    subjectsAdmin: (uniId) => q("SELECT s.*, (SELECT COUNT(*) FROM student_subjects ss WHERE ss.subject_id=s.id) AS uses FROM subjects s WHERE s.university_id=? ORDER BY s.name_norm").all(uniId),
    careersAdmin: (uniId) => q("SELECT c.*, (SELECT COUNT(*) FROM student_profiles sp WHERE sp.career_id=c.id) AS uses FROM careers c WHERE c.university_id=? ORDER BY c.name_norm").all(uniId),
    catalogRow(table, id) { return q(`SELECT * FROM ${table === "subjects" ? "subjects" : "careers"} WHERE id=?`).get(id) ?? null; },
    renameCatalog(table, id, name) { const t = table === "subjects" ? "subjects" : "careers"; q(`UPDATE ${t} SET name=?, name_norm=? WHERE id=?`).run(name, normName(name), id); },
    setCatalogActive(table, id, on) { const t = table === "subjects" ? "subjects" : "careers"; q(`UPDATE ${t} SET active=? WHERE id=?`).run(on ? 1 : 0, id); },
    catalogNameTaken(table, uniId, name, exceptId) { const t = table === "subjects" ? "subjects" : "careers"; return !!q(`SELECT 1 FROM ${t} WHERE university_id=? AND name_norm=? AND id<>?`).get(uniId, normName(name), exceptId); },
    /** Fusiona `src` dentro de `dst` (misma universidad): reasigna a todas las personas y objetivos y elimina `src`. */
    mergeSubjects(src, dst) {
      tx(db, () => {
        for (const r of q("SELECT user_id, relation FROM student_subjects WHERE subject_id=?").all(src)) {
          const has = q("SELECT relation FROM student_subjects WHERE user_id=? AND subject_id=?").get(r.user_id, dst);
          if (!has) q("INSERT INTO student_subjects(user_id,subject_id,relation) VALUES(?,?,?)").run(r.user_id, dst, r.relation);
          else if (r.relation === "STRUGGLING" && has.relation !== "STRUGGLING") q("UPDATE student_subjects SET relation='STRUGGLING' WHERE user_id=? AND subject_id=?").run(r.user_id, dst);
        }
        q("UPDATE goals SET subject_id=? WHERE subject_id=?").run(dst, src); q("DELETE FROM subjects WHERE id=?").run(src);
      });
    },
    mergeCareers(src, dst) { tx(db, () => { q("UPDATE student_profiles SET career_id=? WHERE career_id=?").run(dst, src); q("DELETE FROM careers WHERE id=?").run(src); }); },
    addUniversity({ name, slug, domains }) { const id = newId(); q("INSERT INTO universities(id,name,slug,email_domains,active,is_demo) VALUES(?,?,?,?,1,0)").run(id, name, slug, JSON.stringify(domains)); return id; },
    updateUniversity(id, { name, domains, active }) { q("UPDATE universities SET name=?, email_domains=?, active=? WHERE id=?").run(name, JSON.stringify(domains), active ? 1 : 0, id); },
    universityNameTaken: (name, exceptId = "") => !!q("SELECT 1 FROM universities WHERE lower(name)=lower(?) AND id<>?").get(name, exceptId),

    // Sesiones (contrato SessionRepo de apps/web/src/lib/auth/session-service.ts)
    sessionRepo: {
      async create(d) { const id = newId(), t = now(); q("INSERT INTO sessions(id,user_id,token_hash,created_at,last_used_at,expires_at,ip_hash,user_agent) VALUES(?,?,?,?,?,?,?,?)").run(id, d.userId, d.tokenHash, t, t, d.expiresAt.getTime(), d.ipHash ?? null, d.userAgent ?? null); return toSession({ id, user_id: d.userId, token_hash: d.tokenHash, created_at: t, last_used_at: t, expires_at: d.expiresAt.getTime(), revoked_at: null }); },
      async findByTokenHash(h) { const r = q("SELECT * FROM sessions WHERE token_hash=?").get(h); return r ? toSession(r) : null; },
      async touch(id, at) { q("UPDATE sessions SET last_used_at=? WHERE id=?").run(at.getTime(), id); },
      async revoke(id, at) { q("UPDATE sessions SET revoked_at=? WHERE id=?").run(at.getTime(), id); },
      async revokeAllForUser(uid, at) { q("UPDATE sessions SET revoked_at=? WHERE user_id=?").run(at.getTime(), uid); },
    },
  };
  return S;
}
const toSession = (r) => ({ id: r.id, userId: r.user_id, tokenHash: r.token_hash, createdAt: new Date(r.created_at), lastUsedAt: new Date(r.last_used_at), expiresAt: new Date(r.expires_at), revokedAt: r.revoked_at ? new Date(r.revoked_at) : null });
