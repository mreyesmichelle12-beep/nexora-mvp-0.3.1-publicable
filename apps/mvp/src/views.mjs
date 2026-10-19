import { readFileSync } from "node:fs";
import { join } from "node:path";
import { html, raw, str, esc, field } from "./html.mjs";
import { MODALITIES, STUDY_STYLES, RELATIONS, LIMITS } from "./constants.mjs";
import { REPORT_REASONS, MESSAGE_MAX } from "./social.mjs";
import { DOW, MONTHS, KINDS, monthGrid, weekDays, addDays, addMonths, longDate, monthOf } from "./calendar.mjs";
import { DAYS, DAYS_SHORT, SLOT_STARTS, WEIGHTS, slotKey, slotLabel } from "../../../packages/match-engine/src/index.ts";

export const VERSION_LABEL = "MVP 0.3";
const BASE_HEAD = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0A2744"><link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" href="/brand/icon-192.png" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="/brand/icon-192.png"><link rel="stylesheet" href="/styles.css">`;
const SKIP = `<a href="#contenido" class="skip-link">Saltar al contenido</a>`;

/* ───── Plantillas del sitio público (encabezado y pie reales) para las páginas con formularios ───── */
export function makeShell(publicDir) {
  const cache = new Map();
  const tpl = (n) => { if (!cache.has(n)) cache.set(n, readFileSync(join(publicDir, "_shell", n), "utf8")); return cache.get(n); };
  return {
    page(route, title, content) { return tpl(`${route}.html`.replace(/^\//, "")).replace("<!--TITLE-->", esc(title)).replace("<!--CONTENT-->", () => str(content)); },
    notFound: () => tpl("404.html"),
    serverError: () => tpl("500.html"),
  };
}

const flashHtml = (f) => (f ? html`<p class="form-status form-status--${f.kind}" role="${f.kind === "error" ? "alert" : "status"}">${f.text}</p>` : "");

/* ───── Autenticación ───── */
export function loginPage({ email = "", error, notice } = {}) {
  return html`<section class="section"><div class="container auth">
    <h1>Iniciar sesión</h1>
    <p class="muted">Entra con tu cuenta de NEXORA. ¿Aún no tienes una? <a href="/registro">Crea tu cuenta</a> o <a href="/demo">prueba el modo demo</a>.</p>
    ${notice ? flashHtml({ kind: "ok", text: notice }) : ""}${error ? flashHtml({ kind: "error", text: error }) : ""}
    <form method="post" action="/iniciar-sesion" class="auth__form" novalidate>
      ${field({ id: "email", name: "email", label: "Correo", type: "email", value: email, required: true, attrs: { autocomplete: "email", inputmode: "email" } })}
      ${field({ id: "password", name: "password", label: "Contraseña", type: "password", required: true, attrs: { autocomplete: "current-password" } })}
      <div><button class="btn btn--primary btn--lg" type="submit">Iniciar sesión</button></div>
    </form></div></section>`;
}

export function registerPage({ values = {}, errors = {}, universities, careers, error } = {}) {
  const v = values;
  return html`<section class="section"><div class="container auth auth--wide">
    <h1>Crear cuenta de estudiante</h1>
    <p class="muted">Solo pedimos lo necesario para conectarte con compañeros. No pedimos tu edad exacta. ¿Ya tienes cuenta? <a href="/iniciar-sesion">Inicia sesión</a>. ¿Eres docente, mentor o conferencista? <a href="/registro-docente">Regístrate aquí</a>.</p>
    <p class="status-note"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span>MVP 0.1: la verificación de correo requiere un proveedor de correo que aún no está configurado, así que tu correo queda <strong>sin verificar</strong>. El registro de docentes y mentores llega en una fase posterior.</span></p>
    ${error ? flashHtml({ kind: "error", text: error }) : ""}
    <form method="post" action="/registro" class="auth__form" novalidate>
      <div class="form-grid">
        ${field({ id: "first_name", label: "Nombre", value: v.firstName, error: errors.first_name, required: true, attrs: { autocomplete: "given-name", maxlength: 80 } })}
        ${field({ id: "last_name", label: "Apellido", value: v.lastName, error: errors.last_name, required: true, attrs: { autocomplete: "family-name", maxlength: 80 } })}
      </div>
      ${field({ id: "email", label: "Correo", type: "email", value: v.email, error: errors.email, required: true, hint: "Usa tu correo institucional si tu universidad lo ofrece.", attrs: { autocomplete: "email", inputmode: "email" } })}
      ${field({ id: "password", label: "Contraseña", type: "password", error: errors.password, required: true, hint: "Mínimo 10 caracteres. Una frase corta funciona mejor que símbolos sueltos.", attrs: { autocomplete: "new-password", minlength: 10, maxlength: 128 } })}
      ${field({ id: "university", label: "Universidad", value: v.uniId, error: errors.university, required: true, options: [{ value: "", label: "Elige una universidad" }, ...universities.map((u) => ({ value: u.id, label: u.name }))] })}
      ${field({ id: "career", label: "Carrera", value: v.careerName, error: errors.career, required: true, list: "careers", hint: "Escríbela o elige una existente.", attrs: { maxlength: 120 } })}
      <datalist id="careers">${careers.map((c) => html`<option value="${c}"></option>`)}</datalist>
      <div class="form-grid">
        ${field({ id: "cycle", label: "Ciclo o nivel", type: "number", value: v.cycle || "", error: errors.cycle, required: true, attrs: { min: 1, max: 15, inputmode: "numeric" } })}
        ${field({ id: "modality", label: "Modalidad de estudio preferida", value: v.modality, error: errors.modality, required: true, options: [{ value: "", label: "Elige una modalidad" }, ...Object.entries(MODALITIES).map(([value, label]) => ({ value, label }))] })}
      </div>
      <div class="check-field ${errors.terms ? "check-field--error" : ""}">
        <label><input type="checkbox" name="terms" ${v.terms ? raw("checked") : ""} ${errors.terms ? raw('aria-invalid="true" aria-describedby="terms-err"') : ""}> Acepto los <a href="/terminos" target="_blank" rel="noopener">Términos</a> y la <a href="/privacidad" target="_blank" rel="noopener">Política de privacidad</a> (borradores pendientes de revisión legal).</label>
        ${errors.terms ? html`<p id="terms-err" class="field__error"><span>${errors.terms}</span></p>` : ""}
      </div>
      <div><button class="btn btn--primary btn--lg" type="submit">Crear cuenta</button></div>
    </form></div></section>`;
}

export function demoPage({ enabled, error }) {
  return html`<section class="section"><div class="container auth">
    <h1>Probar NEXORA</h1>
    <p class="muted">Explora la experiencia sin crear una cuenta. Entrarás con un perfil de estudiante de ejemplo y compañeros ficticios.</p>
    <ul class="checklist"><li>${tick}<span>Todos los datos son <strong>ficticios</strong> y están marcados como demo.</span></li><li>${tick}<span>Los perfiles demo nunca se mezclan con usuarios reales.</span></li><li>${tick}<span>Puedes editar tus materias y horarios y ver cómo cambia Smart Match.</span></li><li>${tick}<span>La sesión demo se elimina automáticamente a las 24 horas.</span></li></ul>
    ${error ? flashHtml({ kind: "error", text: error }) : ""}
    ${enabled ? html`<form method="post" action="/demo"><button class="btn btn--primary btn--lg" type="submit">Entrar al modo demo</button></form>` : html`<p class="status-note"><span>El modo demo está desactivado en este servidor.</span></p>`}
  </div></section>`;
}
const tick = raw(`<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 5 5L20 7"/></svg>`);

