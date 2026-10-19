import { test } from "node:test";
import assert from "node:assert/strict";
import { absoluteUrl, pageMetadata, serializeJsonLd, organizationLd, faqLd, softwareApplicationLd } from "../src/lib/seo.ts";
import { readPublicConfig } from "../src/lib/public-config.ts";
import { parseConsent, serializeConsent, consentCookieString, readConsentFromCookieHeader, ACCEPT_ALL, REJECT_NON_ESSENTIAL, CONSENT_VERSION } from "../src/lib/consent.ts";
import { validateContact } from "../src/lib/contact-validation.ts";
import { PUBLIC_ROUTES } from "../src/lib/routes.ts";

const base = { name: "Ana Pérez", email: "Ana@Correo.com ", subject: "general", message: "Hola, quiero saber más de NEXORA." };

/* ───── URLs ───── */
test("absoluteUrl construye URLs correctas con y sin barra final", () => {
  assert.equal(absoluteUrl("/faq", "https://nexora.example"), "https://nexora.example/faq");
  assert.equal(absoluteUrl("/faq", "https://nexora.example/"), "https://nexora.example/faq");
  assert.equal(absoluteUrl("/", "https://nexora.example"), "https://nexora.example/");
  assert.equal(absoluteUrl("/brand/og-default.png", "http://localhost:3000"), "http://localhost:3000/brand/og-default.png");
});

/* ───── Configuración pública ───── */
test("sin variables no se inventa ningún dato de contacto", () => {
  const c = readPublicConfig({});
  assert.equal(c.contactEmail, null);
  assert.equal(c.instagramUrl, null);
  assert.equal(c.instagramUsername, null);
  assert.equal(c.indexable, false);
  assert.equal(c.analytics, null);
});
test("Instagram sólo acepta https://instagram.com (bloquea javascript: y dominios ajenos)", () => {
  assert.equal(readPublicConfig({ INSTAGRAM_URL: "https://www.instagram.com/nexora" }).instagramUrl, "https://www.instagram.com/nexora");
  for (const bad of ["javascript:alert(1)", "http://instagram.com/x", "https://instagram.com.evil.com/x", "https://evil.com/instagram.com", "no-url"]) {
    assert.equal(readPublicConfig({ INSTAGRAM_URL: bad }).instagramUrl, null, bad);
  }
});
test("correo y usuario inválidos se descartan; indexación y analítica requieren activación explícita", () => {
  assert.equal(readPublicConfig({ CONTACT_EMAIL: "no es correo" }).contactEmail, null);
  assert.equal(readPublicConfig({ CONTACT_EMAIL: "hola@nexora.example" }).contactEmail, "hola@nexora.example");
  assert.equal(readPublicConfig({ INSTAGRAM_USERNAME: "@nexora_sv" }).instagramUsername, "nexora_sv");
  assert.equal(readPublicConfig({ INSTAGRAM_USERNAME: "<script>" }).instagramUsername, null);
  assert.equal(readPublicConfig({ SITE_INDEXABLE: "yes" }).indexable, false);
  assert.equal(readPublicConfig({ SITE_INDEXABLE: "true" }).indexable, true);
  assert.equal(readPublicConfig({ ANALYTICS_PROVIDER: "plausible" }).analytics, null, "sin dominio no hay analítica");
  assert.deepEqual(readPublicConfig({ ANALYTICS_PROVIDER: "plausible", PLAUSIBLE_DOMAIN: "nexora.example" }).analytics, { provider: "plausible", domain: "nexora.example" });
});

