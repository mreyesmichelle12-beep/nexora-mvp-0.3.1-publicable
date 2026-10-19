import { createRequire } from "node:module";
import { spawn } from "node:child_process";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
const srv = spawn("node", ["server.mjs"], { env: { ...process.env, PORT: "4182", VARIANT: "bare" }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const b = await chromium.launch({ args: ["--no-sandbox"] });
const routes = ["/", "/nosotros", "/historia", "/equipo", "/plataforma", "/funciones", "/estudiantes", "/docentes", "/productos", "/impacto-social", "/planes", "/faq", "/contacto", "/privacidad", "/terminos", "/aviso-legal", "/cookies", "/iniciar-sesion", "/registro", "/demo", "/__404", "/__error"];
const widths = [320, 390, 768, 1024, 1440];
const bad = []; let n = 0;
for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  await ctx.addCookies([{ name: "nexora_consent", value: encodeURIComponent(JSON.stringify({ v: 1, analytics: false, preferences: false, ts: 1 })), url: "http://localhost:4182" }]);
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  for (const r of routes) {
    await p.goto("http://localhost:4182" + r); await p.waitForSelector("[data-status]");
    const o = await p.evaluate(() => { const iw = window.innerWidth; const off = [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > iw + 1 && !e.closest(".table-wrap, .sr-only, .hp"); }).slice(0, 3).map((e) => e.tagName + "." + (e.className?.toString?.().slice(0, 30) ?? "")); return { dx: document.documentElement.scrollWidth - iw, off }; });
    n++; if (o.dx > 0 || o.off.length || errs.length) bad.push({ w, r, ...o, errs: errs.splice(0) });
  }
  await ctx.close();
}
console.log(`${n} combinaciones ruta×ancho revisadas`);
console.log(bad.length ? "PROBLEMAS:\n" + JSON.stringify(bad, null, 1) : "Sin desbordamiento horizontal ni errores de JavaScript en ninguna.");
await b.close(); srv.kill();
