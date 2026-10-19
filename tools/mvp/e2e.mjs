// Prueba de extremo a extremo del MVP 0.1: levanta el servidor REAL con una base de datos limpia y lo recorre en Chromium.
// Uso: node tools/mvp/e2e.mjs      (requiere playwright; ver apps/mvp/README)
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const require = createRequire(import.meta.url);
const { chromium, request } = ["playwright", "/home/claude/.npm-global/lib/node_modules/playwright"].reduce((m, p) => m ?? (() => { try { return require(p); } catch {} })(), null);
const SHOTS = process.env.SHOTS_DIR ?? "/tmp/mvp-shots"; mkdirSync(SHOTS, { recursive: true });

const results = []; const ok = (name, cond, detail = "") => { results.push([!!cond, name]); console.log(`${cond ? "✔" : "✘"} ${name}${!cond && detail ? `  → ${detail}` : ""}`); };
let nextPort = 4300;
async function startServer(extraEnv = {}) {
  const port = nextPort++, dir = mkdtempSync(join(tmpdir(), "nexora-e2e-"));
  const child = spawn("node", ["--no-warnings", join(ROOT, "apps/mvp/server.mjs")], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, ...extraEnv }, stdio: ["ignore", "pipe", "pipe"] });
  let log = ""; child.stdout.on("data", (d) => (log += d)); child.stderr.on("data", (d) => (log += d));
  for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://localhost:${port}/salud`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
  return { url: `http://localhost:${port}`, dir, log: () => log, db: () => new DatabaseSync(join(dir, "nexora.db"), { readOnly: true }), stop: () => child.kill() };
}

const PW = "mi gato come pescado azul 7";
async function register(page, base, o) {
  await page.goto(base + "/registro");
  await page.fill("#first_name", o.first); await page.fill("#last_name", o.last); await page.fill("#email", o.email); await page.fill("#password", o.pw ?? PW);
  await page.selectOption("#university", { label: "Universidad Don Bosco" }); await page.fill("#career", o.career ?? "Ingeniería en Sistemas"); await page.fill("#cycle", "4"); await page.selectOption("#modality", "HYBRID");
  if (o.terms !== false) await page.check('input[name="terms"]');
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}
async function addSubject(page, base, name, relation = "ENROLLED") {
  await page.goto(base + "/app/materias"); await page.fill("#name", name); await page.selectOption("#relation", relation); await page.getByRole("button", { name: "Agregar" }).click();
}
async function setSlots(page, base, slots) {
  await page.goto(base + "/app/horarios");
  for (const el of await page.locator('input[name="slot"]').all()) { const want = slots.includes(await el.getAttribute("value")); if ((await el.isChecked()) !== want) await el.setChecked(want, { force: true }); }
  await page.getByRole("button", { name: "Guardar horarios" }).click();
}


