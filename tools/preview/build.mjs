// Arnés de verificación visual: empaqueta las páginas reales y las sirve para renderizarlas en Chromium.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEsbuild, writeLucideShim, webAlias, webPlugin, tsconfigRaw, webDefine, nodePaths, CSS_FILES, WEB_SRC } from "../lib/web-bundle.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "dist");
mkdirSync(OUT, { recursive: true });
const esbuild = loadEsbuild();
const variant = process.env.VARIANT ?? "bare"; // bare = sin datos de contacto · full = con Instagram/correo/analítica
const ENV = variant === "full"
  ? { NODE_ENV: "development", APP_URL: "http://localhost:4173", CONTACT_EMAIL: "hola@nexora.example", INSTAGRAM_URL: "https://www.instagram.com/nexora.demo", INSTAGRAM_USERNAME: "nexora.demo", SITE_INDEXABLE: "true", ANALYTICS_PROVIDER: "plausible", PLAUSIBLE_DOMAIN: "nexora.example" }
  : { NODE_ENV: "development", APP_URL: "http://localhost:4173" };

const shim = join(OUT, "lucide-shim.tsx");
const icons = writeLucideShim(shim);

const routes = [["/", "app/(public)/page"]];
for (const d of readdirSync(join(WEB_SRC, "app/(public)"))) if (statSync(join(WEB_SRC, "app/(public)", d)).isDirectory()) routes.push([`/${d}`, `app/(public)/${d}/page`]);
writeFileSync(join(HERE, "entry.tsx"), `
import { createRoot } from "react-dom/client";
${routes.map(([, f], i) => `import P${i}, * as M${i} from "@/${f}";`).join("\n")}
import PublicLayout from "@/app/(public)/layout";
import NotFound from "@/app/not-found";
import GlobalError from "@/app/error";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
const ROUTES: Record<string, { Page: any; metadata: any }> = {
${routes.map(([r], i) => `  ${JSON.stringify(r)}: { Page: P${i}, metadata: (M${i} as any).metadata },`).join("\n")}
};
(window as any).__ROUTES = Object.fromEntries(Object.entries(ROUTES).map(([k, v]) => [k, v.metadata]));
(window as any).__SITEMAP = sitemap();
(window as any).__ROBOTS = robots();
async function main() {
  const path = window.location.pathname.replace(/\\/$/, "") || "/";
  const root = createRoot(document.getElementById("root")!);
  document.documentElement.dataset.route = path;
  if (path === "/__error") { document.documentElement.dataset.status = "error"; root.render(<GlobalError error={Object.assign(new Error("secreto interno"), { digest: "abc123" })} reset={() => {}} />); return; }
  const hit = ROUTES[path];
  if (!hit) { document.documentElement.dataset.status = "404"; document.title = "Página no encontrada"; root.render(<NotFound />); return; }
  document.documentElement.dataset.status = "200";
  const t = hit.metadata?.title; document.title = typeof t === "string" ? t + " · NEXORA" : t?.absolute ?? "NEXORA";
  const tree = await hit.Page({});
  root.render(<><a href="#contenido" className="skip-link">Saltar al contenido</a><PublicLayout>{tree}</PublicLayout></>);
}
main();
`);

await esbuild.build({
  entryPoints: [join(HERE, "entry.tsx")], bundle: true, outfile: join(OUT, `app-${variant}.js`), format: "iife", jsx: "automatic", platform: "browser", target: "es2022",
  nodePaths: nodePaths(), alias: webAlias(shim), logLevel: "warning", define: webDefine(ENV), tsconfigRaw: tsconfigRaw(),
  plugins: [webPlugin(join(HERE, "stubs/contact-actions.ts"))],
});
writeFileSync(join(OUT, "styles.css"), CSS_FILES.map((f) => readFileSync(f, "utf8")).join("\n"));
writeFileSync(join(OUT, `index-${variant}.html`), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>NEXORA</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/dist/styles.css"></head><body><div id="root"></div><script src="/dist/app-${variant}.js"></script></body></html>`);
console.log(`ok variante=${variant} rutas=${routes.length} iconos=${icons.count}`);
