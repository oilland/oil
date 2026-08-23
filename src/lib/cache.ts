// Tiny cache abstraction: uses Redis when REDIS_URL is set, otherwise in-memory.
// Keeps the app dependency-light and lets the same code run in dev, demo and prod.

type RedisLike = {
  status: string;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttl: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
};

let redisClient: RedisLike | null = null;
let redisFailed = false;

const mem = new Map<string, { value: string; expires: number }>();

async function getRedis(): Promise<RedisLike | null> {
  if (!process.env.REDIS_URL || redisFailed) return null;
  if (redisClient) return redisClient;
  try {
    const { default: Redis } = await import('ioredis');
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false
    });
    client.on('error', () => {
      redisFailed = true;
      redisClient = null;
    });
    await client.connect();
    redisClient = client as unknown as RedisLike;
    return redisClient;
  } catch {
    redisFailed = true;
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (redis && redis.status === 'ready') {
    try {
      const raw = await redis.get(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
  }
  const hit = mem.get(key);
  if (hit) {
    if (hit.expires > Date.now()) return JSON.parse(hit.value) as T;
    mem.delete(key);
  }
  return null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const redis = await getRedis();
  if (redis && redis.status === 'ready') {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch {
      /* ignore */
    }
  }
  mem.set(key, { value: JSON.stringify(value), expires: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedis();
  if (redis && redis.status === 'ready') {
    try {
      await redis.del(key);
    } catch {
      /* ignore */
    }
  }
  mem.delete(key);
}
