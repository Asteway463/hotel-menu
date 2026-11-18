interface CacheEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Minimal in-process sliding-window rate limiter.
 * Suitable for the local single-server deployment (per email).
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = cache.get(key);
  const allowed = !entry || entry.resetAt < now || entry.count < limit;

  if (!allowed) {
    return {
      allowed: false as const,
      retryAfterSeconds: Math.ceil((entry!.resetAt - now) / 1000),
    };
  }

  const current = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + windowMs };
  current.count += 1;

  if (current.count >= limit) {
    current.resetAt = now + windowMs;
  }

  cache.set(key, current);
  if (cache.size > 10_000) {
    const oldest = [...cache.entries()]
      .sort((a, b) => a[1].resetAt - b[1].resetAt)
      .slice(0, cache.size - 10_000);
    oldest.forEach(([k]) => cache.delete(k));
  }

  return { allowed: true as const, retryAfterSeconds: 0 };
}