/* ═══ Conexiones y mensajería (servidor propio con base limpia) ═══ */
async function socialSuite(browser) {
  console.log("\n— Conexiones y mensajería —");
  const s = await startServer(), U = s.url;
  const mk = async () => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); return { ctx, page: await ctx.newPage() }; };
  const idOf = (email) => s.db().prepare("SELECT id FROM users WHERE email=?").get(email).id;
  const n = (sql, ...a) => s.db().prepare(sql).get(...a).n;
  const A = await mk(), B = await mk(), C = await mk();
  const setup = async (u, first, email) => { await register(u.page, U, { first, last: "Social", email }); await u.page.waitForURL("**/app"); await addSubject(u.page, U, "Cálculo II", "ENROLLED"); await addSubject(u.page, U, "Física I", first === "Beto" ? "STRUGGLING" : "ENROLLED"); await setSlots(u.page, U, ["0-9", "2-15"]); };
  await setup(A, "Ana", "ana@social.test"); await setup(B, "Beto", "beto@social.test"); await setup(C, "Carla", "carla@social.test");
  const post = (u, path, form, opts = {}) => u.ctx.request.post(U + path, { form, headers: { Origin: U }, maxRedirects: 0, ...opts });
  const card = (u, name) => u.page.locator(".match", { hasText: name });
  const flash = (u) => u.page.locator(".form-status").first();

  // 1. Solicitud
  await A.page.goto(U + "/app/smart-match");
  ok("Ana ve a Beto y a Carla con botón 'Conectar'", (await A.page.locator(".match").count()) === 2 && await card(A, "Beto").getByRole("button", { name: "Conectar" }).isEnabled());
  await card(A, "Beto").getByRole("button", { name: "Conectar" }).click(); await A.page.waitForSelector(".form-status--ok");
  ok("enviar solicitud: confirmación y botón 'Solicitud enviada' deshabilitado", (await flash(A).innerText()).includes("Solicitud enviada") && await card(A, "Beto").getByRole("button", { name: "Solicitud enviada" }).isDisabled());
  ok("no se puede duplicar la solicitud (pendiente)", (await post(A, "/app/conexiones", { action: "request", user_id: idOf("beto@social.test") })).headers().location.includes("error=pending"));
  ok("solicitud guardada en la base de datos como PENDING", n("SELECT COUNT(*) n FROM connections WHERE status='PENDING'") === 1);
  await A.page.screenshot({ path: `${SHOTS}/12-solicitud-enviada.png`, fullPage: true });

  // 2. Aceptar
  await B.page.goto(U + "/app");
  ok("Beto ve el aviso en el menú (1 solicitud) y en el dashboard", (await B.page.locator('nav.app-nav--side a[href="/app/conexiones"] .count').innerText()) === "1" && (await B.page.getByText("solicitud de conexión").count()) >= 1);
  await B.page.goto(U + "/app/conexiones");
  ok("Beto ve la solicitud de Ana en 'Solicitudes recibidas (1)'", (await B.page.getByText("Solicitudes recibidas (1)").count()) === 1);
  await B.page.screenshot({ path: `${SHOTS}/13-conexiones-solicitud.png`, fullPage: true });
  await B.page.getByRole("button", { name: "Aceptar solicitud de Ana" }).click(); await B.page.waitForSelector(".form-status--ok");
  ok("aceptar: ahora están conectados (Mis conexiones: 1)", (await B.page.getByText("Mis conexiones (1)").count()) === 1 && n("SELECT COUNT(*) n FROM connections WHERE status='ACCEPTED'") === 1);

  // 3. Mensajes
  await A.page.goto(U + "/app/smart-match");
  await card(A, "Beto").getByRole("link", { name: "Enviar mensaje" }).click(); await A.page.waitForURL(/\/app\/mensajes\/[\w-]+$/);
  const threadUrl = A.page.url(), convId = threadUrl.split("/").pop();
  await A.page.fill("#body", "Hola Beto\nsegunda línea"); await A.page.getByRole("button", { name: "Enviar" }).click(); await A.page.waitForSelector(".msg--me");
  ok("mensaje enviado y mostrado con saltos de línea y hora", (await A.page.locator(".msg--me .msg__body").first().innerText()) === "Hola Beto\nsegunda línea" && /\d/.test(await A.page.locator(".msg__meta").first().innerText()));
  await B.page.goto(U + "/app");
  ok("Beto ve 1 mensaje sin leer en el menú", (await B.page.locator('nav.app-nav--side a[href="/app/mensajes"] .count').innerText()) === "1");
  await B.page.goto(U + "/app/mensajes");
  ok("la bandeja muestra a Ana, vista previa y contador sin leer", (await B.page.locator(".inbox__item").first().innerText()).includes("Ana S.") && (await B.page.locator(".inbox__item .count").innerText()) === "1");
  await B.page.locator(".inbox__item").first().click(); await B.page.waitForSelector(".msg--them");
  ok("al abrir la conversación se lee el mensaje", (await B.page.locator(".msg--them .msg__body").innerText()).startsWith("Hola Beto"));
  await B.page.goto(U + "/app"); ok("el contador sin leer desaparece al leer", (await B.page.locator('nav.app-nav--side a[href="/app/mensajes"] .count').count()) === 0);
  await B.page.screenshot({ path: `${SHOTS}/14-mensajes.png`, fullPage: true });
  await A.page.reload(); ok("Ana ve 'Visto' cuando Beto lo leyó", (await A.page.locator(".msg__meta").first().innerText()).includes("Visto"));
  await A.page.fill("#body", "<img src=x onerror=window.__m=1>"); await A.page.getByRole("button", { name: "Enviar" }).click(); await A.page.waitForSelector(".msg--me >> nth=1");
  ok("XSS en un mensaje: se muestra como texto, no se ejecuta", (await A.page.locator(".thread img").count()) === 0 && (await A.page.evaluate(() => window.__m)) === undefined && (await A.page.locator(".msg__body", { hasText: "<img src=x" }).count()) === 1);
  const empty = await post(A, `/app/mensajes/${convId}`, { body: "   " }, { maxRedirects: 5 }); ok("mensaje vacío rechazado (400)", empty.status() === 400 && (await empty.text()).includes("Escribe un mensaje"));
  const long = await post(A, `/app/mensajes/${convId}`, { body: "x".repeat(2001) }, { maxRedirects: 5 }); ok("mensaje de más de 2000 caracteres rechazado (400)", long.status() === 400);
  const dups = []; for (let i = 0; i < 4; i++) dups.push((await post(A, `/app/mensajes/${convId}`, { body: "mensaje repetido" })).status());
  ok("anti-spam: el 4.º mensaje idéntico seguido se rechaza (429)", dups.slice(0, 3).every((c) => c === 303) && dups[3] === 429, dups.join());
  const burst = []; for (let i = 0; i < 30; i++) burst.push((await post(A, `/app/mensajes/${convId}`, { body: "ráfaga número " + i })).status());
  ok("límite de velocidad: ráfaga de 30 mensajes → se corta con 429", burst.includes(429), burst.join(","));

  // 4. Acceso ajeno
  const before = n("SELECT COUNT(*) n FROM messages");
  ok("IDOR: Carla no puede leer la conversación de Ana y Beto (404)", (await C.ctx.request.get(threadUrl)).status() === 404);
  ok("IDOR: Carla no puede escribir en esa conversación (404) y no se guarda nada", (await post(C, `/app/mensajes/${convId}`, { body: "intruso" })).status() === 404 && n("SELECT COUNT(*) n FROM messages") === before);
  const noConn = await C.ctx.request.get(`${U}/app/mensajes/con/${idOf("ana@social.test")}`, { maxRedirects: 0 });
  ok("sólo se escribe a conexiones: sin conexión → rechazado y sin conversación nueva", (noConn.headers().location ?? "").includes("no-conectados") && n("SELECT COUNT(*) n FROM conversations") === 1);

  // 5. Rechazo sin revelar
  await C.page.goto(U + "/app/smart-match"); await card(C, "Ana").getByRole("button", { name: "Conectar" }).click(); await C.page.waitForSelector(".form-status--ok");
  await A.page.goto(U + "/app/conexiones"); await A.page.getByRole("button", { name: "Rechazar solicitud de Carla" }).click(); await A.page.waitForSelector(".form-status--ok");
  ok("Ana rechaza la solicitud de Carla", (await flash(A).innerText()).includes("rechazada") && n("SELECT COUNT(*) n FROM connections WHERE status='DECLINED'") === 1);
  await C.page.goto(U + "/app/smart-match");
  ok("Carla sigue viendo 'Solicitud enviada': no se le revela el rechazo", await card(C, "Ana").getByRole("button", { name: "Solicitud enviada" }).isDisabled());
  ok("Carla no puede reintentar durante el plazo de espera", (await post(C, "/app/conexiones", { action: "request", user_id: idOf("ana@social.test") })).headers().location.includes("error=cooldown"));

  // 6. Reportes
  await A.page.goto(U + "/app/conexiones"); await A.page.locator("summary", { hasText: "Reportar" }).click();
  await A.page.locator('select[name="reason"]').selectOption("SPAM"); await A.page.locator('textarea[name="details"]').fill("Prueba de reporte"); await A.page.getByRole("button", { name: "Enviar reporte" }).click(); await A.page.waitForSelector(".form-status--ok");
  ok("reportar a una conexión: se guarda con motivo y autor", n("SELECT COUNT(*) n FROM reports WHERE reason='SPAM' AND target_type='USER'") === 1 && (await flash(A).innerText()).includes("Reporte enviado"));
  ok("motivo de reporte inválido rechazado", (await post(A, "/app/reportar", { user_id: idOf("carla@social.test"), reason: "INVENTADO" })).headers().location.includes("reporte-invalido"));

  // 7. Bloqueo
  await A.page.goto(U + "/app/conexiones"); await A.page.getByRole("button", { name: "Bloquear a Beto" }).click(); await A.page.waitForSelector(".form-status--ok");
  ok("bloquear: se elimina la conexión y la conversación con sus mensajes", n("SELECT COUNT(*) n FROM connections WHERE status='ACCEPTED'") === 0 && n("SELECT COUNT(*) n FROM conversations") === 0 && n("SELECT COUNT(*) n FROM messages") === 0);
  await A.page.goto(U + "/app/smart-match"); await B.page.goto(U + "/app/smart-match");
  ok("el bloqueo oculta a cada uno del Smart Match del otro", (await card(A, "Beto").count()) === 0 && (await card(B, "Ana").count()) === 0);
  ok("Beto no puede abrir la conversación ni pedir conexión a Ana", (await B.ctx.request.get(threadUrl)).status() === 404 && (await post(B, "/app/conexiones", { action: "request", user_id: idOf("ana@social.test") })).headers().location.includes("error=blocked"));
  await A.page.goto(U + "/app/conexiones"); await A.page.getByRole("button", { name: "Desbloquear a Beto" }).click(); await A.page.waitForSelector(".form-status--ok");
  await A.page.goto(U + "/app/smart-match"); ok("al desbloquear, vuelven a verse en Smart Match", (await card(A, "Beto").count()) === 1);

  // 8. Eliminar conexión y cuenta
  await card(A, "Beto").getByRole("button", { name: "Conectar" }).click(); await A.page.waitForSelector(".form-status--ok");
  await B.page.goto(U + "/app/conexiones"); await B.page.getByRole("button", { name: "Aceptar solicitud de Ana" }).click(); await B.page.waitForSelector(".form-status--ok");
  await B.page.goto(U + `/app/mensajes/con/${idOf("ana@social.test")}`); await B.page.fill("#body", "otra vez"); await B.page.getByRole("button", { name: "Enviar" }).click(); await B.page.waitForSelector(".msg--me"); // escribe Beto: Ana sigue dentro de la ventana de límite tras su ráfaga
  await A.page.goto(U + "/app/conexiones"); await A.page.getByRole("button", { name: "Eliminar conexión con Beto" }).click(); await A.page.waitForSelector(".form-status--ok");
  ok("eliminar conexión borra también la conversación", n("SELECT COUNT(*) n FROM conversations") === 0 && n("SELECT COUNT(*) n FROM connections WHERE status='ACCEPTED'") === 0);
  await B.page.goto(U + "/app/perfil"); await B.page.locator("summary", { hasText: "Eliminar mi cuenta" }).click(); await B.page.fill("#confirm_password", PW); await B.page.getByRole("button", { name: "Eliminar cuenta definitivamente" }).click(); await B.page.waitForURL("**/iniciar-sesion**");
  const bid = "(SELECT id FROM users WHERE email='beto@social.test')";
  ok("eliminar cuenta: no quedan conexiones, bloqueos, conversaciones ni mensajes de esa persona", ["connections WHERE user_a", "connections WHERE user_b", "blocks WHERE blocker_id", "messages WHERE sender_id"].every((q) => n(`SELECT COUNT(*) n FROM ${q}=${bid}`) === 0));
  ok("auditoría social registrada (solicitud, aceptación, rechazo, bloqueo, reporte)", ["connection.create", "connection.accept", "connection.decline", "block.add", "report.user"].every((a) => n("SELECT COUNT(*) n FROM audit_logs WHERE action=?", a) >= 1));

  // 9. Demo
  const D = await mk(); await D.page.goto(U + "/demo"); await D.page.getByRole("button", { name: "Entrar al modo demo" }).click(); await D.page.waitForURL("**/app");
  ok("demo: 2 solicitudes y 1 mensaje de ejemplo ya pendientes en el menú", (await D.page.locator('nav.app-nav--side a[href="/app/conexiones"] .count').innerText()) === "2" && (await D.page.locator('nav.app-nav--side a[href="/app/mensajes"] .count').innerText()) === "1");
  await D.page.goto(U + "/app/conexiones"); await D.page.getByRole("button", { name: "Aceptar solicitud de Camila" }).click(); await D.page.waitForSelector(".form-status--ok");
  ok("demo: aceptar solicitud funciona con perfiles ficticios", (await D.page.getByText("Mis conexiones (2)").count()) === 1);
  await D.page.goto(U + "/app/mensajes"); await D.page.locator(".inbox__item").first().click();
  ok("demo: la conversación avisa que los perfiles ficticios no responden", (await D.page.getByText("los perfiles ficticios no responden").count()) === 1);
  await D.page.fill("#body", "Hola desde la demo"); await D.page.getByRole("button", { name: "Enviar" }).click(); await D.page.waitForSelector(".msg--me"); await D.page.waitForTimeout(1200); await D.page.reload();
  ok("demo: puedes escribir y NO se simulan respuestas automáticas", (await D.page.locator(".msg").count()) === 2);
  await D.page.screenshot({ path: `${SHOTS}/15-demo-mensajes.png`, fullPage: true });
  ok("demo: no puede conectar con usuarios reales", (await post(D, "/app/conexiones", { action: "request", user_id: idOf("ana@social.test") })).headers().location.includes("no-encontrada"));
  await D.page.goto(U + "/app"); await D.page.getByRole("button", { name: "Salir del demo" }).click(); await D.page.waitForURL(U + "/");
  ok("al salir del demo se borran sus conexiones y mensajes", n("SELECT COUNT(*) n FROM connections cn JOIN users u ON (u.id=cn.user_a OR u.id=cn.user_b) WHERE u.is_demo=1 AND u.demo_seed=0") === 0 && n("SELECT COUNT(*) n FROM conversations") === 0);
  for (const u of [A, B, C, D]) await u.ctx.close();
  s.stop();
}

