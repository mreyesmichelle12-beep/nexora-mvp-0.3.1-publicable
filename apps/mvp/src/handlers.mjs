import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { openDb, makeStore } from "./db.mjs";
import { seedDemoWorld, seedRealCatalog, createDemoVisitor } from "./demo.mjs";
import { getMatches } from "./smart.mjs";
import * as V from "./views.mjs";
import { html, str } from "./html.mjs";
import { validateRegister, validateProfile, validateSubject, parseSlots, clean } from "./validate.mjs";
import { LIMITS, POLICY_VERSION } from "./constants.mjs";
import { APP_ROOT } from "./config.mjs";
import { KINDS, addDays, computeStreak, dayKey, isDayKey, longDate, monthGrid, parseLocal, startOfDayMs, timeLabel, weekDays, weekMinutes } from "./calendar.mjs";
import { decideRequest, relationView, cleanMessage, FLASH, REPORT_REASONS } from "./social.mjs";
import { can } from "../../web/src/lib/auth/permissions.ts";
import { createSession, validateSession, revokeSession, revokeAllSessions } from "../../web/src/lib/auth/session-service.ts";
import { SESSION_IDLE_MS, sessionCookieName } from "../../web/src/lib/auth/cookies.ts";
import { hashForLog } from "../../web/src/lib/security/tokens.ts";
import { MemoryStore, RULES, rateLimit } from "../../web/src/lib/security/rate-limit.ts";
import { isSameOriginRequest } from "../../web/src/lib/security/csrf.ts";
import { hashPassword, verifyPassword, dummyHash } from "../../web/src/lib/security/password-scrypt.ts";
import { validateContact } from "../../web/src/lib/contact-validation.ts";
import { buildStaticCsp, STATIC_SECURITY_HEADERS } from "../../web/src/lib/security/csp.ts";

const PLACEHOLDER = "https://nexora-app-url.placeholder";
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8" };
const ERRORS_EXTRA = { "sesion-invalida": "Indica una duración válida (de 1 a 180 minutos).", "objetivo-invalido": "Revisa el objetivo (título de 2 a 120 caracteres).", "evento-invalido": "Revisa el evento: título, fecha y horas (la hora de fin debe ser posterior a la de inicio).", "limite-alcanzado": "Alcanzaste el límite permitido." };
  const AVISOS = { "objetivo-agregado": "Objetivo agregado.", "objetivo-actualizado": "Objetivo actualizado.", "objetivo-eliminado": "Objetivo eliminado.", "sesion-guardada": "Sesión de estudio guardada.", "evento-agregado": "Evento agregado.", "evento-eliminado": "Evento eliminado.", "preferencia-guardada": "Preferencia guardada.", guardado: "Cambios guardados.", agregada: "Materia agregada.", quitada: "Materia quitada.", "cuenta-eliminada": "Tu cuenta y tus datos fueron eliminados." };
const RULE = { demo: { name: "demo", limit: 10, windowMs: 3600_000 }, subject: { name: "subject", limit: 40, windowMs: 3600_000 }, profile: { name: "profile", limit: 60, windowMs: 3600_000 } };