/* ───── Aplicación ───── */
const NAV = [["/app", "Inicio"], ["/app/smart-match", "Smart Match"], ["/app/conexiones", "Conexiones"], ["/app/mensajes", "Mensajes"], ["/app/calendario", "Calendario"], ["/app/progreso", "Progreso"], ["/app/materias", "Materias"], ["/app/horarios", "Horarios"], ["/app/perfil", "Perfil"]];
const SOON = ["Study Rooms", "Biblioteca", "NEXORA AI"];

export function appLayout({ title, bundle, active, body, flash, counts = {}, nav = NAV, soon = SOON, home = "/app", tag = VERSION_LABEL, admin = false }) {
  const demo = !!bundle.user.is_demo;
  const badge = { "/app/conexiones": counts.requests, "/app/mensajes": counts.messages, "/admin/reportes": counts.reports, "/admin/verificaciones": counts.verifs, "/admin/contacto": counts.contact };
  const items = admin ? [...nav, ["/admin", "Administración"]] : nav;
  const isActive = (href) => href === active || (active?.startsWith(href + "/") && href !== home && href !== "/app" && href !== "/admin");
  const navLinks = items.map(([href, label]) => html`<a href="${href}" ${isActive(href) ? raw('aria-current="page"') : ""}>${label}${badge[href] ? html` <span class="count" aria-label="${badge[href]} pendientes">${badge[href]}</span>` : ""}</a>`);
  return html`<!doctype html><html lang="es" data-mode="app"><head>${raw(BASE_HEAD)}<title>${title} · NEXORA</title><meta name="robots" content="noindex, nofollow"></head><body class="app">${raw(SKIP)}
${demo ? html`<div role="note" class="demo-banner"><span>MODO DEMO — Datos ficticios</span><form method="post" action="/salir" style="display:inline"><button class="btn btn--sm btn--secondary" type="submit">Salir del demo</button></form></div>` : ""}
<header class="app-top"><div class="container app-top__bar">
  <a href="${home}" class="app-brand" aria-label="NEXORA, ir al inicio"><img src="/brand/nexora-mark.png" alt="" width="40" height="26"><span>NEXORA</span><span class="badge">${tag}</span></a>
  <div class="app-user"><span class="app-user__name">${bundle.profile.first_name}</span>${demo ? "" : html`<form method="post" action="/salir"><button class="btn btn--ghost btn--sm" type="submit">Cerrar sesión</button></form>`}</div>
</div></header>
<div class="container app-body">
  <nav class="app-nav app-nav--side" aria-label="Navegación">${navLinks}${soon.length ? html`<p class="app-nav__soon-title">Próximamente</p>${soon.map((x) => html`<span class="app-nav__soon" aria-disabled="true">${x}</span>`)}` : ""}</nav>
  <nav class="app-nav app-nav--tabs" aria-label="Navegación (móvil)">${navLinks}</nav>
  <main id="contenido" tabindex="-1" class="app-main">${flashHtml(flash)}${body}</main>
</div></body></html>`;
}

const pct = (n) => `${Math.round(n)}`;

const nextField = (next) => html`<input type="hidden" name="next" value="${next}">`;
export function connectAction(m, next) {
  const st = m.rel?.state ?? "none";
  if (st === "connected") return html`<p><a class="btn btn--primary btn--sm" href="/app/mensajes/con/${m.id}">Enviar mensaje</a> <span class="badge badge--ok">Conectados</span></p>`;
  if (st === "sent") return html`<p><button class="btn btn--secondary btn--sm" type="button" disabled aria-disabled="true">Solicitud enviada</button></p>`;
  const act = st === "received" ? "request" : "request"; // 'Conectar' acepta si la otra persona ya había pedido
  return html`<form method="post" action="/app/conexiones"><input type="hidden" name="action" value="${act}"><input type="hidden" name="user_id" value="${m.id}">${nextField(next)}<button class="btn btn--primary btn--sm" type="submit">${st === "received" ? "Aceptar solicitud" : "Conectar"}</button>${st === "received" ? html` <span class="muted">Esta persona te envió una solicitud.</span>` : ""}</form>`;
}
export function matchCard(m, names, next = "/app/smart-match") {
  const nm = (ids) => ids.map((id) => names.get(id) ?? "—");
  const subj = nm(m.sharedSubjects);
  return html`<li class="match">
    <div class="match__head"><span class="match__avatar" aria-hidden="true">${m.first[0]}</span>
      <div class="match__who"><h3>${m.first} ${m.last[0]}.</h3><p class="muted">${m.career} · ciclo ${m.cycle}</p></div>
      <div class="match__score" aria-label="Compatibilidad estimada: ${m.score} por ciento"><strong>${m.score}%</strong><span>Compatibilidad estimada</span></div></div>
    ${m.isDemo ? html`<p><span class="badge badge--warn">Perfil de demostración · datos ficticios</span></p>` : ""}
    <div class="match__bar" aria-hidden="true"><span style="width:${m.score}%"></span></div>
    <dl class="match__facts">
      <div><dt>Materias en común</dt><dd>${subj.length ? subj.join(" · ") : "Ninguna"}</dd></div>
      ${m.canHelpYou.length ? html`<div><dt>Puede apoyarte en</dt><dd>${nm(m.canHelpYou).join(" · ")}</dd></div>` : ""}
      ${m.youCanHelp.length ? html`<div><dt>Puedes apoyar en</dt><dd>${nm(m.youCanHelp).join(" · ")}</dd></div>` : ""}
      <div><dt>Horarios en común</dt><dd>${m.sharedSlots.length ? m.sharedSlots.slice(0, 6).map(slotLabel).join(" · ") + (m.sharedSlots.length > 6 ? ` · +${m.sharedSlots.length - 6} más` : "") : "Ninguno"}</dd></div>
      <div><dt>Modalidad</dt><dd>${MODALITIES[m.modality] ?? "—"}</dd></div>
    </dl>
    <details class="match__why"><summary>Cómo se calculó</summary>
      <ul class="weights" aria-label="Aporte de cada factor">${m.breakdown.map((f) => html`<li><span>${FACTOR[f.key]}</span><span class="weights__bar" aria-hidden="true"><span style="width:${f.ratio == null ? 0 : f.ratio * 100}%"></span></span><span class="weights__pct">${f.ratio == null ? "n/d" : pct(f.ratio * 100) + "%"}</span></li>`)}</ul>
      <p class="muted">Se evaluó el ${m.evaluatedWeight}% del peso total (los factores sin datos de ambas personas se excluyen). Es un algoritmo ponderado, no inteligencia artificial.</p></details>
    ${connectAction(m, next)}
  </li>`;
}
const FACTOR = { subjects: `Materias (${WEIGHTS.subjects}%)`, schedule: `Horarios (${WEIGHTS.schedule}%)`, interests: `Intereses (${WEIGHTS.interests}%)`, studyStyles: `Preferencias (${WEIGHTS.studyStyles}%)`, skills: `Habilidades (${WEIGHTS.skills}%) · aún no disponible`, modality: `Modalidad (${WEIGHTS.modality}%)` };

