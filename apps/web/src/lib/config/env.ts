import { z } from "zod";

/**
 * Validación de variables de entorno al arrancar. Si falta algo obligatorio, el
 * servidor falla con un mensaje claro en lugar de comportarse mal en silencio.
 * Sólo se validan las variables del núcleo; el resto se evalúa en integrations.ts.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET debe tener al menos 32 caracteres"),
  LOG_PEPPER: z.string().min(16, "LOG_PEPPER debe tener al menos 16 caracteres"),
  SITE_INDEXABLE: z.enum(["true", "false"]).default("false"),
  DEMO_ENABLED: z.enum(["true", "false"]).default("true"),
  CONTACT_EMAIL: z.string().email().optional().or(z.literal("")),
  INSTAGRAM_URL: z.string().url().optional().or(z.literal("")),
  INSTAGRAM_USERNAME: z.string().optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Configuración inválida. Revisa .env.local:\n${lines}`);
  }
  cached = parsed.data;
  return cached;
}
