/**
 * Estado REAL de cada integración externa. La interfaz usa esto para decir
 * exactamente qué falta, en lugar de simular que la función existe.
 */
export type IntegrationId = "email" | "google" | "storage" | "video" | "realtime" | "ai" | "payments" | "analytics" | "redis";

export interface IntegrationStatus {
  id: IntegrationId;
  label: string;
  configured: boolean;
  missing: string[]; // nombres de variables de entorno faltantes
}

type Env = Record<string, string | undefined>;

const has = (env: Env, k: string) => Boolean(env[k] && env[k]!.trim());

const SPECS: Array<{ id: IntegrationId; label: string; required: (env: Env) => string[] }> = [
  { id: "redis", label: "Redis (rate limiting)", required: () => ["REDIS_URL"] },
  {
    id: "email",
    label: "Correo transaccional",
    required: (e) =>
      e.EMAIL_PROVIDER === "smtp" ? ["EMAIL_PROVIDER", "SMTP_URL", "EMAIL_FROM"] : ["EMAIL_PROVIDER", "RESEND_API_KEY", "EMAIL_FROM"],
  },
  { id: "google", label: "Inicio de sesión con Google", required: () => ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  {
    id: "storage",
    label: "Almacenamiento de archivos",
    required: () => ["STORAGE_ENDPOINT", "STORAGE_BUCKET", "STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY"],
  },
  { id: "video", label: "Video y pantalla compartida", required: () => ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"] },
  { id: "realtime", label: "Pizarra y temporizador en tiempo real", required: () => ["REALTIME_URL", "REALTIME_TOKEN_SECRET"] },
  { id: "ai", label: "NEXORA AI", required: () => ["AI_PROVIDER", "ANTHROPIC_API_KEY"] },
  { id: "payments", label: "Pagos (Plan Pro)", required: () => ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_PRO"] },
  {
    id: "analytics",
    label: "Analítica",
    required: (e) => (e.ANALYTICS_PROVIDER === "ga4" ? ["ANALYTICS_PROVIDER", "GA4_MEASUREMENT_ID"] : ["ANALYTICS_PROVIDER", "PLAUSIBLE_DOMAIN"]),
  },
];

export function getIntegrationStatuses(env: Env): IntegrationStatus[] {
  return SPECS.map((s) => {
    const missing = s.required(env).filter((k) => !has(env, k));
    return { id: s.id, label: s.label, configured: missing.length === 0, missing };
  });
}

export function isConfigured(env: Env, id: IntegrationId): boolean {
  return getIntegrationStatuses(env).find((s) => s.id === id)?.configured ?? false;
}