export function dashboardBody({ bundle, matches, names, counts = {}, snap = null }) {
  const { profile, student, subjects, slots } = bundle;
  const steps = [["Completar tu perfil", !!(profile.interests.length || profile.study_styles.length), "/app/perfil"], ["Elegir tus materias", subjects.length > 0, "/app/materias"], ["Indicar tus horarios", slots.length > 0, "/app/horarios"]];
  const done = steps.filter((s) => s[1]).length;
  return html`<h1>Hola, ${profile.first_name}</h1>
  <p class="muted">${student.career} · ${student.university} · ciclo ${student.cycle}</p>
  ${bundle.user.is_demo ? "" : html`<p class="status-note"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span>Tu correo está <strong>sin verificar</strong>: la verificación requiere un proveedor de correo pendiente de configurar.</span></p>`}
  <section aria-labelledby="stats-t" class="app-section"><h2 id="stats-t" class="sr-only">Resumen</h2>
    <ul class="stats stats--app">
      <li class="stat"><span class="stat__value">${subjects.length}</span><span class="stat__label">materias</span></li>
      <li class="stat"><span class="stat__value">${slots.length}</span><span class="stat__label">bloques horarios disponibles</span></li>
      <li class="stat"><span class="stat__value">${matches.length}</span><span class="stat__label">${matches.length === 1 ? "coincidencia" : "coincidencias"} de Smart Match</span></li>
      <li class="stat"><span class="stat__value">${matches[0] ? matches[0].score + "%" : "—"}</span><span class="stat__label">mejor compatibilidad estimada</span></li>
    </ul></section>
  ${counts.requests || counts.messages ? html`<section aria-labelledby="act-t" class="app-section card"><h2 id="act-t">Pendiente para ti</h2><ul class="checklist">${counts.requests ? html`<li>${tick}<span><a href="/app/conexiones"><strong>${counts.requests}</strong> ${counts.requests === 1 ? "solicitud de conexión" : "solicitudes de conexión"}</a> por responder</span></li>` : ""}${counts.messages ? html`<li>${tick}<span><a href="/app/mensajes"><strong>${counts.messages}</strong> ${counts.messages === 1 ? "mensaje sin leer" : "mensajes sin leer"}</a></span></li>` : ""}</ul></section>` : ""}
  ${snap ? html`<section aria-labelledby="prog-t" class="app-section card"><div class="app-section__head"><h2 id="prog-t">Tu constancia</h2><a href="/app/progreso">Ver progreso</a></div>
    <ul class="snap">${snap.streak != null ? html`<li><strong>${snap.streak}</strong> ${snap.streak === 1 ? "día" : "días"} de racha</li>` : ""}<li><strong>${snap.weekMin}</strong> min estudiados esta semana</li><li>${snap.next ? html`Próximo evento: <a href="/app/calendario?vista=dia&fecha=${snap.next.key}"><strong>${snap.next.title}</strong></a> · ${snap.next.when}` : "Sin eventos próximos en tu calendario"}</li></ul></section>` : ""}
  <section aria-labelledby="pasos-t" class="app-section card"><h2 id="pasos-t">Tu avance (${done} de ${steps.length})</h2>
    <ul class="checklist">${steps.map(([label, ok, href]) => html`<li>${ok ? tick : raw('<span class="todo" aria-hidden="true"></span>')}<span>${ok ? html`${label} <span class="badge badge--ok">Listo</span>` : html`<a href="${href}">${label}</a>`}</span></li>`)}</ul></section>
  <section aria-labelledby="top-t" class="app-section"><div class="app-section__head"><h2 id="top-t">Tus mejores coincidencias</h2><a href="/app/smart-match">Ver todas</a></div>
    ${matches.length ? html`<ul class="matches">${matches.slice(0, 3).map((m) => matchCard(m, names))}</ul>` : html`<div class="state"><h3>Aún no hay coincidencias</h3><p>${subjects.length || slots.length ? "Todavía no hay otros estudiantes con materias u horarios en común." : "Agrega tus materias y horarios para que Smart Match pueda compararte con otros estudiantes."}</p></div>`}</section>
  <section aria-labelledby="soon-t" class="app-section"><h2 id="soon-t">Lo que viene</h2><p class="muted">Estas funciones forman parte de NEXORA pero todavía <strong>no están disponibles</strong> en el MVP 0.3.</p>
    <ul class="soon-grid">${SOON.map((s) => html`<li><span class="badge">Próximamente</span><strong>${s}</strong></li>`)}</ul></section>`;
}

export function smartMatchBody({ bundle, matches, names }) {
  const none = !bundle.subjects.length && !bundle.slots.length;
  return html`<h1>Smart Match</h1>
  <p class="muted">Estudiantes de tu universidad que coinciden contigo en materias y horarios${bundle.user.is_demo ? " (todos ficticios)" : ""}. La compatibilidad es una <strong>estimación</strong> calculada con un algoritmo ponderado; no es inteligencia artificial.</p>
  ${none ? html`<div class="state"><h3>Primero cuéntanos qué cursas y cuándo puedes estudiar</h3><p>Smart Match compara materias y horarios reales. Agrégalos para ver coincidencias.</p><div class="actions"><a class="btn btn--primary" href="/app/materias">Elegir materias</a><a class="btn btn--secondary" href="/app/horarios">Indicar horarios</a></div></div>`
    : matches.length ? html`<p aria-live="polite"><strong>${matches.length}</strong> ${matches.length === 1 ? "coincidencia" : "coincidencias"}, de mayor a menor compatibilidad.</p><ul class="matches">${matches.map((m) => matchCard(m, names))}</ul>`
    : html`<div class="state"><h3>Aún no hay coincidencias</h3><p>${bundle.user.is_demo ? "Prueba agregar más materias u horarios." : "Todavía no hay otros estudiantes registrados con materias u horarios en común. Invita a tus compañeros o prueba el modo demo para ver cómo se vería."}</p></div>`}
  <details class="app-section card"><summary>Cómo funciona Smart Match</summary>
    <ul class="weights" aria-label="Peso de cada factor">${Object.entries(WEIGHTS).map(([k, w]) => html`<li><span>${FACTOR[k].replace(/ \(\d+%\)/, "")}</span><span class="weights__bar" aria-hidden="true"><span style="width:${w}%"></span></span><span class="weights__pct">${w}%</span></li>`)}</ul>
    <p class="muted">Se exige al menos una materia o un bloque horario en común. Los factores sin datos de ambas personas se excluyen y el puntaje se normaliza sobre los pesos evaluados. Habilidades aún no existen en el MVP.</p></details>`;
}

