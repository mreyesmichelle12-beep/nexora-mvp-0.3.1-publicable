import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = resolve(HERE, "..");

/** Configuración desde variables de entorno. Nada se inventa: lo que falta se declara como no configurado. */
export function loadConfig(env = process.env) {
  const port = Number(env.PORT ?? 3000);
  const appUrl = (env.APP_URL?.trim() || `http://localhost:${port}`).replace(/\/$/, "");
  const dataDir = resolve(env.DATA_DIR || join(APP_ROOT, "data"));
  mkdirSync(dataDir, { recursive: true });

  // Pepper para hashear IPs en logs: se genera una vez y se guarda en el disco de datos (o se toma de LOG_PEPPER).
  let pepper = env.LOG_PEPPER?.trim();
  if (!pepper) {
    const f = join(dataDir, "pepper.txt");
    if (!existsSync(f)) writeFileSync(f, randomBytes(32).toString("base64url"), { mode: 0o600 });
    pepper = readFileSync(f, "utf8").trim();
  }
  return {
    port,
    host: env.HOST || "0.0.0.0",
    appUrl,
    dataDir,
    dbFile: join(dataDir, "nexora.db"),
    publicDir: join(APP_ROOT, "public"),
    pepper,
    trustProxy: env.TRUST_PROXY === "1",
    // Cookie Secure si el sitio se sirve por HTTPS (APP_URL https) o el proxy lo indica
    secureCookies: env.COOKIE_SECURE ? env.COOKIE_SECURE === "true" : appUrl.startsWith("https://"),
    demoEnabled: env.DEMO_ENABLED !== "false",
    isProd: env.NODE_ENV === "production",
    version: "0.3.0",
  };
}