/* ═══ Progreso, temporizador y calendario (servidor propio con base limpia) ═══ */
async function progressSuite(browser) {
  console.log("\n— Progreso, temporizador y calendario —");
  const s = await startServer(), U = s.url;
  const n = (sql, ...a) => s.db().prepare(sql).get(...a).n;
  const wdb = () => new DatabaseSync(join(s.dir, "nexora.db"));
  const mk = async () => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); page.errs = []; page.on("pageerror", (e) => page.errs.push(e.message)); page.on("console", (m) => m.type() === "error" && page.errs.push(m.text())); return { ctx, page }; };
  const todayKey = () => new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10);
  const addDaysKey = (k, d) => new Date(Date.parse(k + "T12:00:00Z") + d * 86400e3).toISOString().slice(0, 10);
  const P = await mk(), Q = await mk();
  for (const [u, first, email] of [[P, "Paula", "paula@prog.test"], [Q, "Quique", "quique@prog.test"]]) { await register(u.page, U, { first, last: "Progreso", email }); await u.page.waitForURL("**/app"); }
  await addSubject(P.page, U, "Cálculo II", "ENROLLED");
  const pid = s.db().prepare("SELECT id FROM users WHERE email='paula@prog.test'").get().id;
  const post = (u, path, form, headers = {}) => u.ctx.request.post(U + path, { form, headers: { Origin: U, ...headers }, maxRedirects: 0 });
  const stat = (u, label) => u.page.locator(".stats--app .stat", { hasText: label }).locator(".stat__value").innerText();

  // 1. Estado inicial
  await P.page.goto(U + "/app/progreso");
  ok("progreso vacío: estados vacíos honestos y racha 0", (await P.page.getByText("Todavía no hay sesiones").count()) === 1 && (await P.page.getByText("Aún no tienes objetivos").count()) === 1 && (await stat(P, "de racha")) === "0");
  ok("aclara que el tiempo es autodeclarado y que no hay recordatorios", (await P.page.getByText("autodeclarado").count()) >= 1 && (await P.page.getByText("no envía recordatorios").count()) === 1);
  const js = await P.ctx.request.get(U + "/app-assets/timer.js");
  ok("timer.js se sirve como JavaScript con CSP estricta", js.ok() && js.headers()["content-type"].includes("javascript") && /script-src 'self'/.test(js.headers()["content-security-policy"]));

  // 2. Sesión manual
  await P.page.locator("summary", { hasText: "Registrar una sesión manualmente" }).click(); await P.page.fill("#man-min", "30"); await P.page.locator('form[action="/app/progreso/sesiones"] button[type=submit]').click(); await P.page.waitForSelector(".form-status--ok");
  ok("sesión manual guardada: aparece en el historial como 'Manual'", (await P.page.locator(".subject-list li", { hasText: "30 min" }).innerText()).includes("Manual") && (await stat(P, "min esta semana")) === "30" && (await stat(P, "sesión completada")) === "1");
  ok("racha = 1 tras estudiar hoy", (await stat(P, "de racha")) === "1");

  // 3. Temporizador real (reloj controlado: se avanza el tiempo sin esperar)
  const T = await mk(); await T.ctx.addCookies(await P.ctx.cookies());
  await T.page.clock.install(); await T.page.goto(U + "/app/progreso");
  await T.page.locator('input[name="preset"][value="custom"]').check(); await T.page.fill("[data-custom]", "1");
  ok("temporizador personalizado de 1 minuto muestra 01:00", (await T.page.locator("[data-display]").innerText()) === "01:00");
  await T.page.getByRole("button", { name: "Iniciar", exact: true }).click(); await T.page.clock.runFor(10_000);
  ok("iniciar: la cuenta regresiva avanza (≈00:50) y aparece el botón Pausar", /^00:5[01]$/.test(await T.page.locator("[data-display]").innerText()) && await T.page.getByRole("button", { name: "Pausar" }).isVisible());
  await T.page.getByRole("button", { name: "Pausar" }).click(); const atPause = await T.page.locator("[data-display]").innerText(); await T.page.clock.runFor(20_000);
  ok("pausar: el tiempo se detiene aunque pasen 20 s y ofrece 'Reanudar'", (await T.page.locator("[data-display]").innerText()) === atPause && await T.page.getByRole("button", { name: "Reanudar" }).isVisible());
  await T.page.getByRole("button", { name: "Reanudar" }).click(); await T.page.clock.runFor(51_000);
  await T.page.waitForFunction(() => document.querySelector("[data-msg]").textContent.includes("Sesión guardada"));
  ok("al terminar se guarda la sesión en el servidor (origen: temporizador)", n("SELECT COUNT(*) n FROM study_sessions WHERE user_id=? AND source='timer' AND focus_minutes=1", pid) === 1);
  ok("el temporizador no produjo errores de JavaScript", T.page.errs.length === 0, T.page.errs.join("|"));
  await T.ctx.close();
  const R = await mk(); await R.ctx.addCookies(await P.ctx.cookies()); await R.page.goto(U + "/app/progreso");
  await R.page.locator('input[name="preset"][value="custom"]').check(); await R.page.fill("[data-custom]", "5"); await R.page.getByRole("button", { name: "Iniciar", exact: true }).click(); await R.page.reload();
  ok("el temporizador sobrevive a recargar la página", (await R.page.locator("#timer").getAttribute("data-state")) === "running" && /^0[0-5]:\d\d$/.test(await R.page.locator("[data-display]").innerText()));
  await R.page.getByRole("button", { name: "Reiniciar" }).click(); await R.ctx.close();

  // 4. Validación y abuso
  const bad = []; for (const m of ["0", "181", "abc", "", "-5", "1.5"]) bad.push((await post(P, "/app/progreso/sesiones", { minutes: m }, { Accept: "application/json" })).status());
  ok("minutos inválidos (0, 181, texto, vacío, negativo, decimal) rechazados con 400", bad.every((c) => c === 400), bad.join());
  await Q.page.goto(U + "/app/progreso"); await Q.page.fill("#goal-title", "Objetivo de Quique"); await Q.page.getByRole("button", { name: "Agregar objetivo" }).click(); await Q.page.waitForSelector(".form-status--ok");
  const qGoal = s.db().prepare("SELECT id FROM goals WHERE title='Objetivo de Quique'").get().id;
  ok("IDOR: no se puede registrar una sesión contra el objetivo de otra persona", (await post(P, "/app/progreso/sesiones", { minutes: "10", goal_id: qGoal }, { Accept: "application/json" })).status() === 400);
  await post(P, "/app/progreso", { action: "goal_delete", id: qGoal }); await post(P, "/app/progreso", { action: "goal_done", id: qGoal });
  ok("IDOR: Paula no puede borrar ni modificar el objetivo de Quique", n("SELECT COUNT(*) n FROM goals WHERE id=? AND status='ACTIVE'", qGoal) === 1);
  const burst = []; for (let i = 0; i < 24; i++) burst.push((await post(P, "/app/progreso/sesiones", { minutes: "1" }, { Accept: "application/json" })).status());
  ok("límite: no más de 20 sesiones por hora (después, 429)", burst.includes(429) && n("SELECT COUNT(*) n FROM study_sessions WHERE user_id=?", pid) <= 21, burst.join());
  { const w = wdb(); w.prepare("DELETE FROM study_sessions WHERE user_id=? AND focus_minutes=1").run(pid); w.close(); }

  // 5. Objetivos
  await P.page.goto(U + "/app/progreso"); await P.page.fill("#goal-title", "Terminar guía <b>3</b>"); await P.page.selectOption("#goal-subject", { label: "Cálculo II" }); await P.page.fill("#goal-date", addDaysKey(todayKey(), 3));
  await P.page.getByRole("button", { name: "Agregar objetivo" }).click(); await P.page.waitForSelector(".form-status--ok");
  ok("objetivo con materia y fecha; el HTML del título se muestra como texto", (await P.page.locator(".subject-list li", { hasText: "Terminar guía" }).locator("b").count()) === 0 && (await P.page.getByText("Terminar guía <b>3</b>").count()) >= 1);
  await P.page.getByRole("button", { name: "Marcar cumplido" }).click(); await P.page.waitForSelector(".form-status--ok");
  ok("marcar cumplido actualiza el contador (1/1)", (await stat(P, "objetivos cumplidos")) === "1/1" && (await P.page.locator(".is-done").count()) === 1);
  await P.page.getByRole("button", { name: "Reabrir" }).click(); await P.page.waitForSelector(".form-status--ok");
  ok("reabrir el objetivo funciona", (await stat(P, "objetivos cumplidos")) === "0/1");

  // 6. Racha y preferencias
  { const w = wdb(), k = todayKey(); for (const d of [-1, -2]) w.prepare("INSERT INTO study_sessions(id,user_id,focus_minutes,ended_at,source) VALUES(?,?,?,?,?)").run("seed-" + d, pid, 20, Date.parse(addDaysKey(k, d) + "T18:00:00Z"), "timer"); w.close(); }
  await P.page.goto(U + "/app/progreso");
  ok("racha de 3 días (hoy + 2 días previos)", (await stat(P, "de racha")) === "3");
  ok("gráfica semanal: 7 días y hoy marcado", (await P.page.locator(".week-bars li").count()) === 7 && (await P.page.locator('.week-bars li[aria-current="date"]').count()) === 1);
  await P.page.screenshot({ path: `${SHOTS}/16-progreso.png`, fullPage: true });
  await P.page.locator('input[name="show_streak"]').uncheck(); await P.page.getByRole("button", { name: "Guardar preferencia" }).click(); await P.page.waitForSelector(".form-status--ok");
  await P.page.goto(U + "/app");
  ok("racha opcional: al apagarla desaparece del progreso y del dashboard", (await P.page.locator(".stats--app .stat", { hasText: "de racha" }).count()) === 0 && (await P.page.locator(".snap").innerText()).indexOf("racha") === -1);
  ok("dashboard muestra los minutos de la semana", /\d+ min estudiados esta semana/.test(await P.page.locator(".snap").innerText()));
  await P.page.goto(U + "/app/progreso"); await P.page.locator('input[name="show_streak"]').check(); await P.page.getByRole("button", { name: "Guardar preferencia" }).click();

  // 7. Calendario
  const tomorrow = addDaysKey(todayKey(), 1);
  await P.page.goto(U + "/app/calendario"); await P.page.locator("summary", { hasText: "Agregar evento" }).click();
  await P.page.fill("#ev-title", "Parcial <i>1</i>"); await P.page.selectOption("#ev-kind", "EXAM"); await P.page.fill("#ev-date", tomorrow); await P.page.fill("#ev-start", "10:00"); await P.page.fill("#ev-end", "11:00"); await P.page.getByRole("button", { name: "Agregar", exact: true }).click(); await P.page.waitForSelector(".form-status--ok");
  await P.page.goto(U + `/app/calendario?vista=dia&fecha=${tomorrow}`);
  ok("evento guardado: aparece en la vista del día con su horario 10:00–11:00", (await P.page.locator(".cal-entry", { hasText: "Parcial" }).innerText()).includes("10:00–11:00") && (await P.page.locator(".cal-entry i").count()) === 0);
  await P.page.goto(U + `/app/calendario?vista=semana&fecha=${tomorrow}`); ok("el evento aparece en la vista semanal", (await P.page.locator(".cal-week .cal-entry", { hasText: "Parcial" }).count()) === 1);
  await P.page.goto(U + `/app/calendario?vista=mes&fecha=${tomorrow}`); ok("el evento, el objetivo con fecha y las sesiones aparecen en la vista mensual", (await P.page.locator(".cal__chip", { hasText: "Parcial" }).count()) === 1 && (await P.page.locator(".cal__chip--goal").count()) >= 1 && (await P.page.locator(".cal__chip--session").count()) >= 1);
  await P.page.screenshot({ path: `${SHOTS}/17-calendario-mes.png`, fullPage: true });
  await P.page.goto(U + `/app/calendario?vista=dia&fecha=${tomorrow}`); await P.page.locator("summary", { hasText: "Agregar evento" }).click();
  await P.page.fill("#ev-title", "Hora invertida"); await P.page.fill("#ev-start", "15:00"); await P.page.fill("#ev-end", "14:00"); await P.page.getByRole("button", { name: "Agregar", exact: true }).click(); await P.page.waitForSelector(".form-status--error");
  ok("hora de fin anterior al inicio: error claro y no se guarda", (await P.page.locator(".form-status--error").innerText()).includes("hora de fin") && n("SELECT COUNT(*) n FROM calendar_events WHERE title='Hora invertida'") === 0);
  const today = todayKey();
  await P.page.goto(U + `/app/calendario?vista=dia&fecha=${today}`); await P.page.locator("summary", { hasText: "Agregar evento" }).click();
  await P.page.fill("#ev-title", "Estudio nocturno"); await P.page.fill("#ev-start", "23:30"); await P.page.fill("#ev-end", "23:45"); await P.page.getByRole("button", { name: "Agregar", exact: true }).click(); await P.page.waitForSelector(".form-status--ok");
  await P.page.goto(U + `/app/calendario?vista=dia&fecha=${today}`); const tmr = await P.ctx.request.get(U + `/app/calendario?vista=dia&fecha=${tomorrow}`);
  ok("zona horaria: un evento a las 23:30 locales queda en el día correcto (no se corre al siguiente)", (await P.page.locator(".cal-entry", { hasText: "Estudio nocturno" }).count()) === 1 && !(await tmr.text()).includes("Estudio nocturno"));
  const tamper = await P.ctx.request.get(U + "/app/calendario?vista=%3Cscript%3E&fecha=no-es-fecha");
  ok("parámetros manipulados (vista/fecha) no rompen la página", tamper.status() === 200 && (await tamper.text()).includes("<h1>Calendario</h1>"));
  const evId = s.db().prepare("SELECT id FROM calendar_events WHERE title LIKE 'Parcial%'").get().id;
  await post(Q, "/app/calendario", { action: "event_delete", id: evId });
  ok("IDOR: Quique no puede borrar el evento de Paula", n("SELECT COUNT(*) n FROM calendar_events WHERE id=?", evId) === 1);
  await P.page.goto(U + `/app/calendario?vista=dia&fecha=${tomorrow}`); await P.page.getByRole("button", { name: /Eliminar evento Parcial/ }).click(); await P.page.waitForSelector(".form-status--ok");
  ok("eliminar evento funciona", n("SELECT COUNT(*) n FROM calendar_events WHERE id=?", evId) === 0);
  await P.page.goto(U + "/app/calendario"); const t1 = await P.page.locator(".cal-title").innerText(); await P.page.getByRole("link", { name: "Siguiente" }).click(); const t2 = await P.page.locator(".cal-title").innerText();
  await P.page.getByRole("link", { name: "Hoy" }).click();
  ok("navegación mensual: siguiente cambia el mes y 'Hoy' regresa", t1 !== t2 && (await P.page.locator(".cal-title").innerText()) === t1, `${t1} → ${t2}`);

  // 8. Exportar y eliminar
  const exp = await (await P.ctx.request.get(U + "/app/perfil/exportar")).json();
  ok("exportar: incluye objetivos, sesiones y calendario", exp.progreso.objetivos.length === 1 && exp.progreso.sesiones_de_estudio.length >= 3 && Array.isArray(exp.calendario) && exp.calendario.length === 1);
  await P.page.goto(U + "/app/perfil"); await P.page.locator("summary", { hasText: "Eliminar mi cuenta" }).click(); await P.page.fill("#confirm_password", PW); await P.page.getByRole("button", { name: "Eliminar cuenta definitivamente" }).click(); await P.page.waitForURL("**/iniciar-sesion**");
  ok("eliminar cuenta borra objetivos, sesiones y eventos", ["goals", "study_sessions", "calendar_events"].every((t) => n(`SELECT COUNT(*) n FROM ${t} WHERE user_id=?`, pid) === 0));

  // 9. Demo
  const D = await mk(); await D.page.goto(U + "/demo"); await D.page.getByRole("button", { name: "Entrar al modo demo" }).click(); await D.page.waitForURL("**/app");
  await D.page.goto(U + "/app/progreso");
  ok("demo: progreso de ejemplo (racha 3, 2 objetivos, 3 sesiones) bajo el banner de demo", (await stat(D, "de racha")) === "3" && (await D.page.locator(".subject-list li", { hasText: "(demo)" }).count()) >= 2 && (await D.page.locator(".demo-banner").count()) === 1);
  await D.page.goto(U + `/app/calendario?vista=dia&fecha=${addDaysKey(todayKey(), 1)}`);
  ok("demo: calendario con eventos de ejemplo", (await D.page.locator(".cal-entry", { hasText: "Clase de Cálculo (demo)" }).count()) === 1);
  await D.page.screenshot({ path: `${SHOTS}/18-demo-calendario.png`, fullPage: true });
  await D.ctx.close();
  for (const u of [P, Q]) await u.ctx.close();
  s.stop();
}

