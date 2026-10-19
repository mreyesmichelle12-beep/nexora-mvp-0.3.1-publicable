// Pre-renderiza el sitio público REAL (apps/web) a HTML estático + un cliente que hidrata. Salida: apps/mvp/public
// Uso: node tools/mvp/build-public.mjs        (requiere esbuild, react, react-dom y react-icons; ver apps/mvp/README)
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadEsbuild, writeLucideShim, webAlias, webPlugin, tsconfigRaw, webDefine, nodePaths, CSS_FILES, WEB_SRC, ROOT } from "../lib/web-bundle.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GEN = join(HERE, ".gen");
const OUT = join(ROOT, "apps/mvp/public");
const esbuild = loadEsbuild();
rmSync(OUT, { recursive: true, force: true }); rmSync(GEN, { recursive: true, force: true });
mkdirSync(GEN, { recursive: true }); mkdirSync(OUT, { recursive: true });

// Valores de configuración del sitio. APP_URL es un marcador que el servidor sustituye al arrancar por la URL real.
export const APP_URL_PLACEHOLDER = "https://nexora-app-url.placeholder";
const ENV = {
  NODE_ENV: "production",
  APP_URL: APP_URL_PLACEHOLDER,
  INSTAGRAM_URL: process.env.INSTAGRAM_URL ?? "https://www.instagram.com/nexora_sv1/",
  INSTAGRAM_USERNAME: process.env.INSTAGRAM_USERNAME ?? "nexora_sv1",
  CONTACT_EMAIL: process.env.CONTACT_EMAIL ?? "",
  SITE_INDEXABLE: process.env.SITE_INDEXABLE ?? "false",
};
const SHELL_ROUTES = ["/iniciar-sesion", "/registro", "/demo"]; // los sirve la aplicación (formularios reales)

const shim = join(GEN, "lucide-shim.tsx");
writeLucideShim(shim);

const routes = [["/", "app/(public)/page"]];
for (const d of readdirSync(join(WEB_SRC, "app/(public)"))) {
  if (statSync(join(WEB_SRC, "app/(public)", d)).isDirectory() && !SHELL_ROUTES.includes(`/${d}`)) routes.push([`/${d}`, `app/(public)/${d}/page`]);
}

/* ───── Entrada de SSR ───── */
writeFileSync(join(GEN, "ssr-entry.tsx"), `
import { renderToString } from "react-dom/server";
${routes.map(([, f], i) => `import P${i}, * as M${i} from "@/${f}";`).join("\n")}
import PublicLayout from "@/app/(public)/layout";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import NotFound from "@/app/not-found";
import { StateBlock } from "@/components/ui/state-block";
import { publicConfig } from "@/lib/page-meta";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
const ROUTES: Record<string, { Page: any; metadata: any }> = {
${routes.map(([r], i) => `  ${JSON.stringify(r)}: { Page: P${i}, metadata: (M${i} as any).metadata },`).join("\n")}
};
export const paths = Object.keys(ROUTES);
export async function renderRoute(path: string) {
  (globalThis as any).__PATH__ = path;
  const tree = await ROUTES[path]!.Page({});
  return { html: renderToString(<PublicLayout>{tree}</PublicLayout>), metadata: ROUTES[path]!.metadata };
}
export function renderParts(path: string) {
  (globalThis as any).__PATH__ = path;
  return { header: renderToString(<Header />), footer: renderToString(<Footer config={publicConfig} />) };
}
export const render404 = () => renderToString(<NotFound />);
export const render500 = () => renderToString(<main id="contenido" className="center-page"><StateBlock kind="error" title="Algo salió mal de nuestro lado" description="No pudimos cargar esta página. Inténtalo de nuevo en unos minutos; si persiste, escríbenos desde Contacto." action={<a className="btn btn--primary" href="/">Volver al inicio</a>} /></main>);
export const sitemapEntries = () => sitemap();
export const robotsRules = () => robots();
`);
await esbuild.build({
  entryPoints: [join(GEN, "ssr-entry.tsx")], bundle: true, outfile: join(GEN, "ssr.mjs"), format: "esm", platform: "node", jsx: "automatic", target: "node22",
  nodePaths: nodePaths(), alias: webAlias(shim), logLevel: "warning", define: webDefine(ENV), tsconfigRaw: tsconfigRaw(), plugins: [webPlugin(join(HERE, "stubs/contact-fetch.ts"))],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});

/* ───── Cliente (hidratación) ───── */
writeFileSync(join(GEN, "client-entry.tsx"), `
import { createRoot, hydrateRoot } from "react-dom/client";
import PublicLayout from "@/app/(public)/layout";
import { Header } from "@/components/site/header";
import { CookieBanner } from "@/components/site/cookie-banner";
const loaders: Record<string, () => Promise<any>> = {
${routes.map(([r, f]) => `  ${JSON.stringify(r)}: () => import("@/${f}"),`).join("\n")}
};
async function main() {
  const path = window.location.pathname.replace(/\\/$/, "") || "/";
  if (document.documentElement.dataset.mode === "shell") {
    hydrateRoot(document.getElementById("site-header")!, <Header />);
    createRoot(document.getElementById("cookie-root")!).render(<CookieBanner analyticsAvailable={false} />);
    return;
  }
  const load = loaders[path];
  if (!load) return;
  const mod = await load();
  hydrateRoot(document.getElementById("root")!, <PublicLayout>{await mod.default({})}</PublicLayout>);
}
main();
`);
const built = await esbuild.build({
  entryPoints: [join(GEN, "client-entry.tsx")], bundle: true, outdir: join(OUT, "assets"), entryNames: "client-[hash]", chunkNames: "chunk-[hash]", format: "esm", splitting: true,
  minify: true, jsx: "automatic", platform: "browser", target: "es2022", metafile: true, nodePaths: nodePaths(), alias: webAlias(shim), logLevel: "warning",
  define: webDefine(ENV), tsconfigRaw: tsconfigRaw(), plugins: [webPlugin(join(HERE, "stubs/contact-fetch.ts"))],
});
// Con code-splitting, los chunks de import() dinámico también traen `entryPoint`: se elige el cliente por nombre.
const entryOut = Object.entries(built.metafile.outputs).find(([, o]) => o.entryPoint?.endsWith("client-entry.tsx"));
if (!entryOut) throw new Error("No se encontró la salida del cliente (client-entry.tsx)");
const entry = entryOut[0].split("/").pop();

