import type { RateStore } from "./rate-limit.ts";

/** Subconjunto mínimo de ioredis que necesitamos (facilita pruebas y evita acoplarse). */
export interface RedisLike {
  eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
}

// INCR atómico + PEXPIRE sólo al crear la ventana; devuelve {count, ttl_ms}.
const SCRIPT = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
return {c, ttl}
`;

export class RedisStore implements RateStore {
  private redis: RedisLike;
  constructor(redis: RedisLike) {
    this.redis = redis;
  }
  async hit(key: string, windowMs: number) {
    const [count, ttl] = (await this.redis.eval(SCRIPT, 1, key, windowMs)) as [number, number];
    return { count, resetAt: Date.now() + Math.max(ttl, 0) };
  }
}
