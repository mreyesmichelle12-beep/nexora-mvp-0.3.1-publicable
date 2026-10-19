/**
 * Content-Security-Policy con nonce por petición (se aplica en middleware.ts).
 * Los orígenes externos se validan: un valor con ';' o saltos de línea no puede
 * colarse en la cabecera.
 */
export interface CspOptions {
  nonce: string;
  isDev: boolean;
  /** Orígenes extra: LiveKit (wss://), servicio RT (wss://), CDN de archivos (https://), analítica. */
  connectOrigins?: string[];
  imgOrigins?: string[];
  scriptOrigins?: string[]; // p. ej. script de analítica, SOLO tras consentimiento
}

function cleanOrigin(value: string): string {
  const u = new URL(value); // lanza si no es URL válida
  if (!["http:", "https:", "ws:", "wss:"].includes(u.protocol)) throw new Error(`Origen no permitido: ${u.protocol}`);
  if (/[;,\s]/.test(value.trim())) throw new Error("Origen con caracteres no permitidos");
  return u.origin;
}

export function buildCsp(o: CspOptions): string {
  if (!/^[A-Za-z0-9+/_-]{16,}={0,2}$/.test(o.nonce)) throw new Error("nonce inválido");
  const connect = (o.connectOrigins ?? []).map(cleanOrigin);
  const img = (o.imgOrigins ?? []).map(cleanOrigin);
  const scripts = (o.scriptOrigins ?? []).map(cleanOrigin);

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${o.nonce}'`, "'strict-dynamic'", ...scripts, ...(o.isDev ? ["'unsafe-eval'"] : [])],
    // Los estilos en línea son de bajo riesgo y Next/fuentes los inyectan; los scripts sí van con nonce.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...img],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...connect, ...(o.isDev ? ["ws://localhost:*", "http://localhost:*"] : [])],
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };
  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!o.isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

/**
 * CSP para el servidor del MVP: HTML pre-renderizado, sin scripts en línea y todos los scripts propios (`'self'`).
 * Más estricta que la versión con nonce de Next porque no hace falta `strict-dynamic` ni `unsafe-eval`.
 */
export function buildStaticCsp(opts: { isDev?: boolean } = {}): string {
  const d: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "media-src": ["'self'", "blob:"],
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };
  const parts = Object.entries(d).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!opts.isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

/** Cabeceras estáticas de seguridad (next.config.ts). */
export const STATIC_SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Cámara, micrófono y pantalla compartida: sólo el propio sitio (Study Rooms).
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=(self), interest-cohort=()" },
];
