import { test } from "node:test";
import assert from "node:assert/strict";
import { handleContact, type ContactDeps } from "../src/lib/contact-service.ts";

const good = { name: "Ana Pérez", email: "ana@correo.com", subject: "alianzas", message: "Hola, quisiera conversar sobre una colaboración." };

function deps(over: Partial<ContactDeps> = {}) {
  const saved: unknown[] = [];
  const d: ContactDeps = {
    clientKey: "hash123", dbConfigured: true,
    rateLimit: async () => ({ allowed: true, retryAfterSeconds: 0 }),
    save: async (x) => { saved.push(x); },
    ...over,
  };
  return { d, saved };
}

test("envío válido: se guarda y se confirma", async () => {
  const { d, saved } = deps();
  const r = await handleContact(good, d);
  assert.equal(r.status, "success");
  assert.equal(saved.length, 1);
  assert.equal((saved[0] as { subjectLabel: string }).subjectLabel, "Alianzas y colaboración");
});
test("honeypot: respuesta neutra pero NO se guarda ni se consume límite", async () => {
  let rl = 0;
  const { d, saved } = deps({ rateLimit: async () => { rl++; return { allowed: true, retryAfterSeconds: 0 }; } });
  const r = await handleContact({ ...good, website: "x" }, d);
  assert.equal(r.status, "success");
  assert.equal(saved.length, 0);
  assert.equal(rl, 0);
});
test("datos inválidos: errores por campo, sin guardar ni consumir límite", async () => {
  let rl = 0;
  const { d, saved } = deps({ rateLimit: async () => { rl++; return { allowed: true, retryAfterSeconds: 0 }; } });
  const r = await handleContact({ ...good, email: "mal", message: "corto" }, d);
  assert.equal(r.status, "error");
  assert.ok(r.status === "error" && r.errors?.email && r.errors?.message);
  assert.equal(saved.length, 0);
  assert.equal(rl, 0);
});
test("rate limit: bloquea, informa el tiempo y no guarda", async () => {
  const { d, saved } = deps({ rateLimit: async () => ({ allowed: false, retryAfterSeconds: 1800 }) });
  const r = await handleContact(good, d);
  assert.ok(r.status === "error" && /30 min/.test(r.message));
  assert.equal(saved.length, 0);
});
test("sin base de datos: error honesto, NUNCA un éxito falso", async () => {
  const { d, saved } = deps({ dbConfigured: false });
  const r = await handleContact(good, d);
  assert.equal(r.status, "error");
  assert.equal(saved.length, 0);
});
test("fallo al guardar: error, conserva lo escrito y no filtra detalles internos", async () => {
  const logs: string[] = [];
  const { d } = deps({ save: async () => { throw new Error("connection refused 10.0.0.5 password=secreto"); }, log: (e) => logs.push(e) });
  const r = await handleContact(good, d);
  assert.ok(r.status === "error" && r.values?.name === "Ana Pérez");
  assert.ok(!JSON.stringify(r).includes("secreto") && !JSON.stringify(r).includes("10.0.0.5"));
  assert.ok(!logs.join().includes("ana@correo.com"), "el log no contiene datos personales");
});
test("la IP desconocida no se guarda como hash", async () => {
  const { d, saved } = deps({ clientKey: "unknown" });
  await handleContact(good, d);
  assert.equal((saved[0] as { ipHash: string | null }).ipHash, null);
});