/* ───── SEO ───── */
test("metadatos: canonical absoluto, OG/Twitter y noindex mientras el sitio no sea indexable", () => {
  const m = pageMetadata({ title: "FAQ", description: "d", path: "/faq", config: { siteUrl: "https://n.example", indexable: false } });
  assert.equal(m.alternates.canonical, "https://n.example/faq");
  assert.deepEqual(m.robots, { index: false, follow: false });
  assert.equal(m.openGraph.url, "https://n.example/faq");
  assert.ok(m.openGraph.images[0]!.url.startsWith("https://n.example/brand/"));
  assert.equal(m.twitter.card, "summary_large_image");
  const live = pageMetadata({ title: "FAQ", description: "d", path: "/faq", config: { siteUrl: "https://n.example", indexable: true } });
  assert.deepEqual(live.robots, { index: true, follow: true });
});
test("una página provisional nunca se indexa, aunque el sitio sea indexable", () => {
  const m = pageMetadata({ title: "Demo", description: "d", path: "/demo", index: false, config: { siteUrl: "https://n.example", indexable: true } });
  assert.deepEqual(m.robots, { index: false, follow: false });
});
test("JSON-LD no puede cerrar el <script> ni inyectar HTML", () => {
  const s = serializeJsonLd({ q: "</script><script>alert(1)</script> & <b>" });
  assert.ok(!s.includes("<") && !s.includes(">") && !s.includes("&"));
  assert.equal(JSON.parse(s).q, "</script><script>alert(1)</script> & <b>");
});
test("Organization sólo incluye sameAs/contactPoint si hay datos reales", () => {
  const empty = organizationLd(readPublicConfig({ APP_URL: "https://n.example" })) as Record<string, unknown>;
  assert.ok(!("sameAs" in empty) && !("contactPoint" in empty));
  const full = organizationLd(readPublicConfig({ APP_URL: "https://n.example", INSTAGRAM_URL: "https://instagram.com/nx", CONTACT_EMAIL: "a@b.co" })) as Record<string, unknown>;
  assert.ok("sameAs" in full && "contactPoint" in full);
});
test("FAQPage refleja exactamente las preguntas dadas; SoftwareApplication no inventa precio", () => {
  const f = faqLd([{ q: "¿A?", a: "B" }]) as { mainEntity: Array<{ name: string }> };
  assert.equal(f.mainEntity.length, 1);
  assert.equal(f.mainEntity[0]!.name, "¿A?");
  assert.ok(!("offers" in (softwareApplicationLd(readPublicConfig({})) as object)));
});

/* ───── Consentimiento ───── */
test("consentimiento: ida y vuelta, versión y manipulación", () => {
  const raw = serializeConsent(ACCEPT_ALL, 1000);
  assert.deepEqual(parseConsent(raw), { v: CONSENT_VERSION, analytics: true, preferences: true, ts: 1000 });
  assert.equal(parseConsent(serializeConsent(REJECT_NON_ESSENTIAL))?.analytics, false);
  assert.equal(parseConsent(undefined), null);
  assert.equal(parseConsent("%E0%A4%A"), null, "URI mal formada no lanza");
  assert.equal(parseConsent(encodeURIComponent(JSON.stringify({ v: 999, analytics: true, preferences: true, ts: 1 }))), null, "versión distinta ⇒ reaparece el banner");
  assert.equal(parseConsent(encodeURIComponent(JSON.stringify({ v: CONSENT_VERSION, analytics: "true", preferences: true, ts: 1 }))), null, "tipos inválidos");
});
test("cookie de consentimiento: SameSite=Lax, Secure sólo en producción, sin HttpOnly (la lee el cliente)", () => {
  assert.match(consentCookieString(ACCEPT_ALL, true), /SameSite=Lax; Secure$/);
  assert.ok(!consentCookieString(ACCEPT_ALL, false).includes("Secure"));
  const header = `otra=1; ${consentCookieString(REJECT_NON_ESSENTIAL, false).split(";")[0]}; x=2`;
  assert.equal(readConsentFromCookieHeader(header)?.analytics, false);
});

/* ───── Formulario de contacto ───── */
test("contacto: datos válidos se normalizan", () => {
  const r = validateContact(base);
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.data.email, "ana@correo.com");
});
test("contacto: errores por campo con mensajes accionables", () => {
  const r = validateContact({ name: "A", email: "x", subject: "hack", message: "corto" });
  assert.ok(!r.ok && !r.spam);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["email", "message", "name", "subject"]);
});
test("contacto: honeypot marca spam", () => {
  const r = validateContact({ ...base, website: "http://spam.example" });
  assert.ok(!r.ok && r.spam);
});
test("contacto: sin inyección de cabeceras ni caracteres de control en nombre y correo", () => {
  const r = validateContact({ ...base, name: "Ana\r\nBcc: victima@x.com", email: "ana@x.com\r\nBcc: v@x.com" });
  assert.ok(!r.ok, "el correo con salto de línea no es válido");
  const ok = validateContact({ ...base, name: "Ana\r\nBcc: v@x.com" });
  assert.ok(ok.ok && !/[\r\n]/.test(ok.data.name));
});
test("contacto: límites de longitud y valores no string", () => {
  assert.ok(!validateContact({ ...base, message: "x".repeat(3001) }).ok);
  assert.ok(!validateContact({ ...base, name: "n".repeat(121) }).ok);
  assert.ok(!validateContact({ name: 5, email: {}, subject: null, message: [] }).ok);
});

/* ───── Rutas ───── */
test("registro de rutas: únicas, con barra inicial; las provisionales no son indexables", () => {
  const paths = PUBLIC_ROUTES.map((r) => r.path);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every((p) => p.startsWith("/")));
  for (const p of ["/iniciar-sesion", "/registro", "/demo"]) assert.equal(PUBLIC_ROUTES.find((r) => r.path === p)!.indexable, false);
});
