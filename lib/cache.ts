/**
 * Simple in-memory cache with TTL support.
 * In production, swap the Map for Redis/Upstash for persistence across
 * serverless function cold-starts.
 */

interface CacheEntry<T> {
  value: T;
  expires: number; // unix ms
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

/** Returns a date-scoped key (resets each calendar day UTC) */
export function dailyKey(prefix: string): string {
  const d = new Date();
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return `${prefix}:${dateStr}`;
}

export const TTL = {
  stories: 15 * 60 * 1000, // 15 minutes — refresh feeds every 15 min
  briefs: 12 * 60 * 60 * 1000, // 12 hours — AI summaries stable all day
};