export function materiasBody({ bundle, suggestions, error, values = {} }) {
  const mine = bundle.subjects;
  return html`<h1>Materias</h1>
  <p class="muted">Indica lo que cursas y lo que se te dificulta. Smart Match usa estos datos para encontrar a quien comparte tus materias y a quien puede apoyarte (hasta ${LIMITS.subjectsPerUser}).</p>
  <section class="card app-section" aria-labelledby="add-t"><h2 id="add-t">Agregar materia</h2>
    <form method="post" action="/app/materias" class="subject-form" novalidate>
      <input type="hidden" name="action" value="add">
      ${field({ id: "name", label: "Nombre de la materia", value: values.name, error, required: true, list: "subjects", hint: "Si ya existe en tu universidad, elígela de la lista para coincidir con otros estudiantes.", attrs: { maxlength: 80, autocomplete: "off" } })}
      <datalist id="subjects">${suggestions.map((s) => html`<option value="${s}"></option>`)}</datalist>
      ${field({ id: "relation", label: "¿Cómo te va?", value: values.relation || "ENROLLED", required: true, options: Object.entries(RELATIONS).map(([value, label]) => ({ value, label })) })}
      <div><button class="btn btn--primary" type="submit">Agregar</button></div>
    </form></section>
  <section aria-labelledby="mine-t" class="app-section"><h2 id="mine-t">Tus materias (${mine.length})</h2>
    ${mine.length ? html`<ul class="subject-list">${mine.map((s) => html`<li><span class="subject-list__name">${s.name}</span><span class="badge ${s.relation === "STRUGGLING" ? "badge--warn" : "badge--ok"}">${RELATIONS[s.relation]}</span>
      <form method="post" action="/app/materias"><input type="hidden" name="subject_id" value="${s.id}"><input type="hidden" name="action" value="${s.relation === "STRUGGLING" ? "enrolled" : "struggling"}"><button class="btn btn--ghost btn--sm" type="submit">${s.relation === "STRUGGLING" ? "Ya no se me dificulta" : "Marcar como difícil"}</button></form>
      <form method="post" action="/app/materias"><input type="hidden" name="subject_id" value="${s.id}"><input type="hidden" name="action" value="remove"><button class="btn btn--ghost btn--sm" type="submit" aria-label="Quitar ${s.name}">Quitar</button></form></li>`)}</ul>`
      : html`<div class="state"><h3>Aún no agregaste materias</h3><p>Empieza con las que cursas este ciclo.</p></div>`}</section>`;
}

export function horariosBody({ bundle }) {
  const set = new Set(bundle.slots);
  return html`<h1>Horarios disponibles</h1>
  <p class="muted">Marca los bloques de 2 horas en los que podrías estudiar con otras personas. Coincidir en tiempo es la base de Smart Match. Seleccionados: <strong>${bundle.slots.length}</strong>.</p>
  <form method="post" action="/app/horarios" class="card app-section">
    <div class="table-wrap" role="region" aria-label="Disponibilidad semanal (desplazable)" tabindex="0"><table class="slots"><caption class="sr-only">Bloques de estudio por día y hora</caption>
      <thead><tr><th scope="col"><span class="sr-only">Hora</span></th>${DAYS_SHORT.map((d, i) => html`<th scope="col" abbr="${DAYS[i]}">${d}</th>`)}</tr></thead>
      <tbody>${SLOT_STARTS.map((s) => html`<tr><th scope="row">${s}:00–${s + 2}:00</th>${DAYS.map((d, i) => { const k = slotKey(i, s); return html`<td><label class="slot"><input type="checkbox" name="slot" value="${k}" ${set.has(k) ? raw("checked") : ""}><span class="sr-only">${d} ${s}:00 a ${s + 2}:00</span></label></td>`; })}</tr>`)}</tbody></table></div>
    <div class="actions"><button class="btn btn--primary" type="submit">Guardar horarios</button></div></form>`;
}

export function perfilBody({ bundle, errors = {}, values, universities }) {
  const p = bundle.profile, s = bundle.student, v = values ?? { firstName: p.first_name, lastName: p.last_name, bio: p.bio ?? "", careerName: s.career, cycle: s.cycle, modality: p.modality, interests: p.interests, studyStyles: p.study_styles, discoverable: !!p.discoverable };
  const demo = !!bundle.user.is_demo;
  return html`<h1>Perfil</h1>
  <p class="muted">${s.university}${demo ? " · perfil de demostración" : ""}. Tu correo (${bundle.user.is_demo ? "ficticio" : bundle.user.email}) no es visible para otras personas.</p>
  <form method="post" action="/app/perfil" class="card app-section auth__form" novalidate>
    <div class="form-grid">
      ${field({ id: "first_name", label: "Nombre", value: v.firstName, error: errors.first_name, required: true, attrs: { maxlength: 80 } })}
      ${field({ id: "last_name", label: "Apellido", value: v.lastName, error: errors.last_name, required: true, attrs: { maxlength: 80 } })}
    </div>
    ${field({ id: "bio", label: "Biografía breve", type: "textarea", value: v.bio, hint: "Hasta 400 caracteres." , attrs: { maxlength: 400, rows: 3 } })}
    <div class="form-grid">
      ${field({ id: "career", label: "Carrera", value: v.careerName, error: errors.career, required: true, attrs: { maxlength: 120 } })}
      ${field({ id: "cycle", label: "Ciclo o nivel", type: "number", value: v.cycle, error: errors.cycle, required: true, attrs: { min: 1, max: 15 } })}
    </div>
    ${field({ id: "modality", label: "Modalidad preferida", value: v.modality, error: errors.modality, required: true, options: Object.entries(MODALITIES).map(([value, label]) => ({ value, label })) })}
    ${field({ id: "interests", label: "Intereses", value: v.interests.join(", "), hint: "Separados por comas (máximo 10). Ejemplo: IA, desarrollo web, datos." , attrs: { maxlength: 400 } })}
    <fieldset class="fieldset"><legend>Preferencias de estudio</legend><div class="check-grid">${Object.entries(STUDY_STYLES).map(([k, label]) => html`<label><input type="checkbox" name="study_style" value="${k}" ${v.studyStyles.includes(k) ? raw("checked") : ""}> ${label}</label>`)}</div></fieldset>
    <fieldset class="fieldset"><legend>Privacidad</legend><label class="check-line"><input type="checkbox" name="discoverable" ${v.discoverable ? raw("checked") : ""}> Aparecer en las coincidencias de Smart Match de otros estudiantes</label></fieldset>
    <div><button class="btn btn--primary" type="submit">Guardar perfil</button></div>
  </form>
  ${demo ? "" : html`<section class="card app-section" aria-labelledby="datos-t"><h2 id="datos-t">Tus datos</h2>
    <p class="muted">Puedes descargar una copia de tus datos o eliminar tu cuenta de forma permanente.</p>
    <div class="actions"><a class="btn btn--secondary" href="/app/perfil/exportar" download>Descargar mis datos (JSON)</a></div>
    <details class="danger-zone"><summary>Eliminar mi cuenta</summary>
      <form method="post" action="/app/perfil/eliminar" class="auth__form">
        <p>Se borrarán tu perfil, materias, horarios y sesiones. Esta acción no se puede deshacer.</p>
        ${field({ id: "confirm_password", name: "password", label: "Confirma tu contraseña", type: "password", required: true, attrs: { autocomplete: "current-password" } })}
        <div><button class="btn btn--danger" type="submit">Eliminar cuenta definitivamente</button></div></form></details></section>`}`;
}

