import { createRequire } from "node:module";
import { spawn } from "node:child_process";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
const srv = spawn("node", ["server.mjs"], { env: { ...process.env, PORT: "4183", VARIANT: "bare" }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const b = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("http://localhost:4183/"); await p.waitForSelector("[data-status]"); await p.waitForTimeout(500);
await p.screenshot({ path: "/tmp/m-home-cookies.png" });                   // primera visita: banner de cookies
await p.getByRole("button", { name: "Rechazar" }).click();
await p.screenshot({ path: "/tmp/m-home.png" });
await p.getByRole("button", { name: "Abrir menú" }).click(); await p.waitForTimeout(200);
await p.screenshot({ path: "/tmp/m-menu.png" });
await p.keyboard.press("Escape");
console.log("menú cerrado con Escape:", await p.getByRole("button", { name: "Abrir menú" }).isVisible());
await b.close(); srv.kill();
