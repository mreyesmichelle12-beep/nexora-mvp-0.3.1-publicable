import { test } from "node:test";
import assert from "node:assert/strict";
import { getIntegrationStatuses, isConfigured } from "../src/lib/config/integrations.ts";

test("sin variables, ninguna integración aparece como configurada y se listan las faltantes", () => {
  const all = getIntegrationStatuses({});
  assert.ok(all.every((s) => !s.configured));
  const google = all.find((s) => s.id === "google")!;
  assert.deepEqual(google.missing, ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]);
});

test("una integración sólo se activa con TODAS sus variables", () => {
  assert.equal(isConfigured({ GOOGLE_CLIENT_ID: "x" }, "google"), false);
  assert.equal(isConfigured({ GOOGLE_CLIENT_ID: "x", GOOGLE_CLIENT_SECRET: "y" }, "google"), true);
  assert.equal(isConfigured({ GOOGLE_CLIENT_ID: "  ", GOOGLE_CLIENT_SECRET: "y" }, "google"), false, "espacios no cuentan");
});

test("correo y analítica exigen las variables del proveedor elegido", () => {
  assert.deepEqual(getIntegrationStatuses({ EMAIL_PROVIDER: "smtp" }).find((s) => s.id === "email")!.missing, ["SMTP_URL", "EMAIL_FROM"]);
  assert.deepEqual(getIntegrationStatuses({ EMAIL_PROVIDER: "resend" }).find((s) => s.id === "email")!.missing, ["RESEND_API_KEY", "EMAIL_FROM"]);
  assert.equal(isConfigured({ ANALYTICS_PROVIDER: "ga4", GA4_MEASUREMENT_ID: "G-X" }, "analytics"), true);
});