/* ───── Conexiones y mensajería ───── */
const TZ = "America/El_Salvador";
const dtf = new Intl.DateTimeFormat("es-SV", { dateStyle: "short", timeStyle: "short", timeZone: TZ });
export const fmtTime = (ms) => dtf.format(new Date(ms));
const initial = (n) => String(n ?? "?")[0];

function actionForm(action, userId, label, { next = "/app/conexiones", variant = "ghost", aria } = {}) {
  return html`<form method="post" action="/app/conexiones" class="inline-form"><input type="hidden" name="action" value="${action}"><input type="hidden" name="user_id" value="${userId}">${nextField(next)}<button class="btn btn--${variant} btn--sm" type="submit" ${aria ? raw(`aria-label="${esc(aria)}"`) : ""}>${label}</button></form>`;
}
export function reportForm(userId, name, next = "/app/conexiones") {
  return html`<details class="report"><summary>Reportar</summary>
    <form method="post" action="/app/reportar" class="report__form"><input type="hidden" name="user_id" value="${userId}">${nextField(next)}
      ${field({ id: `reason-${userId}`, name: "reason", label: `Motivo del reporte sobre ${name}`, required: true, options: Object.entries(REPORT_REASONS).map(([value, label]) => ({ value, label })) })}
      ${field({ id: `details-${userId}`, name: "details", label: "Detalles", type: "textarea", attrs: { maxlength: 500, rows: 2 } })}
      <div><button class="btn btn--danger btn--sm" type="submit">Enviar reporte</button></div></form></details>`;
}
const person = (r, extra) => html`<li class="conn">
  <span class="match__avatar" aria-hidden="true">${initial(r.first_name)}</span>
  <div class="conn__who"><h3>${r.first_name} ${r.last_name[0]}.</h3><p class="muted">${r.career} · ciclo ${r.cycle}${r.is_demo ? html` · <span class="badge badge--warn">Demostración</span>` : ""}</p></div>
  <div class="conn__actions">${extra}</div></li>`;

export function conexionesBody({ rows, blocked, me }) {
  const incoming = rows.filter((r) => r.status === "PENDING" && r.requester_id !== me);
  const outgoing = rows.filter((r) => r.requester_id === me && r.status !== "ACCEPTED"); // los rechazados se muestran como enviadas
  const connected = rows.filter((r) => r.status === "ACCEPTED");
  const empty = (t) => html`<p class="muted">${t}</p>`;
  return html`<h1>Conexiones</h1>
  <p class="muted">Tu red académica. Las conexiones son para estudiar juntos: solo quienes están conectados pueden escribirse.</p>
  <section class="app-section" aria-labelledby="in-t"><h2 id="in-t">Solicitudes recibidas (${incoming.length})</h2>
    ${incoming.length ? html`<ul class="conn-list">${incoming.map((r) => person(r, html`${actionForm("accept", r.other_id, "Aceptar", { variant: "primary", aria: `Aceptar solicitud de ${r.first_name}` })}${actionForm("decline", r.other_id, "Rechazar", { variant: "secondary", aria: `Rechazar solicitud de ${r.first_name}` })}`))}</ul>` : empty("No tienes solicitudes pendientes.")}</section>
  <section class="app-section" aria-labelledby="out-t"><h2 id="out-t">Solicitudes enviadas (${outgoing.length})</h2>
    ${outgoing.length ? html`<ul class="conn-list">${outgoing.map((r) => person(r, actionForm("cancel", r.other_id, "Cancelar solicitud", { variant: "secondary", aria: `Cancelar solicitud a ${r.first_name}` })))}</ul>` : empty("No hay solicitudes enviadas. Busca personas en Smart Match.")}</section>
  <section class="app-section" aria-labelledby="ok-t"><h2 id="ok-t">Mis conexiones (${connected.length})</h2>
    ${connected.length ? html`<ul class="conn-list">${connected.map((r) => html`${person(r, html`<a class="btn btn--primary btn--sm" href="/app/mensajes/con/${r.other_id}">Mensaje</a>${actionForm("remove", r.other_id, "Eliminar conexión", { aria: `Eliminar conexión con ${r.first_name}` })}${actionForm("block", r.other_id, "Bloquear", { aria: `Bloquear a ${r.first_name}` })}`)}<li class="conn-report">${reportForm(r.other_id, r.first_name)}</li>`)}</ul>` : html`<div class="state"><h3>Aún no tienes conexiones</h3><p>Encuentra compañeros compatibles en Smart Match y envíales una solicitud.</p><a class="btn btn--primary" href="/app/smart-match">Ir a Smart Match</a></div>`}</section>
  ${blocked.length ? html`<section class="app-section" aria-labelledby="bl-t"><h2 id="bl-t">Personas bloqueadas (${blocked.length})</h2><ul class="conn-list">${blocked.map((b) => html`<li class="conn"><span class="match__avatar" aria-hidden="true">${initial(b.first_name)}</span><div class="conn__who"><h3>${b.first_name} ${b.last_name[0]}.</h3></div><div class="conn__actions">${actionForm("unblock", b.id, "Desbloquear", { variant: "secondary", aria: `Desbloquear a ${b.first_name}` })}</div></li>`)}</ul></section>` : ""}`;
}

