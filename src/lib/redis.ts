/**
 * Dramzy — Unified Redis Client
 *
 * Supports three modes, auto-detected from environment variables:
 *
 *  1. Upstash via @upstash/redis package (recommended for Vercel/serverless)
 *     REDIS_URL  = https://your-instance.upstash.io
 *     REDIS_TOKEN = your-token
 *
 *  2. Standard redis:// via ioredis (Railway, Render, Fly.io, local Docker)
 *     REDIS_URL  = redis://default:password@host:6379
 *     (install ioredis: pnpm add ioredis)
 *
 *  3. No-op / disabled — gracefully skips when Redis is not configured
 *     Leave REDIS_URL unset.
 *
 * Usage:
 *   import { redis } from "@/lib/redis"
 *   await redis.set("key", "value", { ex: 60 })
 *   const val = await redis.get("key")
 */

export interface RedisSetOptions {
  /** Expire in seconds */
  ex?: number;
  /** Expire in milliseconds */
  px?: number;
  /** Only set if not exists */
  nx?: boolean;
}

export interface IRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: RedisSetOptions): Promise<"OK" | null>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, fields: Record<string, string>): Promise<number>;
  hgetall(key: string): Promise<Record<string, string> | null>;
  ping(): Promise<string>;
}

// ── No-op client ──────────────────────────────────────────────────────────────
function makeNoopClient(): IRedis {
  const w = (m: string) =>
    console.warn(`[Dramzy/Redis] Not configured — ${m}() skipped.`);
  return {
    get: async (k) => { w("get"); return null; },
    set: async () => { w("set"); return null; },
    del: async () => { w("del"); return 0; },
    incr: async () => { w("incr"); return 0; },
    expire: async () => { w("expire"); return 0; },
    hget: async () => { w("hget"); return null; },
    hset: async () => { w("hset"); return 0; },
    hgetall: async () => { w("hgetall"); return null; },
    ping: async () => "PONG",
  };
}

// ── Upstash REST client (no extra package needed) ─────────────────────────────
function makeUpstashClient(url: string, token: string): IRedis {
  async function call<T>(pipeline: unknown[]): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    // Single command response: { result: ... }
    return (json.result ?? json[0]?.result ?? null) as T;
  }

  async function cmd<T>(...args: unknown[]): Promise<T> {
    return call<T>([args]);
  }

  return {
    get: (k) => cmd("GET", k),
    set: (k, v, opts) => {
      const args: unknown[] = ["SET", k, v];
      if (opts?.ex) args.push("EX", opts.ex);
      if (opts?.px) args.push("PX", opts.px);
      if (opts?.nx) args.push("NX");
      return cmd(...args);
    },
    del: (...keys) => cmd("DEL", ...keys),
    incr: (k) => cmd("INCR", k),
    expire: (k, s) => cmd("EXPIRE", k, s),
    hget: (k, f) => cmd("HGET", k, f),
    hset: (k, fields) => {
      const flat = Object.entries(fields).flat();
      return cmd("HSET", k, ...flat);
    },
    hgetall: (k) => cmd("HGETALL", k),
    ping: () => cmd("PING"),
  };
}

// ── ioredis client (standard redis://) ───────────────────────────────────────
function makeIoredisClient(url: string): IRedis {
  // Dynamic import so Next.js doesn't bundle ioredis into edge runtimes
  let _client: any;
  async function client() {
    if (!_client) {
      try {
        const { default: Redis } = await import("ioredis");
        _client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 3 });
        await _client.connect().catch(() => {}); // ignore if already connecting
      } catch (e) {
        console.error("[Dramzy/Redis] Failed to initialise ioredis:", e);
        return null;
      }
    }
    return _client;
  }

  async function run<T>(fn: (c: any) => Promise<T>): Promise<T | null> {
    const c = await client();
    if (!c) return null;
    return fn(c);
  }

  return {
    get: (k) => run((c) => c.get(k)),
    set: (k, v, opts) =>
      run((c) => {
        if (opts?.ex) return c.set(k, v, "EX", opts.ex);
        if (opts?.px) return c.set(k, v, "PX", opts.px);
        return c.set(k, v);
      }),
    del: (...keys) => run((c) => c.del(...keys)) as Promise<number>,
    incr: (k) => run((c) => c.incr(k)) as Promise<number>,
    expire: (k, s) => run((c) => c.expire(k, s)) as Promise<number>,
    hget: (k, f) => run((c) => c.hget(k, f)),
    hset: (k, fields) =>
      run((c) => c.hset(k, fields)) as Promise<number>,
    hgetall: (k) => run((c) => c.hgetall(k)),
    ping: () => run((c) => c.ping()) as Promise<string>,
  };
}

// ── Factory ───────────────────────────────────────────────────────────────────
function createClient(): IRedis {
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;

  if (!url) return makeNoopClient();

  if ((url.startsWith("https://") || url.startsWith("http://")) && token) {
    // Upstash REST (no package needed)
    return makeUpstashClient(url, token);
  }

  if (url.startsWith("redis://") || url.startsWith("rediss://")) {
    // Standard Redis via ioredis
    return makeIoredisClient(url);
  }

  console.warn("[Dramzy/Redis] Unrecognised REDIS_URL format. Redis disabled.");
  return makeNoopClient();
}

// Global singleton to survive Next.js HMR
const g = global as typeof global & { __dramzy_redis?: IRedis };
export const redis: IRedis = g.__dramzy_redis ?? (g.__dramzy_redis = createClient());

// Convenience re-export for easy caching helpers
export async function getCache<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = 300,
): Promise<void> {
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}
