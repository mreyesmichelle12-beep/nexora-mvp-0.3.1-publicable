import { MemoryStore, type RateStore } from "./rate-limit.ts";
import { RedisStore, type RedisLike } from "./redis-store.ts";

/**
 * Almacén de rate limiting de la aplicación. Con REDIS_URL usa Redis (correcto con varias instancias).
 * Sin Redis usa memoria: válido para desarrollo, NO para producción con más de una instancia (se avisa en logs).
 * Si Redis falla en tiempo de ejecución, cae a memoria en vez de dejar el formulario sin protección.
 */
const g = globalThis as unknown as { __nexoraMem?: MemoryStore; __nexoraRate?: Promise<RateStore> };

function memory(): MemoryStore {
  g.__nexoraMem ??= new MemoryStore();
  return g.__nexoraMem;
}

class FallbackStore implements RateStore {
  private primary: RateStore;
  constructor(primary: RateStore) { this.primary = primary; }
  async hit(key: string, windowMs: number) {
    try {
      return await this.primary.hit(key, windowMs);
    } catch {
      console.error("rate-limit: Redis no disponible, usando memoria temporalmente");
      return memory().hit(key, windowMs);
    }
  }
}

export function getRateStore(): Promise<RateStore> {
  g.__nexoraRate ??= (async () => {
    const url = process.env.REDIS_URL?.trim();
    if (!url) {
      if (process.env.NODE_ENV === "production") console.warn("rate-limit: REDIS_URL no configurada; se usa memoria (insuficiente con varias instancias)");
      return memory();
    }
    const { default: Redis } = await import("ioredis");
    const client = new Redis(url, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: false });
    client.on("error", () => { /* el fallback ya cubre los errores por operación */ });
    return new FallbackStore(new RedisStore(client as unknown as RedisLike));
  })();
  return g.__nexoraRate;
}