export function mensajesBody({ inbox, active, messages = [], me, otherRead = 0, error }) {
  const list = html`<nav class="inbox__list" aria-label="Conversaciones">${inbox.length ? html`<ul>${inbox.map((c) => html`<li><a href="/app/mensajes/${c.id}" class="inbox__item" ${active?.id === c.id ? raw('aria-current="true"') : ""}>
      <span class="match__avatar" aria-hidden="true">${initial(c.first_name)}</span>
      <span class="inbox__txt"><strong>${c.first_name} ${c.last_name[0]}.</strong><span class="inbox__prev">${c.last_body ? c.last_body.replace(/\s+/g, " ").slice(0, 60) : "Sin mensajes todavía"}</span></span>
      <span class="inbox__meta">${c.last_at ? fmtTime(c.last_at) : ""}${c.unread ? html`<span class="count" aria-label="${c.unread} sin leer">${c.unread}</span>` : ""}</span></a></li>`)}</ul>` : html`<div class="state"><h3>Aún no tienes conversaciones</h3><p>Cuando aceptes una conexión podrás escribirle desde aquí.</p><a class="btn btn--secondary" href="/app/conexiones">Ver conexiones</a></div>`}</nav>`;
  const lastMine = [...messages].reverse().find((m) => m.sender_id === me);
  const thread = active ? html`<section class="thread" aria-labelledby="th-t">
      <header class="thread__head"><a class="thread__back" href="/app/mensajes">‹ Conversaciones</a><h2 id="th-t">${active.first_name} ${active.last_name}</h2>
        <div class="thread__tools"><a href="/app/mensajes/${active.id}">Actualizar</a>${reportForm(active.other_id, active.first_name, "/app/mensajes")}</div></header>
      ${active.is_demo ? html`<p class="status-note"><span>Conversación con un perfil de <strong>demostración</strong>: los perfiles ficticios no responden.</span></p>` : ""}
      <p class="muted thread__note">Los mensajes no se actualizan solos todavía (llegará con el servicio en tiempo real): usa “Actualizar”.</p>
      <ol class="thread__msgs" aria-live="off">${messages.length ? messages.map((m) => html`<li class="msg ${m.sender_id === me ? "msg--me" : "msg--them"}"><p class="msg__body">${m.body}</p><span class="msg__meta">${m.sender_id === me ? "Tú" : active.first_name} · ${fmtTime(m.created_at)}${m.id === lastMine?.id && otherRead >= m.created_at ? " · Visto" : ""}</span></li>`) : html`<li class="state"><p>Escribe el primer mensaje.</p></li>`}</ol>
      ${error ? flashHtml({ kind: "error", text: error }) : ""}
      <form method="post" action="/app/mensajes/${active.id}" class="composer"><label class="sr-only" for="body">Mensaje para ${active.first_name}</label>
        <textarea id="body" name="body" class="field__control" rows="2" maxlength="${MESSAGE_MAX}" required placeholder="Escribe un mensaje…"></textarea>
        <button class="btn btn--primary" type="submit">Enviar</button></form></section>`
    : html`<div class="state inbox__empty"><h3>Elige una conversación</h3><p>Selecciona una conexión de la lista para ver y enviar mensajes.</p></div>`;
  return html`<h1>Mensajes</h1><div class="inbox ${active ? "inbox--thread" : ""}">${list}${thread}</div>`;
}

/* ───── Progreso, temporizador y calendario ───── */
export function progresoBody({ bundle, week, streak, totals, weekTotal, goals, recent, subjects }) {
  const showStreak = !!bundle.profile.show_streak, max = Math.max(60, ...week.map((d) => d.minutes));
  const active = goals.filter((g) => g.status === "ACTIVE"), done = goals.filter((g) => g.status === "DONE");
  const goalOpts = [{ value: "", label: "Sin objetivo" }, ...active.map((g) => ({ value: g.id, label: g.title }))];
  return html`<h1>Progreso</h1>
  <p class="muted">Tus sesiones de estudio y objetivos. El tiempo es <strong>autodeclarado</strong>: lo registras tú con el temporizador. Sin presión: la racha es opcional.</p>
  <ul class="stats stats--app">
    ${showStreak ? html`<li class="stat"><span class="stat__value">${streak}</span><span class="stat__label">${streak === 1 ? "día" : "días"} de racha</span></li>` : ""}
    <li class="stat"><span class="stat__value">${weekTotal}</span><span class="stat__label">min esta semana</span></li>
    <li class="stat"><span class="stat__value">${totals.n}</span><span class="stat__label">${totals.n === 1 ? "sesión completada" : "sesiones completadas"}</span></li>
    <li class="stat"><span class="stat__value">${done.length}/${goals.length}</span><span class="stat__label">objetivos cumplidos</span></li>
  </ul>

  <section class="card app-section" aria-labelledby="tm-t"><h2 id="tm-t">Temporizador de estudio</h2>
    <div id="timer" class="timer" data-state="idle">
      <p class="timer__display" data-display role="timer" aria-label="Tiempo restante">25:00</p>
      <fieldset class="fieldset timer__presets"><legend>Duración</legend>
        <label class="check-line"><input type="radio" name="preset" value="25" checked> 25 minutos</label>
        <label class="check-line"><input type="radio" name="preset" value="50"> 50 minutos</label>
        <label class="check-line"><input type="radio" name="preset" value="custom"> Personalizado <input type="number" data-custom min="1" max="180" value="30" class="field__control timer__custom" aria-label="Minutos personalizados (1 a 180)"> min</label></fieldset>
      <div class="field"><label class="field__label" for="timer-goal">Objetivo al que dedicas la sesión<span class="field__opt">(opcional)</span></label>
        <select id="timer-goal" data-goal class="field__control">${goalOpts.map((o) => html`<option value="${o.value}">${o.label}</option>`)}</select></div>
      <div class="actions"><button class="btn btn--primary" type="button" data-start>Iniciar</button><button class="btn btn--secondary" type="button" data-pause hidden>Pausar</button><button class="btn btn--ghost" type="button" data-reset>Reiniciar</button><button class="btn btn--secondary" type="button" data-save hidden>Guardar sesión</button></div>
      <p class="timer__msg" data-msg role="status" aria-live="polite"></p>
      <noscript><p class="status-note"><span>El temporizador necesita JavaScript. Puedes registrar tu sesión manualmente abajo.</span></p></noscript>
    </div>
    <details class="manual"><summary>Registrar una sesión manualmente</summary>
      <form method="post" action="/app/progreso/sesiones" class="subject-form">
        ${field({ id: "man-min", name: "minutes", label: "Minutos estudiados", type: "number", required: true, attrs: { min: 1, max: 180 } })}
        ${field({ id: "man-goal", name: "goal_id", label: "Objetivo", options: goalOpts })}
        <div><button class="btn btn--primary" type="submit">Guardar sesión</button></div></form></details>
    <script src="/app-assets/timer.js" defer></script></section>

  <section class="app-section card" aria-labelledby="wk-t"><h2 id="wk-t">Esta semana</h2>
    <ul class="week-bars" aria-label="Minutos de estudio por día, de lunes a domingo">${week.map((d, i) => html`<li ${d.today ? raw('aria-current="date"') : ""}><span class="week-bars__val">${d.minutes}</span><span class="week-bars__bar" aria-hidden="true"><span style="height:${Math.round((d.minutes / max) * 100)}%"></span></span><span class="week-bars__day">${DOW[i]}</span></li>`)}</ul></section>

  <section class="app-section" aria-labelledby="go-t"><h2 id="go-t">Objetivos</h2>
    <form method="post" action="/app/progreso" class="card subject-form"><input type="hidden" name="action" value="goal_add">
      ${field({ id: "goal-title", name: "title", label: "Nuevo objetivo", required: true, attrs: { maxlength: 120, placeholder: "Ej.: terminar la guía 3" } })}
      ${field({ id: "goal-subject", name: "subject_id", label: "Materia", options: [{ value: "", label: "Sin materia" }, ...subjects.map((x) => ({ value: x.id, label: x.name }))] })}
      ${field({ id: "goal-date", name: "target_date", label: "Fecha objetivo", type: "date" })}
      <div><button class="btn btn--primary" type="submit">Agregar objetivo</button></div></form>
    ${goals.length ? html`<ul class="subject-list">${goals.map((g) => html`<li><span class="subject-list__name ${g.status === "DONE" ? "is-done" : ""}">${g.title}${g.subject ? html` <span class="muted">· ${g.subject}</span>` : ""}${g.target_date ? html` <span class="muted">· para el ${longDate(g.target_date)}</span>` : ""}</span>
      <span class="badge ${g.status === "DONE" ? "badge--ok" : ""}">${g.status === "DONE" ? "Cumplido" : "En curso"}</span>
      <form method="post" action="/app/progreso"><input type="hidden" name="action" value="${g.status === "DONE" ? "goal_reopen" : "goal_done"}"><input type="hidden" name="id" value="${g.id}"><button class="btn btn--ghost btn--sm" type="submit">${g.status === "DONE" ? "Reabrir" : "Marcar cumplido"}</button></form>
      <form method="post" action="/app/progreso"><input type="hidden" name="action" value="goal_delete"><input type="hidden" name="id" value="${g.id}"><button class="btn btn--ghost btn--sm" type="submit" aria-label="Eliminar objetivo ${g.title}">Eliminar</button></form></li>`)}</ul>`
      : html`<div class="state"><h3>Aún no tienes objetivos</h3><p>Define algo concreto para tu próxima semana de estudio.</p></div>`}</section>

  <section class="app-section" aria-labelledby="hs-t"><h2 id="hs-t">Historial de sesiones</h2>
    ${recent.length ? html`<ul class="subject-list">${recent.map((r) => html`<li><span class="subject-list__name">${r.focus_minutes} min${r.goal ? html` <span class="muted">· ${r.goal}</span>` : ""}</span><span class="muted">${fmtTime(r.ended_at)}</span><span class="badge">${r.source === "timer" ? "Temporizador" : "Manual"}</span></li>`)}</ul>` : html`<div class="state"><h3>Todavía no hay sesiones</h3><p>Inicia el temporizador y tu primera sesión aparecerá aquí.</p></div>`}</section>

  <section class="card app-section" aria-labelledby="pref-t"><h2 id="pref-t">Preferencias</h2>
    <form method="post" action="/app/progreso" class="auth__form"><input type="hidden" name="action" value="streak_toggle">
      <label class="check-line"><input type="checkbox" name="show_streak" ${showStreak ? raw("checked") : ""}> Mostrar mi racha de estudio</label>
      <p class="muted">NEXORA <strong>no envía recordatorios</strong> ni notificaciones de racha por ahora. Cuando existan, podrás apagarlos aquí.</p>
      <div><button class="btn btn--secondary btn--sm" type="submit">Guardar preferencia</button></div></form></section>`;
}

