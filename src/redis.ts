import Redis from "ioredis";

// L2 Cache: Redis (persistent cache)
export const redisL2 = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// L1 Cache: In-memory cache (fastest, per-process)
// This is a simple Map-based cache with TTL
class L1Cache {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private readonly defaultTTL = 30; // seconds

  set(key: string, value: any, ttl: number = this.defaultTTL): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries periodically
  startCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, intervalMs);
  }
}

export const l1Cache = new L1Cache();
l1Cache.startCleanup();

// Two-tier cache helper
export class TwoTierCache {
  /**
   * Get value from cache (L1 first, then L2)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try L1 first
    const l1Value = l1Cache.get(key);
    if (l1Value !== null) {
      return l1Value as T;
    }

    // Try L2
    try {
      const l2Value = await redisL2.get(key);
      if (l2Value) {
        const parsed = JSON.parse(l2Value);
        // Populate L1 for next time
        l1Cache.set(key, parsed, 30);
        return parsed as T;
      }
    } catch (error) {
      console.error("L2 cache get error:", error);
      // Continue to DB if L2 fails
    }

    return null;
  }

  /**
   * Set value in both L1 and L2
   */
  async set(key: string, value: any, ttl: number = 60): Promise<void> {
    // Set in L1
    l1Cache.set(key, value, ttl);

    // Set in L2
    try {
      await redisL2.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error("L2 cache set error:", error);
      // L1 is still set, so continue
    }
  }

  /**
   * Delete from both L1 and L2
   */
  async delete(key: string): Promise<void> {
    l1Cache.delete(key);
    try {
      await redisL2.del(key);
    } catch (error) {
      console.error("L2 cache delete error:", error);
    }
  }

  /**
   * Invalidate cache for a tenant (for cache invalidation)
   */
  async invalidateTenant(tenantId: number): Promise<void> {
    // This is a simplified version - in production, you'd want to track keys by tenant
    // For now, we'll use a pattern-based approach
    const pattern = `search:tenant:${tenantId}:*`;
    try {
      const keys = await redisL2.keys(pattern);
      if (keys.length > 0) {
        await redisL2.del(...keys);
      }
    } catch (error) {
      console.error("L2 cache invalidation error:", error);
    }
  }
}

export const cache = new TwoTierCache();

// Read-your-write consistency helper
// Tracks recent writes per user to ensure they see their own writes immediately
class WriteTracker {
  private recentWrites: Map<string, Set<string>> = new Map(); // userId -> Set of cache keys
  private readonly writeTTL = 300; // 5 minutes

  trackWrite(userId: string, cacheKey: string): void {
    if (!this.recentWrites.has(userId)) {
      this.recentWrites.set(userId, new Set());
    }
    this.recentWrites.get(userId)!.add(cacheKey);

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.recentWrites.get(userId)?.delete(cacheKey);
      if (this.recentWrites.get(userId)?.size === 0) {
        this.recentWrites.delete(userId);
      }
    }, this.writeTTL * 1000);
  }

  isRecentWrite(userId: string, cacheKey: string): boolean {
    return this.recentWrites.get(userId)?.has(cacheKey) ?? false;
  }

  clearUserWrites(userId: string): void {
    this.recentWrites.delete(userId);
  }
}

export const writeTracker = new WriteTracker();
