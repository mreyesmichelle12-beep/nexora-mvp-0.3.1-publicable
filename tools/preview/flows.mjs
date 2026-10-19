import { createRequire } from "node:module";
import { spawn } from "node:child_process";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
const srv = spawn("node", ["server.mjs"], { env: { ...process.env, PORT: "4184", VARIANT: "full" }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const b = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const out = []; const ok = (name, cond) => out.push(`${cond ? "✔" : "✘"} ${name}`);
const U = "http://localhost:4184";

// Cookies y analítica condicionada
await p.goto(U + "/"); await p.waitForSelector("[data-status]");
ok("banner visible en la primera visita", await p.getByRole("region", { name: "Preferencias de cookies" }).isVisible());
ok("analítica NO cargada antes de consentir", (await p.locator("#nexora-analytics").count()) === 0);
await p.getByRole("button", { name: "Rechazar" }).click();
ok("tras Rechazar: sin banner y sin analítica", !(await p.getByRole("region", { name: "Preferencias de cookies" }).count()) && (await p.locator("#nexora-analytics").count()) === 0);
let c = (await ctx.cookies()).find((x) => x.name === "nexora_consent"); ok("cookie de consentimiento guardada (rechazo)", c && decodeURIComponent(c.value).includes('"analytics":false') && c.sameSite === "Lax");
await p.goto(U + "/cookies"); await p.waitForSelector("[data-status]");
await p.getByLabel("Analíticas").check(); await p.getByRole("button", { name: "Guardar mi elección" }).click(); await p.waitForTimeout(300);
const s = p.locator("#nexora-analytics");
ok("al ACEPTAR analíticas se inserta el script del proveedor", (await s.count()) === 1 && (await s.getAttribute("data-domain")) === "nexora.example" && (await s.getAttribute("src")).startsWith("https://plausible.io/"));
await Promise.all([p.waitForNavigation().catch(() => {}), (async () => { await p.getByLabel("Analíticas").uncheck(); await p.getByRole("button", { name: "Guardar mi elección" }).click(); })()]);
await p.waitForSelector("[data-status]"); await p.waitForTimeout(300);
ok("al RETIRAR el consentimiento la analítica se elimina", (await p.locator("#nexora-analytics").count()) === 0);

// Datos de contacto reales sólo si están configurados
await p.goto(U + "/contacto?asunto=problema"); await p.waitForSelector("[data-status]");
ok("asunto precargado desde ?asunto=problema", (await p.getByLabel(/Motivo/).inputValue()) === "problema");
ok("correo y Instagram configurados se muestran como enlaces", (await p.locator('a[href="mailto:hola@nexora.example"]').count()) >= 1 && (await p.locator('a[href^="https://www.instagram.com/"]').count()) >= 1);
await p.goto(U + "/contacto?asunto=%3Cscript%3E"); await p.waitForSelector("[data-status]");
ok("asunto inválido en la URL se ignora (queda 'general')", (await p.getByLabel(/Motivo/).inputValue()) === "general");

// Formulario
await p.getByRole("button", { name: "Enviar mensaje" }).click();
ok("envío vacío: 3 errores (nombre, correo, mensaje; el motivo ya viene elegido) con aria-invalid", (await p.locator('[aria-invalid="true"]').count()) === 3);
ok("el foco va al primer campo inválido (Nombre)", (await p.evaluate(() => document.activeElement?.getAttribute("name"))) === "name");
ok("los errores explican qué hacer", (await p.getByText("Escribe tu nombre").count()) === 1);
await p.getByLabel(/Nombre/).fill("Ana Prueba"); await p.getByLabel(/Correo/).fill("no-es-correo"); await p.getByLabel(/Mensaje/).fill("Hola, quiero saber más de NEXORA.");
await p.getByRole("button", { name: "Enviar mensaje" }).click();
ok("correo inválido: error sólo en correo", (await p.locator('[aria-invalid="true"]').count()) === 1 && (await p.getByText("Revisa el correo").count()) === 1);
await p.getByLabel(/Correo/).fill("ana@correo.com");
await p.getByRole("button", { name: "Enviar mensaje" }).click(); await p.waitForTimeout(120);
ok("estado de carga: botón deshabilitado con aria-busy", (await p.getByRole("button", { name: /Enviando/ }).getAttribute("aria-busy")) === "true");
await p.waitForSelector(".form-status--ok", { timeout: 3000 });
ok("confirmación de envío anunciada (role=status)", (await p.locator(".form-status--ok").getAttribute("role")) === "status");
// Honeypot
await p.getByLabel(/Nombre/).fill("Bot"); await p.getByLabel(/Correo/).fill("bot@spam.com"); await p.getByLabel(/Mensaje/).fill("Compra ahora mismo barato");
await p.evaluate(() => { document.querySelector('input[name="website"]').value = "http://spam.example"; });
await p.getByRole("button", { name: "Enviar mensaje" }).click(); await p.waitForTimeout(700);
const subs = await p.evaluate(() => window.__SUBMITS);
ok("honeypot rellenado se detecta como spam", subs.at(-1).spam === true);
ok("el campo trampa no es alcanzable por teclado ni lectores", await p.evaluate(() => { const i = document.querySelector('input[name="website"]'); return i.tabIndex === -1 && i.closest("[aria-hidden='true']") !== null; }));

// Teclado: skip link y orden
await ctx.clearCookies();
await p.goto(U + "/"); await p.waitForSelector("[data-status]");
await p.getByRole("button", { name: "Rechazar" }).click();
await p.keyboard.press("Tab");
ok("primer Tab = 'Saltar al contenido'", (await p.evaluate(() => document.activeElement?.textContent)) === "Saltar al contenido");
await p.keyboard.press("Enter");
ok("el skip link mueve el foco a <main>", (await p.evaluate(() => document.activeElement?.id)) === "contenido");

console.log(out.join("\n"));
console.log(out.some((l) => l.startsWith("✘")) ? "\nHAY FALLOS" : "\nTodo correcto");
await b.close(); srv.kill();
