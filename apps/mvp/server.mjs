// NEXORA MVP 0.3 — servidor sin dependencias (Node >= 22.18). Uso: node server.mjs  →  http://localhost:3000
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(`\nNEXORA necesita Node 22.18 o superior. Tu versión es ${process.versions.node}.\nDescarga la versión LTS desde https://nodejs.org y vuelve a ejecutar.\n`);
  process.exit(1);
}
const { createServer } = await import("node:http");
const { loadConfig } = await import("./src/config.mjs");
const { createApp } = await import("./src/handlers.mjs");

const config = loadConfig();
const app = createApp(config);
const server = createServer((req, res) => { app.handle(req, res); });
server.requestTimeout = 15_000; server.headersTimeout = 10_000;
server.listen(config.port, config.host, () => {
  console.log(`\nNEXORA MVP ${config.version} está listo → ${config.appUrl}\n(puerto ${config.port}; para detenerlo pulsa Ctrl+C)`);
  console.log(`Datos: ${config.dbFile}${config.isProd && !config.secureCookies ? "\nAVISO: producción sin HTTPS (APP_URL no es https): las cookies no serán Secure." : ""}`);
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { console.log("Cerrando…"); server.close(() => { app.close(); process.exit(0); }); setTimeout(() => process.exit(0), 3000).unref(); });
