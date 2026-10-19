/**
 * Rate limiting con ventana fija e interfaz de almacén intercambiable.
 * - MemoryStore: desarrollo y pruebas (NO usar en producción con varias instancias).
 * - RedisStore (redis-store.ts): producción.
 */
export interface RateStore {
  /** Incrementa el contador de `key`; crea la ventana si no existe. */
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

export class MemoryStore implements RateStore {
  private data = new Map<string, { count: number; resetAt: number }>();
  private now: () => number;
  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  async hit(key: string, windowMs: number) {
    const t = this.now();
    const cur = this.data.get(key);
    if (!cur || cur.resetAt <= t) {
      const fresh = { count: 1, resetAt: t + windowMs };
      this.data.set(key, fresh);
      return fresh;
    }
    cur.count += 1;
    return { ...cur };
  }
}

export interface RateRule {
  name: string;
  limit: number;
  windowMs: number;
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function rateLimit(
  store: RateStore,
  rule: RateRule,
  subject: string,
  nowMs: number = Date.now(),
): Promise<RateResult> {
  const { count, resetAt } = await store.hit(`rl:${rule.name}:${subject}`, rule.windowMs);
  const allowed = count <= rule.limit;
  return {
    allowed,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((resetAt - nowMs) / 1000)),
  };
}

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Reglas por defecto. Se ajustan con datos reales de uso. */
export const RULES = {
  login: { name: "login", limit: 5, windowMs: 15 * MIN }, // por correo + IP
  loginIp: { name: "login-ip", limit: 30, windowMs: 15 * MIN }, // por IP
  register: { name: "register", limit: 5, windowMs: HOUR },
  passwordReset: { name: "pwd-reset", limit: 3, windowMs: HOUR },
  contact: { name: "contact", limit: 3, windowMs: HOUR },
  upload: { name: "upload", limit: 20, windowMs: HOUR },
  message: { name: "message", limit: 30, windowMs: MIN },
  connectionRequest: { name: "conn-req", limit: 20, windowMs: HOUR },
  report: { name: "report", limit: 10, windowMs: HOUR },
  ai: { name: "ai", limit: 20, windowMs: MIN },
} as const satisfies Record<string, RateRule>;