/* ───── CSS y archivos estáticos ───── */
const appCss = join(ROOT, "apps/mvp/app.css");
let css = CSS_FILES.map((f) => readFileSync(f, "utf8")).join("\n");
try { css += "\n" + readFileSync(appCss, "utf8"); } catch {}
writeFileSync(join(OUT, "styles.css"), css);
for (const d of ["brand", "team", "impact"]) cpSync(join(ROOT, "apps/web/public", d), join(OUT, d), { recursive: true });
cpSync(join(ROOT, "apps/web/public/favicon.ico"), join(OUT, "favicon.ico"));

/* ───── HTML ───── */
const ssr = await import(pathToFileURL(join(GEN, "ssr.mjs")).href);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function head(m) {
  const t = typeof m.title === "string" ? `${m.title} · NEXORA` : m.title.absolute;
  const og = m.openGraph, tw = m.twitter, r = m.robots;
  const tags = [
    `<title>${esc(t)}</title>`, `<meta name="description" content="${esc(m.description)}">`,
    `<link rel="canonical" href="${esc(m.alternates.canonical)}">`,
    `<meta name="robots" content="${r.index ? "index, follow" : "noindex, nofollow"}">`,
    `<meta property="og:type" content="${og.type}"><meta property="og:site_name" content="${og.siteName}"><meta property="og:locale" content="${og.locale}">`,
    `<meta property="og:title" content="${esc(og.title)}"><meta property="og:description" content="${esc(og.description)}"><meta property="og:url" content="${esc(og.url)}">`,
    `<meta property="og:image" content="${esc(og.images[0].url)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(og.images[0].alt)}">`,
    `<meta name="twitter:card" content="${tw.card}"><meta name="twitter:title" content="${esc(tw.title)}"><meta name="twitter:description" content="${esc(m.description)}"><meta name="twitter:image" content="${esc(tw.images[0])}">`,
  ];
  return tags.join("\n");
}
const BASE_HEAD = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0A2744"><link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" href="/brand/icon-192.png" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="/brand/icon-192.png"><link rel="stylesheet" href="/styles.css">`;
const SKIP = `<a href="#contenido" class="skip-link">Saltar al contenido</a>`;
const page = (route, h, body, mode) => `<!doctype html>\n<html lang="es" data-mode="${mode}" data-route="${route}"><head>${BASE_HEAD}\n${h}</head><body>${SKIP}${body}<script type="module" src="/assets/${entry}"></script></body></html>`;
const write = (rel, html) => { const f = join(OUT, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html); };

for (const path of ssr.paths) {
  const { html, metadata } = await ssr.renderRoute(path);
  write(path === "/" ? "index.html" : `${path.slice(1)}/index.html`, page(path, head(metadata), `<div id="root">${html}</div>`, "page"));
}
// Plantillas para las páginas dinámicas con el mismo encabezado y pie del sitio público
for (const [path, title] of [["/iniciar-sesion", "Iniciar sesión"], ["/registro", "Crear cuenta"], ["/demo", "Probar demo"]]) {
  const { header, footer } = ssr.renderParts(path);
  const body = `<div id="site-header">${header}</div><main id="contenido" tabindex="-1"><!--CONTENT--></main>${footer}<div id="cookie-root"></div>`;
  write(`_shell${path}.html`, `<!doctype html>\n<html lang="es" data-mode="shell" data-route="${path}"><head>${BASE_HEAD}\n<title><!--TITLE--> · NEXORA</title><meta name="robots" content="noindex, nofollow"></head><body>${SKIP}${body}<script type="module" src="/assets/${entry}"></script></body></html>`);
}
write("_shell/404.html", `<!doctype html>\n<html lang="es"><head>${BASE_HEAD}<title>Página no encontrada · NEXORA</title><meta name="robots" content="noindex, nofollow"></head><body>${SKIP}${ssr.render404()}</body></html>`);
write("_shell/500.html", `<!doctype html>\n<html lang="es"><head>${BASE_HEAD}<title>Error · NEXORA</title><meta name="robots" content="noindex, nofollow"></head><body>${SKIP}${ssr.render500()}</body></html>`);

// robots.txt y sitemap.xml
const rb = ssr.robotsRules();
writeFileSync(join(OUT, "robots.txt"), rb.rules.map((r) => `User-agent: ${r.userAgent}\n${r.allow ? `Allow: ${r.allow}\n` : ""}${[].concat(r.disallow ?? []).map((d) => `Disallow: ${d}\n`).join("")}`).join("\n") + (rb.sitemap ? `\nSitemap: ${rb.sitemap}\n` : ""));
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ssr.sitemapEntries().map((u) => `  <url><loc>${esc(u.url)}</loc>${u.priority != null ? `<priority>${u.priority}</priority>` : ""}</url>`).join("\n")}\n</urlset>\n`);
console.log(`Sitio público pre-renderizado: ${ssr.paths.length} páginas + 3 plantillas + 404/500 → ${OUT}`);