const hrefCal = (view, key) => `/app/calendario?vista=${view}&fecha=${key}`;
function entryLi(e, back) {
  const del = e.kind === "event" ? html`<form method="post" action="/app/calendario" class="inline-form"><input type="hidden" name="action" value="event_delete"><input type="hidden" name="id" value="${e.id}"><input type="hidden" name="vista" value="${back.view}"><input type="hidden" name="fecha" value="${back.key}"><button class="btn btn--ghost btn--sm" type="submit" aria-label="Eliminar evento ${e.title}">Eliminar</button></form>` : "";
  return html`<li class="cal-entry cal-entry--${e.kind}${e.done ? " is-done" : ""}"><span class="cal-entry__time">${e.time ?? ""}</span><span class="cal-entry__title">${e.title}${e.sub ? html` <span class="muted">· ${e.sub}</span>` : ""}</span>${del}</li>`;
}
export function calendarioBody({ view, key, todayKey, byDay }) {
  const back = { view, key }, { y, m } = monthOf(key);
  const unit = view === "mes" ? "mes" : view === "semana" ? "semana" : "dia";
  const prev = view === "mes" ? addMonths(key, -1) : addDays(key, view === "semana" ? -7 : -1), next = view === "mes" ? addMonths(key, 1) : addDays(key, view === "semana" ? 7 : 1);
  const wd = weekDays(key);
  const title = view === "mes" ? `${MONTHS[m - 1][0].toUpperCase()}${MONTHS[m - 1].slice(1)} de ${y}` : view === "semana" ? `Semana del ${longDate(wd[0])} al ${longDate(wd[6])}` : longDate(key);
  const list = (k) => byDay.get(k) ?? [];
  let grid;
  if (view === "mes") {
    grid = html`<div class="table-wrap"><table class="cal"><caption class="sr-only">${title}</caption><thead><tr>${DOW.map((d) => html`<th scope="col">${d}</th>`)}</tr></thead><tbody>
      ${monthGrid(key).map((week) => html`<tr>${week.map((k) => { const es = list(k), inMonth = monthOf(k).m === m; return html`<td class="${inMonth ? "" : "cal__out"}${k === todayKey ? " cal__today" : ""}"><a href="${hrefCal("dia", k)}" aria-label="${longDate(k)}: ${es.length} ${es.length === 1 ? "elemento" : "elementos"}"><span class="cal__n">${Number(k.slice(8))}</span>${es.slice(0, 2).map((e) => html`<span class="cal__chip cal__chip--${e.kind}">${e.title}</span>`)}${es.length > 2 ? html`<span class="cal__more">+${es.length - 2} más</span>` : ""}</a></td>`; })}</tr>`)}</tbody></table></div>`;
  } else if (view === "semana") {
    grid = html`<div class="cal-week">${wd.map((k, i) => html`<section class="cal-week__day${k === todayKey ? " cal__today" : ""}" aria-label="${longDate(k)}"><h3><a href="${hrefCal("dia", k)}">${DOW[i]} ${Number(k.slice(8))}</a></h3>${list(k).length ? html`<ul>${list(k).map((e) => entryLi(e, back))}</ul>` : html`<p class="muted">Sin elementos</p>`}</section>`)}</div>`;
  } else {
    grid = list(key).length ? html`<ul class="cal-day">${list(key).map((e) => entryLi(e, back))}</ul>` : html`<div class="state"><h3>Nada programado para este día</h3><p>Agrega un evento abajo.</p></div>`;
  }
  return html`<h1>Calendario</h1>
  <p class="muted">Tus clases, sesiones de estudio, exámenes, objetivos con fecha y el tiempo que estudiaste. Hora de El Salvador.</p>
  <div class="cal-bar"><nav class="cal-tabs" aria-label="Vista">${["mes", "semana", "dia"].map((v) => html`<a href="${hrefCal(v, key)}" ${v === view ? raw('aria-current="page"') : ""}>${v === "dia" ? "Día" : v[0].toUpperCase() + v.slice(1)}</a>`)}</nav>
    <div class="cal-nav"><a class="btn btn--secondary btn--sm" href="${hrefCal(view, prev)}" aria-label="Anterior">‹</a><a class="btn btn--secondary btn--sm" href="${hrefCal(view, todayKey)}">Hoy</a><a class="btn btn--secondary btn--sm" href="${hrefCal(view, next)}" aria-label="Siguiente">›</a></div></div>
  <h2 class="cal-title" aria-live="polite">${title}</h2>
  ${grid}
  <details class="card app-section"><summary>Agregar evento</summary>
    <form method="post" action="/app/calendario" class="subject-form"><input type="hidden" name="action" value="event_add"><input type="hidden" name="vista" value="${view}"><input type="hidden" name="fecha" value="${key}">
      ${field({ id: "ev-title", name: "title", label: "Título", required: true, attrs: { maxlength: 80 } })}
      ${field({ id: "ev-kind", name: "kind", label: "Tipo", required: true, options: Object.entries(KINDS).map(([value, label]) => ({ value, label })) })}
      ${field({ id: "ev-date", name: "date", label: "Fecha", type: "date", value: key, required: true })}
      ${field({ id: "ev-start", name: "start", label: "Hora de inicio", type: "time", value: "08:00", required: true })}
      ${field({ id: "ev-end", name: "end", label: "Hora de fin", type: "time", value: "09:00" })}
      <div><button class="btn btn--primary" type="submit">Agregar</button></div></form></details>`;
}

