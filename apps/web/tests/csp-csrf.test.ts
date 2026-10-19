import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCsp, STATIC_SECURITY_HEADERS } from "../src/lib/security/csp.ts";
import { isSameOriginRequest } from "../src/lib/security/csrf.ts";

const NONCE = "dGVzdG5vbmNlMTIzNDU2Nzg5MA==";
const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });

test("CSP de producción: nonce, sin unsafe-eval, sin frames, con upgrade", () => {
  const csp = buildCsp({ nonce: NONCE, isDev: false });
  assert.match(csp, new RegExp(`script-src [^;]*'nonce-${NONCE.replace(/[+/=]/g, "\\$&")}'`));
  assert.ok(!csp.includes("unsafe-eval"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(csp.includes("object-src 'none'"));
  assert.ok(csp.includes("upgrade-insecure-requests"));
  assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp));
});

test("CSP de desarrollo permite eval (HMR) pero producción no", () => {
  assert.ok(buildCsp({ nonce: NONCE, isDev: true }).includes("unsafe-eval"));
});

test("CSP incluye los orígenes configurados (video, tiempo real, archivos)", () => {
  const csp = buildCsp({
    nonce: NONCE, isDev: false,
    connectOrigins: ["wss://demo.livekit.cloud", "wss://rt.nexora.example"],
    imgOrigins: ["https://files.nexora.example/ruta/ignorada"],
  });
  assert.ok(csp.includes("wss://demo.livekit.cloud"));
  assert.ok(csp.includes("https://files.nexora.example"));
  assert.ok(!csp.includes("ruta/ignorada"), "se reduce a origen");
});

test("CSP rechaza orígenes que intenten inyectar directivas o protocolos peligrosos", () => {
  assert.throws(() => buildCsp({ nonce: NONCE, isDev: false, connectOrigins: ["https://a.com; script-src *"] }));
  assert.throws(() => buildCsp({ nonce: NONCE, isDev: false, imgOrigins: ["javascript:alert(1)"] }));
  assert.throws(() => buildCsp({ nonce: "corto", isDev: false }));
});

test("cabeceras estáticas esenciales presentes", () => {
  const keys = STATIC_SECURITY_HEADERS.map((x) => x.key);
  for (const k of ["Strict-Transport-Security", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options"]) {
    assert.ok(keys.includes(k), k);
  }
});

test("CSRF: GET siempre pasa; POST exige origen permitido", () => {
  const allowed = ["https://nexora.example"];
  assert.equal(isSameOriginRequest("GET", h({}), allowed), true);
  assert.equal(isSameOriginRequest("POST", h({ origin: "https://nexora.example" }), allowed), true);
  assert.equal(isSameOriginRequest("POST", h({ origin: "https://evil.example" }), allowed), false);
  assert.equal(isSameOriginRequest("POST", h({}), allowed), false, "sin Origin ni Referer");
  assert.equal(isSameOriginRequest("DELETE", h({ referer: "https://nexora.example/app/x" }), allowed), true);
  assert.equal(isSameOriginRequest("POST", h({ referer: "https://nexora.example.evil.com/" }), allowed), false);
  assert.equal(isSameOriginRequest("POST", h({ referer: "no-es-url" }), allowed), false);
});
