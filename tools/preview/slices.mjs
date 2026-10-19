// Captura una página completa y la parte en tiras para revisarla.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
const [, , path = "/", w = "1440", name = "page", variant = "bare"] = process.argv;
const srv = spawn("node", ["server.mjs"], { env: { ...process.env, PORT: "4181", VARIANT: variant }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const b = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: +w, height: 900 } });
await ctx.addCookies([{ name: "nexora_consent", value: encodeURIComponent(JSON.stringify({ v: 1, analytics: false, preferences: false, ts: 1 })), url: "http://localhost:4181" }]); // oculta el banner en las capturas de contenido
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.goto("http://localhost:4181" + path); await p.waitForSelector("[data-status]"); await p.waitForTimeout(500);
// recorre la página para activar la carga diferida (lazy) antes de capturar
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
await p.waitForTimeout(400);
const imgsBroken = await p.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src")));
console.log("imágenes sin cargar:", imgsBroken.length ? imgsBroken : "ninguna");
const h = await p.evaluate(() => document.documentElement.scrollHeight);
const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await p.screenshot({ path: `/tmp/${name}.png`, fullPage: true });
console.log(`${path} @${w}: alto ${h}px · desborde horizontal ${ov}px · errores: ${errs.length ? errs.join(" | ") : "ninguno"}`);
await b.close(); srv.kill();
