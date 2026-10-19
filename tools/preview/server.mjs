import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(HERE, "../../apps/web/public");
const TYPES = { ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".html": "text/html; charset=utf-8" };
const port = Number(process.env.PORT ?? 4173), variant = process.env.VARIANT ?? "bare";
createServer((req, res) => {
  const url = new URL(req.url, "http://x"); let file;
  if (url.pathname.startsWith("/dist/")) file = join(HERE, url.pathname);
  else if (extname(url.pathname)) file = join(PUBLIC, url.pathname);
  if (file && existsSync(file) && statSync(file).isFile()) { res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }); return res.end(readFileSync(file)); }
  if (file) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[".html"] });
  res.end(readFileSync(join(HERE, `dist/index-${variant}.html`)));
}).listen(port, () => console.log(`preview ${variant} en http://localhost:${port}`));