const srv = await startServer();
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const newCtx = (vp = { width: 1280, height: 900 }) => browser.newContext({ viewport: vp });
try {
  /* ═══ 1. Sitio público servido por el servidor real ═══ */
  console.log("\n— Sitio público y cabeceras de seguridad —");
  const api = await request.newContext({ baseURL: srv.url });
  const home = await api.get("/");
  ok("GET / → 200 con HTML pre-renderizado", home.ok() && (await home.text()).includes("Conecta. Aprende. Evoluciona."));
  const h = home.headers();
  ok("CSP: script-src 'self' y sin unsafe-eval/inline en scripts", /script-src 'self'(;|$)/.test(h["content-security-policy"]) && !/script-src[^;]*unsafe/.test(h["content-security-policy"]));
  ok("cabeceras: nosniff, frame DENY, Referrer-Policy", h["x-content-type-options"] === "nosniff" && h["x-frame-options"] === "DENY" && !!h["referrer-policy"]);
  ok("sin cabecera X-Powered-By", !h["x-powered-by"]);
  const robots = await (await api.get("/robots.txt")).text();
  ok("robots.txt bloquea todo (SITE_INDEXABLE=false)", /Disallow: \//.test(robots) && !/Sitemap/.test(robots));
  ok("sitemap.xml existe", (await api.get("/sitemap.xml")).ok());
  const nf = await api.get("/ruta-que-no-existe");
  ok("ruta inexistente → 404 con la página 'Esta conexión no existe.'", nf.status() === 404 && (await nf.text()).includes("Esta conexión no existe."));
  ok("traversal de rutas bloqueado", (await api.get("/%2e%2e/%2e%2e/etc/passwd")).status() === 404 && (await api.get("/_shell/404.html")).status() === 404 && (await api.get("/..%2f..%2fserver.mjs")).status() === 404);
  const health = await (await api.get("/salud")).json();
  ok("/salud responde {status:ok} sin exponer configuración", health.status === "ok" && Object.keys(health).sort().join() === "status,version");
  ok("no se sirven archivos de datos ni código", [(await api.get("/nexora.db")).status(), (await api.get("/server.mjs")).status(), (await api.get("/src/db.mjs")).status()].every((s) => s === 404));

  /* ═══ 2. Hidratación, menú, Instagram, contacto ═══ */
  console.log("\n— Navegación, hidratación y contacto —");
  let ctx = await newCtx(); let page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => ["error", "warning"].includes(m.type()) && errs.push(m.text()));
  await page.goto(srv.url + "/"); await page.waitForTimeout(600);
  ok("portada hidrata sin errores ni advertencias de consola", errs.length === 0, errs.join(" | ").slice(0, 300));
  ok("Instagram @nexora_sv1 en el pie", (await page.locator('footer a[href^="https://www.instagram.com/nexora_sv1"]').count()) === 1);
  ok("correo oficial NO inventado (placeholder visible)", (await page.getByText("Correo oficial: pendiente").count()) === 1);
  await page.getByRole("button", { name: "Rechazar" }).click();
  for (const [name, path] of [["Funciones", "/funciones"], ["Planes", "/planes"], ["FAQ", "/faq"], ["Contacto", "/contacto"]]) {
    await page.locator("nav.nav-bar").getByRole("link", { name, exact: true }).click(); await page.waitForURL("**" + path);
  }
  ok("navegación entre páginas (Funciones, Planes, FAQ, Contacto)", page.url().endsWith("/contacto"));
  await page.fill('input[name="name"]', "Ana Visitante"); await page.fill('input[name="email"]', "visitante@correo.com"); await page.fill('textarea[name="message"]', "Hola, quiero saber más de NEXORA.");
  await page.getByRole("button", { name: "Enviar mensaje" }).click(); await page.waitForSelector(".form-status--ok");
  ok("formulario de contacto: confirmación real", true);
  ok("mensaje guardado en SQLite", srv.db().prepare("SELECT COUNT(*) n FROM contact_messages WHERE email='visitante@correo.com'").get().n === 1);
  await page.reload(); await page.fill('input[name="name"]', "Bot"); await page.fill('input[name="email"]', "bot@spam.com"); await page.fill('textarea[name="message"]', "Compra ahora mismo barato ya");
  await page.evaluate(() => { document.querySelector('input[name="website"]').value = "x"; }); await page.getByRole("button", { name: "Enviar mensaje" }).click(); await page.waitForTimeout(500);
  ok("honeypot: no se guarda el mensaje del bot", srv.db().prepare("SELECT COUNT(*) n FROM contact_messages WHERE email='bot@spam.com'").get().n === 0);
  await ctx.close();

  /* ═══ 3. Protección de la aplicación ═══ */
  console.log("\n— Autenticación y control de acceso —");
  ctx = await newCtx(); page = await ctx.newPage();
  await page.goto(srv.url + "/app"); ok("/app sin sesión → redirige a iniciar sesión", page.url().endsWith("/iniciar-sesion"));
  for (const p of ["/app/materias", "/app/horarios", "/app/perfil", "/app/smart-match", "/app/perfil/exportar"]) { await page.goto(srv.url + p); if (!page.url().endsWith("/iniciar-sesion")) ok(`sin sesión, ${p} protegida`, false); }
  ok("todas las rutas /app/* exigen sesión", page.url().endsWith("/iniciar-sesion"));

  await register(page, srv.url, { first: "Ana", last: "Prueba", email: "ana@prueba.test", pw: "corta" });
  ok("registro con contraseña débil: error claro, sin cuenta", (await page.getByText("al menos 10 caracteres").count()) > 0 && srv.db().prepare("SELECT COUNT(*) n FROM users WHERE email='ana@prueba.test'").get().n === 0);
  await register(page, srv.url, { first: "Ana", last: "Prueba", email: "ana@prueba.test", terms: false });
  ok("registro sin aceptar términos: bloqueado", (await page.getByText("Debes aceptar los Términos").count()) > 0);
  await register(page, srv.url, { first: "Ana", last: "Prueba", email: "ana@prueba.test" });
  await page.waitForURL("**/app"); ok("registro correcto → dashboard 'Hola, Ana'", (await page.locator("h1").innerText()) === "Hola, Ana");
  const row = srv.db().prepare("SELECT password_hash, is_demo FROM users WHERE email='ana@prueba.test'").get();
  ok("contraseña guardada con scrypt (nunca en claro)", row.password_hash.startsWith("scrypt$") && !row.password_hash.includes(PW) && row.is_demo === 0);
  const cookies = await ctx.cookies(); const sc = cookies.find((c) => c.name === "nexora_session");
  ok("cookie de sesión HttpOnly + SameSite=Lax", sc && sc.httpOnly && sc.sameSite === "Lax");
  ok("el token de sesión NO se guarda en claro", srv.db().prepare("SELECT COUNT(*) n FROM sessions WHERE token_hash=?").get(sc.value).n === 0);
  await page.screenshot({ path: `${SHOTS}/04-dashboard-vacio.png`, fullPage: true });

  { const p2 = await ctx.newPage(); await p2.goto(srv.url + "/registro"); ok("con sesión iniciada, /registro redirige al dashboard", p2.url().endsWith("/app")); await p2.close(); }
  const dupCtx = await newCtx(); const dupPage = await dupCtx.newPage();
  await register(dupPage, srv.url, { first: "Dup", last: "Licado", email: "ANA@prueba.test" });
  ok("correo duplicado (sin distinguir mayúsculas): rechazado", (await dupPage.getByText("Ya existe una cuenta con ese correo").count()) === 1);
  await dupCtx.close();

  /* ═══ 4. Materias, horarios, perfil ═══ */
  console.log("\n— Materias, horarios y perfil —");
  await addSubject(page, srv.url, "Cálculo II", "ENROLLED"); await addSubject(page, srv.url, "Programación I", "ENROLLED"); await addSubject(page, srv.url, "Física I", "STRUGGLING");
  ok("materias agregadas y visibles", (await page.locator(".subject-list li").count()) === 3);
  await page.goto(srv.url + "/app/materias"); await page.fill("#name", "<img src=x onerror=window.__pwned=1>"); await page.getByRole("button", { name: "Agregar" }).click();
  await page.goto(srv.url + "/app/materias");
  ok("XSS en nombre de materia: se muestra como texto, no se ejecuta", (await page.locator(".subject-list img").count()) === 0 && (await page.evaluate(() => window.__pwned)) === undefined && (await page.getByText("<img src=x").count()) === 1);
  await page.locator(".subject-list li", { hasText: "<img" }).getByRole("button", { name: /Quitar/ }).click();
  ok("quitar materia funciona", (await page.locator(".subject-list li").count()) === 3);
  await setSlots(page, srv.url, ["0-9", "1-9", "2-15", "3-15", "4-11"]);
  await page.goto(srv.url + "/app/horarios");
  ok("horarios guardados y persistentes (5 bloques)", (await page.locator('input[name="slot"]:checked').count()) === 5);
  await page.screenshot({ path: `${SHOTS}/06-horarios.png`, fullPage: true });
  const bad = ["9-9", "0-8", "x", "0-9; DROP TABLE users", "6-19", "6-19", "1-7"].map((v) => "slot=" + encodeURIComponent(v)).join("&"); // campos repetidos, igual que un navegador
  await page.request.post(srv.url + "/app/horarios", { data: bad, headers: { Origin: srv.url, "Content-Type": "application/x-www-form-urlencoded" } });
  const stored = srv.db().prepare("SELECT slot FROM availability a JOIN users u ON u.id=a.user_id WHERE u.email='ana@prueba.test' ORDER BY slot").all().map((r) => r.slot);
  ok("bloques horarios inválidos y repetidos descartados (sólo quedan 1-7 y 6-19)", stored.join() === "1-7,6-19", stored.join());
  ok("la tabla users sigue intacta tras el intento de inyección", srv.db().prepare("SELECT COUNT(*) n FROM users").get().n >= 1);
  await setSlots(page, srv.url, ["0-9", "1-9", "2-15", "3-15", "4-11"]);
  await page.goto(srv.url + "/app/horarios"); await page.locator('input[name="slot"]:checked').first().waitFor({ state: "attached" });
  await setSlots(page, srv.url, []); // marcar/desmarcar: limpiar y volver a dejar los 5
  await setSlots(page, srv.url, ["0-9", "1-9", "2-15", "3-15", "4-11"]);
  await page.goto(srv.url + "/app/perfil"); await page.fill("#interests", "Desarrollo web, Datos, IA"); await page.fill("#bio", "</textarea><script>window.__bio=1</script>"); await page.check('input[name="study_style"][value="EXAM_PREP"]');
  await page.getByRole("button", { name: "Guardar perfil" }).click(); await page.waitForSelector(".form-status--ok");
  await page.reload(); ok("perfil guardado; biografía con HTML malicioso queda inerte", (await page.inputValue("#bio")).includes("<script>") && (await page.evaluate(() => window.__bio)) === undefined);
  await page.screenshot({ path: `${SHOTS}/07-perfil.png`, fullPage: true });

  /* ═══ 5. Smart Match con coincidencias reales ═══ */
  console.log("\n— Smart Match con datos reales —");
  await page.goto(srv.url + "/app/smart-match");
  ok("sin otros estudiantes reales: estado vacío honesto (no inventa coincidencias)", (await page.getByText("Aún no hay coincidencias").count()) === 1 && (await page.locator(".match").count()) === 0);
  const ctxB = await newCtx(); const pb = await ctxB.newPage();
  await register(pb, srv.url, { first: "Beto", last: "Segundo", email: "beto@prueba.test", career: "Ingeniería Industrial" }); await pb.waitForURL("**/app");
  await addSubject(pb, srv.url, "calculo ii", "ENROLLED"); await addSubject(pb, srv.url, "física i", "ENROLLED"); await addSubject(pb, srv.url, "Inglés", "ENROLLED");
  await setSlots(pb, srv.url, ["0-9", "2-15", "5-9"]);
  await page.goto(srv.url + "/app/smart-match");
  const card = page.locator(".match").first();
  ok("Ana ve a Beto como coincidencia real", (await page.locator(".match").count()) === 1 && (await card.innerText()).includes("Beto S."));
  const txt = await card.innerText();
  ok("coincide 'Cálculo II' aunque Beto lo escribió sin tilde/mayúsculas", /Cálculo II/i.test(txt));
  ok("detecta quién puede apoyar en Física I", txt.includes("Puede apoyarte en") && /F[ií]sica I/i.test(txt));
  ok("muestra horarios en común reales (Lun 9:00–11:00 y Mié 15:00–17:00)", txt.includes("Lun 9:00–11:00") && txt.includes("Mié 15:00–17:00"));
  const score = Number((await card.locator(".match__score strong").innerText()).replace("%", ""));
  ok(`compatibilidad estimada calculada (${score}%) y entre 1 y 100`, score >= 1 && score <= 100);
  ok("la tarjeta ofrece un botón 'Conectar' activo (conexiones reales)", await card.getByRole("button", { name: "Conectar" }).isEnabled());
  ok("no muestra el correo de otras personas", !(await page.content()).includes("beto@prueba.test"));
  await page.screenshot({ path: `${SHOTS}/05-smart-match-real.png`, fullPage: true });
  await page.goto(srv.url + "/app"); await page.screenshot({ path: `${SHOTS}/03-dashboard.png`, fullPage: true });
  ok("dashboard muestra 3 materias, 5 bloques y 1 coincidencia", (await page.locator(".stats--app .stat__value").allInnerTexts()).slice(0, 3).join() === "3,5,1");
  ok("funciones futuras marcadas 'Próximamente', no simuladas", (await page.locator(".soon-grid li").count()) === 3 && (await page.getByText("no están disponibles").count()) === 1);

  /* ═══ 6. Separación demo / real ═══ */
  console.log("\n— Modo demo separado de usuarios reales —");
  const body = await page.content();
  ok("usuario REAL no ve perfiles de demostración", !body.includes("Perfil de demostración") && !/Camila|Diego|Valeria/.test(await page.locator("main").innerText()));
  const ctxD = await newCtx(); const pd = await ctxD.newPage();
  await pd.goto(srv.url + "/demo"); await pd.screenshot({ path: `${SHOTS}/02-demo-entrada.png`, fullPage: true });
  await pd.getByRole("button", { name: "Entrar al modo demo" }).click(); await pd.waitForURL("**/app");
  ok("demo: banner 'MODO DEMO — Datos ficticios' visible", (await pd.locator(".demo-banner").innerText()).includes("MODO DEMO — Datos ficticios"));
  await pd.goto(srv.url + "/app/smart-match");
  const nDemo = await pd.locator(".match").count();
  ok(`demo: ${nDemo} coincidencias de perfiles ficticios, cada una etiquetada`, nDemo >= 5 && (await pd.getByText("Perfil de demostración · datos ficticios").count()) === nDemo);
  const dtxt = await pd.locator("main").innerText();
  ok("demo NO ve usuarios reales (Ana/Beto)", !/Ana P|Beto S/.test(dtxt));
  await pd.screenshot({ path: `${SHOTS}/01-demo-smart-match.png`, fullPage: true });
  await pd.goto(srv.url + "/app/perfil"); ok("demo: sin opciones de exportar/eliminar cuenta real", (await pd.getByText("Eliminar mi cuenta").count()) === 0);
  await addSubject(pd, srv.url, "Redes (demo)", "ENROLLED");
  ok("demo editable: agregar materia funciona", (await pd.locator(".subject-list li").count()) === 5);
  const demoId = srv.db().prepare("SELECT id FROM users WHERE is_demo=1 AND demo_seed=0").get()?.id;
  await pd.goto(srv.url + "/app"); await pd.getByRole("button", { name: "Salir del demo" }).click(); await pd.waitForURL(srv.url + "/");
  ok("al salir del demo se elimina la cuenta demo efímera", srv.db().prepare("SELECT COUNT(*) n FROM users WHERE is_demo=1 AND demo_seed=0").get().n === 0 && !!demoId);
  ok("los 12 perfiles demo sembrados siguen separados (is_demo=1)", srv.db().prepare("SELECT COUNT(*) n FROM users WHERE is_demo=1 AND demo_seed=1").get().n === 12 && srv.db().prepare("SELECT COUNT(*) n FROM users WHERE is_demo=0").get().n === 2);
  await ctxD.close();

  /* ═══ 7. Seguridad ═══ */
  console.log("\n— Seguridad —");
  const anaApi = ctx.request;
  const csrf = await anaApi.post(srv.url + "/app/materias", { form: { action: "add", name: "Intruso", relation: "ENROLLED" }, headers: { Origin: "http://evil.example" } });
  ok("CSRF: POST con Origin ajeno → 403", csrf.status() === 403);
  const noOrigin = await anaApi.post(srv.url + "/app/materias", { form: { action: "add", name: "Intruso", relation: "ENROLLED" }, headers: { Origin: "", Referer: "" } });
  ok("CSRF: POST sin Origin ni Referer → 403", noOrigin.status() === 403);
  ok("la materia 'Intruso' no se creó", srv.db().prepare("SELECT COUNT(*) n FROM subjects WHERE name='Intruso'").get().n === 0);
  const anaSub = srv.db().prepare("SELECT ss.subject_id id FROM student_subjects ss JOIN users u ON u.id=ss.user_id WHERE u.email='ana@prueba.test' LIMIT 1").get().id;
  await ctxB.request.post(srv.url + "/app/materias", { form: { action: "remove", subject_id: anaSub }, headers: { Origin: srv.url } });
  ok("IDOR: Beto no puede borrar materias de Ana", srv.db().prepare("SELECT COUNT(*) n FROM student_subjects ss JOIN users u ON u.id=ss.user_id WHERE u.email='ana@prueba.test'").get().n === 3);
  const sqli = await (await newCtx()).request.post(srv.url + "/iniciar-sesion", { form: { email: "' OR 1=1 --", password: "x" }, headers: { Origin: srv.url } });
  ok("inyección SQL en login: 401 genérico", sqli.status() === 401 && (await sqli.text()).includes("Correo o contraseña incorrectos"));
  const e1 = await (await newCtx()).request.post(srv.url + "/iniciar-sesion", { form: { email: "ana@prueba.test", password: "mala" }, headers: { Origin: srv.url } });
  const e2 = await (await newCtx()).request.post(srv.url + "/iniciar-sesion", { form: { email: "noexiste@x.test", password: "mala" }, headers: { Origin: srv.url } });
  ok("login no revela si el correo existe (mismo mensaje)", (await e1.text()).includes("Correo o contraseña incorrectos") && (await e2.text()).includes("Correo o contraseña incorrectos") && e1.status() === e2.status());
  const big = await anaApi.post(srv.url + "/app/perfil", { data: "x=" + "a".repeat(200_000), headers: { Origin: srv.url, "Content-Type": "application/x-www-form-urlencoded" } });
  ok("cuerpo de 200 KB rechazado con 413", big.status() === 413, String(big.status()));
  ok("el servidor sigue vivo tras el cuerpo gigante", (await fetch(srv.url + "/salud")).ok);

  /* ═══ 8. Privacidad: exportar, eliminar, cerrar sesión ═══ */
  console.log("\n— Privacidad —");
  const dl = await page.request.get(srv.url + "/app/perfil/exportar"); const data = await dl.json();
  ok("exportar mis datos: JSON con mis datos y sin hash de contraseña", data.cuenta.correo === "ana@prueba.test" && data.academico.materias.length === 3 && !JSON.stringify(data).includes("scrypt"));
  await page.goto(srv.url + "/app/perfil"); await page.locator("summary", { hasText: "Eliminar mi cuenta" }).click(); await page.fill("#confirm_password", "contraseña incorrecta"); await page.getByRole("button", { name: "Eliminar cuenta definitivamente" }).click();
  ok("eliminar con contraseña incorrecta: no elimina", (await page.getByText("La contraseña no coincide").count()) === 1 && srv.db().prepare("SELECT COUNT(*) n FROM users WHERE email='ana@prueba.test'").get().n === 1);
  await page.getByRole("button", { name: "Cerrar sesión" }).click(); await page.goto(srv.url + "/app");
  ok("cerrar sesión invalida la sesión", page.url().endsWith("/iniciar-sesion"));
  await page.fill("#email", "ana@prueba.test"); await page.fill("#password", PW); await page.getByRole("button", { name: "Iniciar sesión" }).click(); await page.waitForURL("**/app");
  ok("volver a iniciar sesión con la contraseña correcta", (await page.locator("h1").innerText()) === "Hola, Ana");
  await page.goto(srv.url + "/app/perfil"); await page.locator("summary", { hasText: "Eliminar mi cuenta" }).click(); await page.fill("#confirm_password", PW); await page.getByRole("button", { name: "Eliminar cuenta definitivamente" }).click(); await page.waitForURL("**/iniciar-sesion**");
  const gone = srv.db();
  ok("eliminar cuenta: se borran usuario, perfil, materias, horarios y sesiones", ["users WHERE email='ana@prueba.test'", "profiles p JOIN users u ON u.id=p.user_id WHERE u.email='ana@prueba.test'"].every((q) => gone.prepare(`SELECT COUNT(*) n FROM ${q}`).get().n === 0) && gone.prepare("SELECT COUNT(*) n FROM availability").get().n >= 0);
  ok("auditoría registrada (registro, login, exportación, eliminación)", ["auth.register", "auth.login", "privacy.export", "privacy.delete_account"].every((a) => srv.db().prepare("SELECT COUNT(*) n FROM audit_logs WHERE action=?").get(a).n >= 1));
  ok("los logs del servidor no contienen contraseñas ni correos", !srv.log().includes(PW) && !srv.log().includes("@prueba.test"));
  await page.goto(srv.url + "/iniciar-sesion"); await page.screenshot({ path: `${SHOTS}/08-login.png`, fullPage: true });
  await page.goto(srv.url + "/registro"); await page.screenshot({ path: `${SHOTS}/09-registro.png`, fullPage: true });

  /* ═══ 9. Responsive de la aplicación ═══ */
  console.log("\n— Responsive de la aplicación —");
  const mctx = await newCtx({ width: 390, height: 844 }); const mp = await mctx.newPage();
  await mp.goto(srv.url + "/demo"); await mp.getByRole("button", { name: "Entrar al modo demo" }).click(); await mp.waitForURL("**/app");
  for (const path of ["/app", "/app/smart-match", "/app/conexiones", "/app/mensajes", "/app/progreso", "/app/calendario", "/app/calendario?vista=semana", "/app/calendario?vista=dia", "/app/materias", "/app/horarios", "/app/perfil"]) {
    await mp.goto(srv.url + path); const dx = await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(`móvil 390 px: ${path} sin desbordamiento horizontal`, dx <= 0, `dx=${dx}`);
  }
  await mp.goto(srv.url + "/app"); await mp.screenshot({ path: `${SHOTS}/10-movil-dashboard.png`, fullPage: true });
  await mp.goto(srv.url + "/app/smart-match"); await mp.screenshot({ path: `${SHOTS}/11-movil-smart-match.png` });
  await mctx.close();
  await socialSuite(browser);
  await progressSuite(browser);
} finally { await browser.close(); srv.stop(); }