/* ───── Docentes, mentores y conferencistas ───── */
export const TEACHER_ROLES = { TEACHER: "Docente", MENTOR: "Mentor o mentora", CONFERENCE_HOST: "Conferencista" };
export function teacherRegisterPage({ values = {}, errors = {}, error } = {}) {
  const v = values;
  return html`<section class="section"><div class="container auth auth--wide">
    <h1>Registro de docentes, mentores y conferencistas</h1>
    <p class="muted">Tu cuenta se crea de inmediato, pero el rol de docente <strong>no se activa hasta que el equipo administrador lo verifique</strong>. Nadie obtiene permisos de docente sin verificación. ¿Eres estudiante? <a href="/registro">Crea tu cuenta aquí</a>.</p>
    <p class="status-note"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span>La verificación es <strong>manual</strong>: aún no hay proveedor de correo para validar tu correo institucional automáticamente. Las herramientas para docentes (clases, conferencias, materiales) llegan en una fase posterior.</span></p>
    ${error ? flashHtml({ kind: "error", text: error }) : ""}
    <form method="post" action="/registro-docente" class="auth__form" novalidate>
      <div class="form-grid">
        ${field({ id: "first_name", label: "Nombre", value: v.firstName, error: errors.first_name, required: true, attrs: { autocomplete: "given-name", maxlength: 80 } })}
        ${field({ id: "last_name", label: "Apellido", value: v.lastName, error: errors.last_name, required: true, attrs: { autocomplete: "family-name", maxlength: 80 } })}
      </div>
      ${field({ id: "email", label: "Correo institucional o profesional", type: "email", value: v.email, error: errors.email, required: true, attrs: { autocomplete: "email", inputmode: "email" } })}
      ${field({ id: "password", label: "Contraseña", type: "password", error: errors.password, required: true, hint: "Mínimo 10 caracteres.", attrs: { autocomplete: "new-password", minlength: 10, maxlength: 128 } })}
      ${field({ id: "role", label: "Rol que solicitas", value: v.role, error: errors.role, required: true, options: [{ value: "", label: "Elige un rol" }, ...Object.entries(TEACHER_ROLES).map(([value, label]) => ({ value, label }))] })}
      ${field({ id: "institution", label: "Institución", value: v.institution, error: errors.institution, required: true, attrs: { maxlength: 120 } })}
      ${field({ id: "evidence", name: "evidence", label: "Información para verificarte", type: "textarea", value: v.evidence, error: errors.evidence, hint: "Por ejemplo: tu cargo, un enlace a tu perfil profesional o institucional. Hasta 500 caracteres.", attrs: { maxlength: 500, rows: 3 } })}
      <div class="check-field ${errors.terms ? "check-field--error" : ""}"><label><input type="checkbox" name="terms" ${v.terms ? raw("checked") : ""} ${errors.terms ? raw('aria-invalid="true" aria-describedby="terms-err"') : ""}> Acepto los <a href="/terminos" target="_blank" rel="noopener">Términos</a> y la <a href="/privacidad" target="_blank" rel="noopener">Política de privacidad</a> (borradores pendientes de revisión legal).</label>${errors.terms ? html`<p id="terms-err" class="field__error"><span>${errors.terms}</span></p>` : ""}</div>
      <div><button class="btn btn--primary btn--lg" type="submit">Enviar solicitud</button></div>
    </form></div></section>`;
}
export function teacherHomeBody({ bundle, requests }) {
  const roles = bundle.roles ?? [];
  return html`<h1>Hola, ${bundle.profile.first_name}</h1>
  <p class="muted">Estado de tu verificación como docente, mentor o conferencista.</p>
  ${requests.length ? html`<ul class="app-section">${requests.map((r) => html`<li class="card app-section"><h2>${TEACHER_ROLES[r.role]}</h2>
    <p><span class="badge ${r.status === "APPROVED" ? "badge--ok" : r.status === "REJECTED" ? "badge--bad" : "badge--warn"}">${r.status === "APPROVED" ? "Verificado" : r.status === "REJECTED" ? "No aprobado" : "En revisión"}</span> <span class="muted">Institución: ${r.institution} · solicitud del ${fmtTime(r.created_at)}</span></p>
    ${r.status === "PENDING" ? html`<p>El equipo administrador está revisando tu solicitud. Hasta que se apruebe, tu cuenta no puede crear clases ni conferencias.</p>` : ""}
    ${r.status === "APPROVED" ? html`<p>¡Tu rol está verificado! Las herramientas para docentes (clases, Study Rooms, conferencias, materiales y participantes) llegan en una fase posterior y <strong>todavía no están disponibles</strong>.</p>` : ""}
    ${r.status === "REJECTED" ? html`<p>Tu solicitud no fue aprobada.${r.review_note ? html` Motivo: <em>${r.review_note}</em>.` : ""} Si crees que es un error, escríbenos desde <a href="/contacto">Contacto</a>.</p>` : ""}</li>`)}</ul>` : html`<div class="state"><h3>No hay solicitudes</h3></div>`}`;
}
