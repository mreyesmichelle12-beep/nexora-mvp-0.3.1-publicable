// Configuración compartida para empaquetar las páginas REALES de apps/web fuera de Next
// (arnés de verificación y build del MVP). Sustituye sólo lo que depende de Next: Link, Image, navigation, iconos.
import { createRequire } from "node:module";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "../..");
export const WEB_SRC = join(ROOT, "apps/web/src");
export const STUBS = join(HERE, "stubs");

const GLOBALS = [process.env.NODE_PATH, "/home/claude/.npm-global/lib/node_modules"].filter(Boolean);
const req = createRequire(join(ROOT, "package.json"));
function load(names) {
  for (const base of [null, ...GLOBALS]) for (const n of names) { try { return base ? createRequire(join(base, "x.js"))(join(base, n)) : req(n); } catch {} }
  throw new Error(`No se encontró ${names[0]}. Instálalo (npm i -D) o define NODE_PATH.`);
}
export const loadEsbuild = () => load(["esbuild", "tsx/node_modules/esbuild"]);
export const loadIcons = () => load(["react-icons/lu"]);
export const nodePaths = () => GLOBALS;

const ALIAS = { AlertCircle: "CircleAlert", CheckCircle2: "CircleCheck", XCircle: "CircleX", Loader2: "LoaderCircle", AlertTriangle: "TriangleAlert" };

/** lucide-react → react-icons/lu (mismos iconos, sin red). Escribe el shim y devuelve su ruta. */
export function writeLucideShim(outFile) {
  const used = new Set();
  (function scan(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) scan(p); else if (/\.tsx?$/.test(f)) for (const m of readFileSync(p, "utf8").matchAll(/import\s*\{([^}]+)\}\s*from\s*"lucide-react"/g)) m[1].split(",").map((x) => x.replace(/type\s+/, "").trim()).filter(Boolean).forEach((n) => used.add(n)); } })(WEB_SRC);
  const lu = loadIcons();
  const luName = (n) => (lu[`Lu${n}`] ? `Lu${n}` : ALIAS[n] && lu[`Lu${ALIAS[n]}`] ? `Lu${ALIAS[n]}` : null);
  const names = [...used].filter((n) => n !== "LucideIcon" && n !== "LucideProps");
  const missing = names.filter((n) => !luName(n));
  if (missing.length) console.warn("Iconos sin equivalente:", missing);
  writeFileSync(outFile, names.map((n) => (luName(n) ? `export { ${luName(n)} as ${n} } from "react-icons/lu";` : `export const ${n} = () => null;`)).join("\n") + "\nexport type LucideIcon = any;\n");
  return { count: names.length, missing };
}

export const webAlias = (lucideShim) => ({
  "next/link": join(STUBS, "link.tsx"),
  "next/image": join(STUBS, "image.tsx"),
  "next/navigation": join(STUBS, "navigation.ts"),
  "lucide-react": lucideShim,
});

function resolveTs(base) {
  for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) { try { if (statSync(base + ext).isFile()) return base + ext; } catch {} }
  return base;
}

/** Alias `@/` y sustitución opcional de `./actions` (la acción de servidor del formulario de contacto). */
export const webPlugin = (actionsStub) => ({
  name: "nexora-web",
  setup(b) {
    b.onResolve({ filter: /^@\// }, (a) => ({ path: resolveTs(join(WEB_SRC, a.path.slice(2))) }));
    if (actionsStub) b.onResolve({ filter: /^\.\/actions$/ }, (a) => (a.importer.includes("contacto") ? { path: actionsStub } : undefined));
  },
});

export const tsconfigRaw = () => JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": [WEB_SRC + "/*"] }, jsx: "react-jsx", allowImportingTsExtensions: true } });

/** Variables que `readPublicConfig(process.env)` leerá dentro del paquete. */
export const webDefine = (env) => ({ "process.env.NODE_ENV": '"production"', "process.env": JSON.stringify(env) });

export const CSS_FILES = ["tokens", "base", "ui", "pages", "site"].map((n) => join(WEB_SRC, `styles/${n}.css`));