export function createApp(config) {
  const S = makeStore(openDb(config.dbFile));
  seedRealCatalog(S); seedDemoWorld(S);
  const purge = () => { try { S.purgeOldDemoUsers(24 * 3600_000); } catch (e) { console.error("purge demo:", e.message); } };
  purge(); const purgeTimer = setInterval(purge, 3600_000); purgeTimer.unref();

  const limiter = new MemoryStore(); // un solo proceso; con varias instancias se usaría Redis (ver docs)
  const shell = V.makeShell(config.publicDir);

  /* ───── Archivos estáticos (el HTML/XML/TXT se carga en memoria con la URL real del sitio) ───── */
  const textFiles = new Map();
  (function load(dir, base = "") {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f), rel = `${base}/${f}`;
      if (statSync(p).isDirectory()) { if (f !== "_shell") load(p, rel); }
      else if ([".html", ".xml", ".txt"].includes(extname(f))) {
        const body = readFileSync(p, "utf8").replaceAll(PLACEHOLDER, config.appUrl);
        textFiles.set(f === "index.html" ? (base || "/") : rel, { body, type: MIME[extname(f)] });
      }
    }
  })(config.publicDir);

  const csp = (secure) => buildStaticCsp({ isDev: !secure });
  const secure = (req) => config.secureCookies || (config.trustProxy && req.headers["x-forwarded-proto"] === "https");
  const baseHeaders = (req) => {
    const h = { "Content-Security-Policy": csp(secure(req)) };
    for (const { key, value } of STATIC_SECURITY_HEADERS) if (key !== "Strict-Transport-Security" || secure(req)) h[key] = value;
    h["Permissions-Policy"] = "camera=(), microphone=(), display-capture=(), geolocation=(), payment=()"; // se habilitarán con Study Rooms
    return h;
  };
  const send = (req, res, status, body, extra = {}) => { res.writeHead(status, { ...baseHeaders(req), ...extra }); res.end(req.method === "HEAD" ? undefined : body); };
  const page = (req, res, status, doc, extra = {}) => send(req, res, status, typeof doc === "string" ? doc : str(doc), { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...extra });
  const redirect = (req, res, to, extra = {}) => send(req, res, 303, "", { Location: to, "Cache-Control": "no-store", ...extra });
  const jsonOut = (req, res, status, obj) => send(req, res, status, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });

  function serveStatic(req, res, pathname) {
    const key = pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
    const t = textFiles.get(key);
    if (t) return send(req, res, 200, t.body, { "Content-Type": t.type, "Cache-Control": "no-cache" });
    let decoded; try { decoded = decodeURIComponent(pathname); } catch { return false; }
    if (decoded.includes("\0")) return false;
    const file = normalize(join(config.publicDir, decoded));
    if (!file.startsWith(config.publicDir + sep) || decoded.startsWith("/_shell")) return false;
    if (!existsSync(file) || !statSync(file).isFile() || !MIME[extname(file)]) return false;
    res.writeHead(200, { ...baseHeaders(req), "Content-Type": MIME[extname(file)], "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "public, max-age=86400" });
    if (req.method === "HEAD") return res.end(), true;
    createReadStream(file).pipe(res); return true;
  }

  /* ───── Utilidades de petición ───── */
  const cookieOf = (req, name) => (req.headers.cookie ?? "").split(/;\s*/).map((p) => p.split(/=(.*)/s)).find(([k]) => k === name)?.[1];
  const ipOf = (req) => (config.trustProxy ? req.headers["x-forwarded-for"]?.split(",")[0]?.trim() : null) || req.socket.remoteAddress || "desconocida";
  const sessCookie = (req, token, maxAgeS) => `${sessionCookieName(secure(req))}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeS}${secure(req) ? "; Secure" : ""}`;
  const readBody = (req) => new Promise((resolve, reject) => {
    let size = 0, over = false; const chunks = [];
    req.on("data", (c) => { if (over) return; size += c.length; if (size > 65536) { over = true; chunks.length = 0; reject(Object.assign(new Error("payload demasiado grande"), { status: 413 })); } else chunks.push(c); }); // se descarta el resto y se responde 413
    req.on("end", () => {
      if (over) return;
      const raw = Buffer.concat(chunks).toString("utf8"), out = {};
      for (const [k, v] of new URLSearchParams(raw)) out[k] = k in out ? [].concat(out[k], v) : v;
      resolve(out);
    });
    req.on("error", reject);
  });
  async function auth(req) {
    const token = cookieOf(req, sessionCookieName(secure(req)));
    const chk = await validateSession(S.sessionRepo, token);
    if (!chk.ok) return null;
    const bundle = S.bundle(chk.session.userId);
    if (!bundle || bundle.user.status !== "ACTIVE" || !bundle.profile || !bundle.student) return null;
    const actor = { id: bundle.user.id, status: bundle.user.status, isDemo: !!bundle.user.is_demo, roles: S.roles(bundle.user.id).map((r) => ({ role: r.role, verification: r.verification })) };
    return { bundle, actor, session: chk.session };
  }
  const startSession = async (req, userId, ipHash) => {
    const { token } = await createSession(S.sessionRepo, userId, { ipHash, userAgent: req.headers["user-agent"] });
    return sessCookie(req, token, Math.floor(SESSION_IDLE_MS / 1000));
  };
  const limited = async (rule, subject) => { const r = await rateLimit(limiter, rule, subject); return r.allowed ? null : r; };
  const waitMsg = (r) => `Demasiados intentos. Inténtalo de nuevo en unos ${Math.max(1, Math.ceil(r.retryAfterSeconds / 60))} minuto(s).`;
  const flashOf = (url) => {
    const ok = url.searchParams.get("aviso"), err = url.searchParams.get("error");
    if (ok && (AVISOS[ok] || FLASH.ok[ok])) return { kind: "ok", text: AVISOS[ok] ?? FLASH.ok[ok] };
    if (err && (FLASH.error[err] || ERRORS_EXTRA[err])) return { kind: "error", text: FLASH.error[err] ?? ERRORS_EXTRA[err] };
    return null;
  };
  const NEXT_OK = ["/app/conexiones", "/app/smart-match", "/app/mensajes"];
  const nextOf = (b) => (NEXT_OK.includes(b.next) ? b.next : "/app/conexiones");
  const goBack = (req, res, next, kind, code) => redirect(req, res, `${next}?${kind === "ok" ? "aviso" : "error"}=${encodeURIComponent(code)}`);
  const ID = /^[A-Za-z0-9-]{1,64}$/;

  /* ───── Manejador principal ───── */
  async function handle(req, res) {
    const t0 = Date.now();
    const url = new URL(req.url, "http://x");
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : "/";
    const method = req.method === "HEAD" ? "GET" : req.method;
    const ipHash = hashForLog(ipOf(req), config.pepper);
    res.on("finish", () => { if (!/^\/(assets|brand|team|impact)\//.test(path)) console.log(`${req.method} ${path} ${res.statusCode} ${Date.now() - t0}ms`); });

    try {
      if (path === "/salud") return jsonOut(req, res, 200, { status: "ok", version: config.version });
      if (path === "/app-assets/timer.js" && method === "GET") return send(req, res, 200, readFileSync(join(APP_ROOT, "static/timer.js")), { "Content-Type": MIME[".js"], "Cache-Control": "no-cache" });

      // CSRF: en peticiones que cambian estado, el Origin/Referer debe ser este mismo sitio (además de cookies SameSite=Lax)
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        const host = req.headers.host ?? "";
        const origins = [config.appUrl, `${secure(req) ? "https" : "http"}://${host}`];
        if (!isSameOriginRequest(req.method, { get: (n) => req.headers[n.toLowerCase()] ?? null }, origins)) return page(req, res, 403, shell.serverError().replace("Algo salió mal de nuestro lado", "Solicitud rechazada").replace("No pudimos cargar esta página.", "No pudimos verificar el origen de la solicitud."));
      }

      /* —— Páginas públicas con formularios —— */
      if (path === "/iniciar-sesion" && method === "GET") { if (await auth(req)) return redirect(req, res, "/app"); const a = url.searchParams.get("aviso"); return page(req, res, 200, shell.page("/iniciar-sesion", "Iniciar sesión", V.loginPage({ notice: AVISOS[a] }))); }
      if (path === "/iniciar-sesion" && method === "POST") {
        const b = await readBody(req), email = clean(b.email, 254).toLowerCase(), pw = String(b.password ?? "");
        const rl = (await limited(RULES.loginIp, ipHash)) || (await limited(RULES.login, `${email}|${ipHash}`));
        if (rl) return page(req, res, 429, shell.page("/iniciar-sesion", "Iniciar sesión", V.loginPage({ email, error: waitMsg(rl) })), { "Retry-After": String(rl.retryAfterSeconds) });
        const user = email ? S.userByEmail(email) : null;
        const ok = await verifyPassword(user?.password_hash ?? (await dummyHash()), pw);
        if (!user || !user.password_hash || !ok || user.status !== "ACTIVE") { S.audit(null, "auth.login_failed", null, null, ipHash); return page(req, res, 401, shell.page("/iniciar-sesion", "Iniciar sesión", V.loginPage({ email, error: "Correo o contraseña incorrectos." }))); }
        S.db.prepare("UPDATE users SET last_login_at=? WHERE id=?").run(Date.now(), user.id);
        S.audit(user.id, "auth.login", null, null, ipHash);
        return redirect(req, res, "/app", { "Set-Cookie": await startSession(req, user.id, ipHash) });
      }
      if (path === "/registro" && method === "GET") { if (await auth(req)) return redirect(req, res, "/app"); const u = S.universities(); return page(req, res, 200, shell.page("/registro", "Crear cuenta", V.registerPage({ universities: u, careers: u[0] ? S.careerNames(u[0].id) : [] }))); }
      if (path === "/registro" && method === "POST") {
        const b = await readBody(req), universities = S.universities();
        const render = (status, o) => page(req, res, status, shell.page("/registro", "Crear cuenta", V.registerPage({ universities, careers: universities[0] ? S.careerNames(universities[0].id) : [], ...o })));
        const rl = await limited(RULES.register, ipHash); if (rl) return render(429, { values: {}, error: waitMsg(rl) });
        const v = validateRegister(b, { universityIds: universities.map((u) => u.id) });
        if (v.ok && S.userByEmail(v.values.email)) { v.ok = false; v.errors.email = "Ya existe una cuenta con ese correo. Inicia sesión."; }
        if (!v.ok) return render(400, { values: v.values, errors: v.errors });
        const uid = S.createStudent({ email: v.values.email, passwordHash: await hashPassword(v.password), firstName: v.values.firstName, lastName: v.values.lastName, uniId: v.values.uniId, careerName: v.values.careerName, cycle: v.values.cycle, modality: v.values.modality });
        S.recordConsent(uid, "TERMS", true, POLICY_VERSION); S.recordConsent(uid, "PRIVACY", true, POLICY_VERSION);
        S.audit(uid, "auth.register", null, null, ipHash);
        return redirect(req, res, "/app", { "Set-Cookie": await startSession(req, uid, ipHash) });
      }
      if (path === "/demo" && method === "GET") return page(req, res, 200, shell.page("/demo", "Probar demo", V.demoPage({ enabled: config.demoEnabled })));
      if (path === "/demo" && method === "POST") {
        if (!config.demoEnabled) return page(req, res, 403, shell.page("/demo", "Probar demo", V.demoPage({ enabled: false })));
        const rl = await limited(RULE.demo, ipHash); if (rl) return page(req, res, 429, shell.page("/demo", "Probar demo", V.demoPage({ enabled: true, error: waitMsg(rl) })));
        const uid = createDemoVisitor(S); S.audit(uid, "demo.start", null, null, ipHash);
        return redirect(req, res, "/app", { "Set-Cookie": await startSession(req, uid, ipHash) });
      }
      if (path === "/salir" && method === "POST") {
        const a = await auth(req);
        if (a) { await revokeSession(S.sessionRepo, a.session.id); S.audit(a.bundle.user.id, "auth.logout", null, null, ipHash); if (a.bundle.user.is_demo && !a.bundle.user.demo_seed) S.deleteUser(a.bundle.user.id); }
        return redirect(req, res, "/", { "Set-Cookie": sessCookie(req, "", 0) });
      }
      if (path === "/api/contact" && method === "POST") {
        const b = await readBody(req), v = validateContact(b);
        if (!v.ok) return v.spam ? jsonOut(req, res, 200, { status: "success", message: "Recibimos tu mensaje. Quedó registrado y el equipo de NEXORA lo revisará." }) : jsonOut(req, res, 400, { status: "error", message: "Revisa los campos marcados y vuelve a enviar.", errors: v.errors, values: v.values });
        const rl = await limited(RULES.contact, ipHash); if (rl) return jsonOut(req, res, 429, { status: "error", message: `Enviaste varios mensajes seguidos. Inténtalo de nuevo en unos ${Math.max(1, Math.ceil(rl.retryAfterSeconds / 60))} minuto(s).`, values: v.values ?? undefined });
        S.saveContact({ ...v.data, ipHash });
        return jsonOut(req, res, 200, { status: "success", message: "Recibimos tu mensaje. Quedó registrado y el equipo de NEXORA lo revisará." });
      }

      /* —— Aplicación (requiere sesión y permiso) —— */
      if (path === "/app" || path.startsWith("/app/")) {
        const a = await auth(req);
        if (!a || !can(a.actor, "social:use")) return redirect(req, res, "/iniciar-sesion");
        const { bundle } = a, uid = bundle.user.id;
        const counts = () => ({ requests: S.pendingIncoming(uid), messages: S.unreadTotal(uid) });
        const layout = (title, active, body, flash) => V.appLayout({ title, bundle, active, body, flash, counts: counts() });
        const decorate = (ms) => { const cm = S.connectionMap(uid); return ms.map((m) => ({ ...m, rel: relationView(cm.get(m.id), uid) })); };

        const todayKey = dayKey(Date.now());
        const sumWeek = (byDay) => weekMinutes(byDay, todayKey).reduce((n, d) => n + d.minutes, 0);
        const snapshot = () => { const byDay = S.studyDays(uid), ev = S.nextEvent(uid); return { streak: bundle.profile.show_streak ? computeStreak(new Set(byDay.keys()), todayKey) : null, weekMin: sumWeek(byDay), next: ev ? { title: ev.title, key: dayKey(ev.starts_at), when: `${longDate(dayKey(ev.starts_at))}, ${timeLabel(ev.starts_at)}` } : null }; };
        const accepts = () => String(req.headers.accept ?? "").includes("application/json");

        if (path === "/app" && method === "GET") { const matches = decorate(getMatches(S, bundle)), names = S.subjectNameMap(bundle.student.university_id); return page(req, res, 200, layout("Inicio", "/app", V.dashboardBody({ bundle, matches, names, counts: counts(), snap: snapshot() }), flashOf(url))); }
        if (path === "/app/smart-match" && method === "GET") { const matches = decorate(getMatches(S, bundle)), names = S.subjectNameMap(bundle.student.university_id); return page(req, res, 200, layout("Smart Match", "/app/smart-match", V.smartMatchBody({ bundle, matches, names }), flashOf(url))); }

        if (path === "/app/materias") {
          const suggestions = () => S.subjectNames(bundle.student.university_id);
          if (method === "GET") return page(req, res, 200, layout("Materias", "/app/materias", V.materiasBody({ bundle, suggestions: suggestions() }), flashOf(url)));
          if (method === "POST") {
            const b = await readBody(req);
            if (b.action === "add") {
              const v = validateSubject(b), rerender = (error) => page(req, res, 400, layout("Materias", "/app/materias", V.materiasBody({ bundle, suggestions: suggestions(), error, values: { name: clean(b.name, 80), relation: b.relation } })));
              if (!v.ok) return rerender(v.error);
              const rl = await limited(RULE.subject, uid); if (rl) return rerender(waitMsg(rl));
              const id = S.findOrCreateSubject(bundle.student.university_id, v.name, { demo: bundle.user.is_demo ? 1 : 0 });
              if (!S.hasSubject(uid, id) && S.subjectCount(uid) >= LIMITS.subjectsPerUser) return rerender(`Puedes tener hasta ${LIMITS.subjectsPerUser} materias.`);
              S.setSubject(uid, id, v.relation); return redirect(req, res, "/app/materias?aviso=agregada");
            }
            const sid = clean(b.subject_id, 64);
            if (S.hasSubject(uid, sid)) { // sólo se puede tocar lo propio
              if (b.action === "remove") { S.removeSubject(uid, sid); return redirect(req, res, "/app/materias?aviso=quitada"); }
              if (b.action === "struggling" || b.action === "enrolled") { S.setSubject(uid, sid, b.action === "struggling" ? "STRUGGLING" : "ENROLLED"); return redirect(req, res, "/app/materias?aviso=guardado"); }
            }
            return redirect(req, res, "/app/materias");
          }
        }
        if (path === "/app/horarios") {
          if (method === "GET") return page(req, res, 200, layout("Horarios", "/app/horarios", V.horariosBody({ bundle }), flashOf(url)));
          if (method === "POST") { S.replaceSlots(uid, parseSlots((await readBody(req)).slot)); return redirect(req, res, "/app/horarios?aviso=guardado"); }
        }
        if (path === "/app/perfil") {
          if (method === "GET") return page(req, res, 200, layout("Perfil", "/app/perfil", V.perfilBody({ bundle }), flashOf(url)));
          if (method === "POST") {
            const v = validateProfile(await readBody(req));
            if (!v.ok) return page(req, res, 400, layout("Perfil", "/app/perfil", V.perfilBody({ bundle, errors: v.errors, values: v.values })));
            const rl = await limited(RULE.profile, uid); if (rl) return page(req, res, 429, layout("Perfil", "/app/perfil", V.perfilBody({ bundle, values: v.values }), { kind: "error", text: waitMsg(rl) }));
            S.updateProfile(uid, { ...v.values, uniId: bundle.student.university_id, demo: bundle.user.is_demo ? 1 : 0 });
            return redirect(req, res, "/app/perfil?aviso=guardado");
          }
        }
        if (path === "/app/perfil/exportar" && method === "GET" && !bundle.user.is_demo) {
          const names = S.subjectNameMap(bundle.student.university_id);
          const data = { exportado_en: new Date().toISOString(), version: config.version, cuenta: { correo: bundle.user.email, creada_en: new Date(bundle.user.created_at).toISOString(), correo_verificado: !!bundle.user.email_verified_at }, perfil: { nombre: bundle.profile.first_name, apellido: bundle.profile.last_name, biografia: bundle.profile.bio, modalidad: bundle.profile.modality, intereses: bundle.profile.interests, preferencias_de_estudio: bundle.profile.study_styles, visible_en_smart_match: !!bundle.profile.discoverable }, academico: { universidad: bundle.student.university, carrera: bundle.student.career, ciclo: bundle.student.cycle, materias: bundle.subjects.map((s) => ({ nombre: names.get(s.id) ?? s.name, relacion: s.relation })), horarios_disponibles: bundle.slots },
            progreso: { objetivos: S.goalsOf(uid).map((g) => ({ titulo: g.title, materia: g.subject, fecha_objetivo: g.target_date, estado: g.status })), sesiones_de_estudio: S.recentSessions(uid, 1000).map((r) => ({ minutos: r.focus_minutes, terminada_en: new Date(r.ended_at).toISOString(), origen: r.source })) },
            calendario: S.eventsBetween(uid, 0, 8.64e15).map((e) => ({ titulo: e.title, tipo: e.kind, inicio: new Date(e.starts_at).toISOString(), fin: new Date(e.ends_at).toISOString() })),
            conexiones: S.connectionsOf(uid).map((c) => ({ con: `${c.first_name} ${c.last_name}`, estado: c.status, iniciada_por_mi: c.requester_id === uid })),
            mensajes_enviados: S.db.prepare("SELECT m.body, m.created_at FROM messages m WHERE m.sender_id=? ORDER BY m.created_at").all(uid).map((m) => ({ texto: m.body, enviado_en: new Date(m.created_at).toISOString() })) };
          S.audit(uid, "privacy.export", null, null, ipHash);
          return send(req, res, 200, JSON.stringify(data, null, 2), { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="mis-datos-nexora.json"', "Cache-Control": "no-store" });
        }
        if (path === "/app/perfil/eliminar" && method === "POST" && !bundle.user.is_demo) {
          const pw = String((await readBody(req)).password ?? "");
          const rl = await limited(RULES.login, `del|${uid}`); if (rl) return page(req, res, 429, layout("Perfil", "/app/perfil", V.perfilBody({ bundle }), { kind: "error", text: waitMsg(rl) }));
          if (!(await verifyPassword(bundle.user.password_hash ?? (await dummyHash()), pw))) return page(req, res, 400, layout("Perfil", "/app/perfil", V.perfilBody({ bundle }), { kind: "error", text: "La contraseña no coincide. No se eliminó nada." }));
          await revokeAllSessions(S.sessionRepo, uid); S.audit(uid, "privacy.delete_account", null, null, ipHash); S.deleteUser(uid);
          return redirect(req, res, "/iniciar-sesion?aviso=cuenta-eliminada", { "Set-Cookie": sessCookie(req, "", 0) });
        }


        /* ───── Progreso, temporizador y calendario ───── */
        if (path === "/app/progreso" && method === "GET") {
          const byDay = S.studyDays(uid), week = weekMinutes(byDay, todayKey).map((d) => ({ ...d, today: d.key === todayKey }));
          return page(req, res, 200, layout("Progreso", "/app/progreso", V.progresoBody({ bundle, week, streak: computeStreak(new Set(byDay.keys()), todayKey), totals: S.sessionTotals(uid), weekTotal: sumWeek(byDay), goals: S.goalsOf(uid), recent: S.recentSessions(uid, 15), subjects: bundle.subjects }), flashOf(url)));
        }
        if (path === "/app/progreso" && method === "POST") {
          const b = await readBody(req), action = clean(b.action, 16), id = clean(b.id, 64), to = (kind, code) => redirect(req, res, `/app/progreso?${kind === "ok" ? "aviso" : "error"}=${code}`);
          if (action === "goal_add") {
            const title = clean(b.title, 120), subjectId = clean(b.subject_id, 64), date = clean(b.target_date, 10);
            if (title.length < 2) return to("error", "objetivo-invalido");
            if (S.goalCount(uid) >= 50) return to("error", "limite-alcanzado");
            S.addGoal(uid, { title, subjectId: subjectId && S.hasSubject(uid, subjectId) ? subjectId : null, targetDate: isDayKey(date) ? date : null }); return to("ok", "objetivo-agregado");
          }
          if (action === "goal_done" || action === "goal_reopen") { S.setGoalStatus(uid, id, action === "goal_done" ? "DONE" : "ACTIVE"); return to("ok", "objetivo-actualizado"); }
          if (action === "goal_delete") { S.deleteGoal(uid, id); return to("ok", "objetivo-eliminado"); }
          if (action === "streak_toggle") { S.setShowStreak(uid, b.show_streak === "on"); return to("ok", "preferencia-guardada"); }
          return to("error", "objetivo-invalido");
        }
        if (path === "/app/progreso/sesiones" && method === "POST") {
          const b = await readBody(req), minutes = Number(b.minutes), goalId = clean(b.goal_id, 64), fail = (status, error, code) => (accepts() ? jsonOut(req, res, status, { ok: false, error }) : redirect(req, res, `/app/progreso?error=${code}`));
          if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) return fail(400, ERRORS_EXTRA["sesion-invalida"], "sesion-invalida");
          if (goalId && !S.goalOwned(uid, goalId)) return fail(400, "Objetivo no válido.", "objetivo-invalido");
          if (S.sessionsLastHour(uid) >= 20) return fail(429, "Demasiadas sesiones registradas en la última hora.", "demasiados");
          S.addSession(uid, minutes, { goalId: goalId || null, source: String(req.headers.accept ?? "").includes("json") ? "timer" : "manual" });
          return accepts() ? jsonOut(req, res, 200, { ok: true, minutes }) : redirect(req, res, "/app/progreso?aviso=sesion-guardada");
        }

        if (path === "/app/calendario") {
          if (method === "GET") {
            const view = ["mes", "semana", "dia"].includes(url.searchParams.get("vista")) ? url.searchParams.get("vista") : "mes";
            const k = url.searchParams.get("fecha"), key = isDayKey(k) ? k : todayKey;
            const days = view === "mes" ? monthGrid(key).flat() : view === "semana" ? weekDays(key) : [key];
            const from = days[0], to = days[days.length - 1], byDay = new Map(), add = (e) => { if (!byDay.has(e.key)) byDay.set(e.key, []); byDay.get(e.key).push(e); };
            for (const ev of S.eventsBetween(uid, startOfDayMs(from), startOfDayMs(addDays(to, 1)))) add({ key: dayKey(ev.starts_at), ms: ev.starts_at, kind: "event", id: ev.id, title: ev.title, time: `${timeLabel(ev.starts_at)}–${timeLabel(ev.ends_at)}`, sub: KINDS[ev.kind] });
            for (const g of S.goalsDueBetween(uid, from, to)) add({ key: g.target_date, ms: startOfDayMs(g.target_date) + 43_200_000, kind: "goal", title: `Objetivo: ${g.title}`, sub: g.status === "DONE" ? "Cumplido" : "Fecha límite", done: g.status === "DONE" });
            for (const [dk, min] of S.studyDays(uid)) if (dk >= from && dk <= to) add({ key: dk, ms: startOfDayMs(dk) + 86_399_000, kind: "session", title: `Estudiaste ${min} min`, sub: "Sesiones registradas" });
            for (const l of byDay.values()) l.sort((a, b) => a.ms - b.ms);
            return page(req, res, 200, layout("Calendario", "/app/calendario", V.calendarioBody({ view, key, todayKey, byDay }), flashOf(url)));
          }
          if (method === "POST") {
            const b = await readBody(req), view = ["mes", "semana", "dia"].includes(b.vista) ? b.vista : "mes", fecha = isDayKey(b.fecha) ? b.fecha : todayKey;
            const back = (kind, code) => redirect(req, res, `/app/calendario?vista=${view}&fecha=${fecha}&${kind === "ok" ? "aviso" : "error"}=${code}`);
            if (b.action === "event_delete") { S.deleteEvent(uid, clean(b.id, 64)); return back("ok", "evento-eliminado"); }
            if (b.action === "event_add") {
              const title = clean(b.title, 80), kind = clean(b.kind, 8), date = clean(b.date, 10), starts = parseLocal(date, clean(b.start, 5));
              const ends = clean(b.end, 5) ? parseLocal(date, clean(b.end, 5)) : starts === null ? null : starts + 3_600_000;
              if (title.length < 2 || !(kind in KINDS) || starts === null || ends === null || ends <= starts || ends - starts > 86_400_000) return back("error", "evento-invalido");
              if (S.eventCount(uid) >= 300) return back("error", "limite-alcanzado");
              S.addEvent(uid, { title, kind, startsAt: starts, endsAt: ends }); return back("ok", "evento-agregado");
            }
            return back("error", "evento-invalido");
          }
        }

        /* ───── Conexiones ───── */
        if (path === "/app/conexiones" && method === "GET") return page(req, res, 200, layout("Conexiones", "/app/conexiones", V.conexionesBody({ rows: S.connectionsOf(uid), blocked: S.blockedList(uid), me: uid }), flashOf(url)));
        if (path === "/app/conexiones" && method === "POST") {
          const b = await readBody(req), next = nextOf(b), action = clean(b.action, 12), otherId = clean(b.user_id, 64);
          if (!ID.test(otherId) || otherId === uid) return goBack(req, res, next, "error", otherId === uid ? "self" : "no-encontrada");
          const other = S.userCard(otherId);
          if (!other || other.status !== "ACTIVE" || other.is_demo !== bundle.user.is_demo) return goBack(req, res, next, "error", "no-encontrada"); // nunca se cruza demo con real
          const existing = S.connectionBetween(uid, otherId);
          if (action === "request") {
            const rl = await limited(RULES.connectionRequest, uid); if (rl) return goBack(req, res, next, "error", "demasiados");
            if (!existing && (other.university_id !== bundle.student.university_id || !S.db.prepare("SELECT discoverable FROM profiles WHERE user_id=?").get(otherId)?.discoverable)) return goBack(req, res, next, "error", "no-encontrada");
            const d = decideRequest({ existing, me: uid, other: otherId, blocked: S.isBlocked(uid, otherId) });
            if (!d.ok) return goBack(req, res, next, "error", d.code);
            if (d.action === "create") S.createConnection(uid, otherId);
            else if (d.action === "accept") S.setConnection(existing.id, "ACCEPTED");
            else S.setConnection(existing.id, "PENDING", uid); // reabrir tras el plazo: ahora la inicio yo
            S.audit(uid, `connection.${d.action}`, otherId, null, ipHash);
            return goBack(req, res, next, "ok", d.action === "accept" ? "solicitud-aceptada" : "solicitud-enviada");
          }
          if ((action === "accept" || action === "decline") && existing?.status === "PENDING" && existing.requester_id !== uid && !S.isBlocked(uid, otherId)) {
            S.setConnection(existing.id, action === "accept" ? "ACCEPTED" : "DECLINED"); S.audit(uid, `connection.${action}`, otherId, null, ipHash);
            return goBack(req, res, next, "ok", action === "accept" ? "solicitud-aceptada" : "solicitud-rechazada");
          }
          if (action === "cancel" && existing?.status === "PENDING" && existing.requester_id === uid) { S.deleteConnection(uid, otherId); return goBack(req, res, next, "ok", "solicitud-cancelada"); }
          if (action === "remove" && existing?.status === "ACCEPTED") { S.deleteConnection(uid, otherId); S.deleteConversation(uid, otherId); S.audit(uid, "connection.remove", otherId, null, ipHash); return goBack(req, res, next, "ok", "conexion-eliminada"); }
          if (action === "block") { S.block(uid, otherId); S.audit(uid, "block.add", otherId, null, ipHash); return goBack(req, res, next, "ok", "bloqueado"); }
          if (action === "unblock") { S.unblock(uid, otherId); S.audit(uid, "block.remove", otherId, null, ipHash); return goBack(req, res, next, "ok", "desbloqueado"); }
          return goBack(req, res, next, "error", "no-encontrada");
        }
        if (path === "/app/reportar" && method === "POST") {
          const b = await readBody(req), next = nextOf(b), targetId = clean(b.user_id, 64), reason = clean(b.reason, 20), details = clean(b.details, 500);
          const target = ID.test(targetId) ? S.userCard(targetId) : null;
          if (!target || targetId === uid || target.is_demo !== bundle.user.is_demo) return goBack(req, res, next, "error", "no-encontrada");
          if (!(reason in REPORT_REASONS)) return goBack(req, res, next, "error", "reporte-invalido");
          const rl = await limited(RULES.report, uid); if (rl) return goBack(req, res, next, "error", "demasiados");
          S.report(uid, "USER", targetId, reason, details); S.audit(uid, "report.user", targetId, { reason }, ipHash);
          return goBack(req, res, next, "ok", "reporte-enviado");
        }

        /* ───── Mensajes: sólo entre conexiones aceptadas, sin bloqueo, y sólo los dos participantes ───── */
        const openThread = (convId) => {
          const cv = ID.test(convId) ? S.conversation(convId) : null;
          if (!cv || (cv.user_a !== uid && cv.user_b !== uid)) return null; // no se revela si existe
          const otherId = cv.user_a === uid ? cv.user_b : cv.user_a, conn = S.connectionBetween(uid, otherId), card = S.userCard(otherId);
          if (!conn || conn.status !== "ACCEPTED" || S.isBlocked(uid, otherId) || !card || card.status !== "ACTIVE") return null;
          return { cv, otherId, card };
        };
        const renderThread = (status, t, error) => {
          S.markRead(t.cv.id, uid);
          const active = { id: t.cv.id, other_id: t.otherId, first_name: t.card.first_name, last_name: t.card.last_name, is_demo: t.card.is_demo };
          return page(req, res, status, layout("Mensajes", "/app/mensajes", V.mensajesBody({ inbox: S.inbox(uid), active, messages: S.messagesOf(t.cv.id), me: uid, otherRead: S.lastRead(t.cv.id, t.otherId), error }), null));
        };
        if (path === "/app/mensajes" && method === "GET") return page(req, res, 200, layout("Mensajes", "/app/mensajes", V.mensajesBody({ inbox: S.inbox(uid), me: uid }), flashOf(url)));
        let mm;
        if ((mm = path.match(/^\/app\/mensajes\/con\/([A-Za-z0-9-]{1,64})$/)) && method === "GET") {
          const otherId = mm[1], conn = S.connectionBetween(uid, otherId), card = S.userCard(otherId);
          if (!conn || conn.status !== "ACCEPTED" || S.isBlocked(uid, otherId) || !card || card.status !== "ACTIVE" || card.is_demo !== bundle.user.is_demo) return goBack(req, res, "/app/conexiones", "error", "no-conectados");
          return redirect(req, res, `/app/mensajes/${S.conversationFor(uid, otherId)}`);
        }
        if ((mm = path.match(/^\/app\/mensajes\/([A-Za-z0-9-]{1,64})$/))) {
          const t = openThread(mm[1]); if (!t) return page(req, res, 404, shell.notFound());
          if (method === "GET") return renderThread(200, t);
          if (method === "POST") {
            const b = await readBody(req), m = cleanMessage(b.body);
            const rl = await limited(RULES.message, uid); if (rl) return renderThread(429, t, `Estás enviando mensajes muy rápido. Espera ${rl.retryAfterSeconds} s.`);
            if (!m.ok) return renderThread(400, t, m.error);
            if (S.recentDuplicates(t.cv.id, uid, m.body, Date.now() - 60_000) >= 3) return renderThread(429, t, "No repitas el mismo mensaje una y otra vez.");
            S.addMessage(t.cv.id, uid, m.body); S.markRead(t.cv.id, uid);
            return redirect(req, res, `/app/mensajes/${t.cv.id}`);
          }
        }
        return page(req, res, 404, shell.notFound());
      }

      /* —— Sitio público estático —— */
      if (method === "GET" && serveStatic(req, res, url.pathname) !== false) return;
      return page(req, res, 404, shell.notFound());
    } catch (e) {
      console.error(`error ${req.method} ${path}:`, e.status ?? "", e.message); // sin cuerpo de la petición ni datos personales
      if (res.headersSent) return res.end();
      return page(req, res, e.status === 413 ? 413 : 500, shell.serverError(), e.status === 413 ? { Connection: "close" } : {});
    }
  }
  return { handle, S, close: () => { clearInterval(purgeTimer); S.db.close(); } };
}