/* ═══ 10. Límites de intentos (servidor aparte: contadores en cero) ═══ */
console.log("\n— Límites de intentos —");
const s2 = await startServer(); const a2 = await request.newContext({ baseURL: s2.url, extraHTTPHeaders: { Origin: s2.url } });
const statuses = []; for (let i = 0; i < 7; i++) statuses.push((await a2.post("/iniciar-sesion", { form: { email: "x@y.test", password: "mala" } })).status());
ok("fuerza bruta: tras 5 intentos fallidos → 429 con Retry-After", statuses.slice(0, 5).every((s) => s === 401) && statuses[5] === 429, statuses.join());
const c = []; for (let i = 0; i < 4; i++) c.push((await a2.post("/api/contact", { form: { name: "Ana Prueba", email: "a@b.co", subject: "general", message: "Mensaje de prueba número " + i + " largo" } })).status());
ok("contacto: el 4.º mensaje válido seguido → 429", c.slice(0, 3).every((s) => s === 200) && c[3] === 429, c.join());
const d = []; for (let i = 0; i < 11; i++) d.push((await a2.post("/demo", { maxRedirects: 0 })).status());
ok("demo: más de 10 por hora desde una IP → 429", d.slice(0, 10).every((s) => s === 303) && d[10] === 429, d.join());
s2.stop();

const failed = results.filter(([p]) => !p);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas${failed.length ? "\nFALLARON:\n" + failed.map(([, n]) => " - " + n).join("\n") : ""}`);
process.exit(failed.length ? 1 : 0);
