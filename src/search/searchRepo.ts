import { buildSearchQuery } from "./queryBuilder";
import { SearchRequest, SearchResult, SearchResponse } from "./types";
import { cache, writeTracker } from "../redis";
import crypto from "crypto";

export async function runSearch(
  pg: any,
  req: SearchRequest,
  tenantId: number,
  userId?: string
): Promise<SearchResponse> {
  const startTime = Date.now();

  // Build cache key
  const cacheKey = buildCacheKey(tenantId, req);

  // Check read-your-write: if user recently wrote, bypass cache
  const shouldBypassCache =
    userId && writeTracker.isRecentWrite(userId, cacheKey);

  let cached = false;
  let results: SearchResult[] = [];
  let nextCursor: string | null = null;

  if (!shouldBypassCache) {
    // Try cache first
    const cachedResult = await cache.get<{
      results: SearchResult[];
      nextCursor: string | null;
    }>(cacheKey);

    if (cachedResult) {
      cached = true;
      results = cachedResult.results;
      nextCursor = cachedResult.nextCursor;
    }
  }

  // If not cached or bypassing cache, query database
  if (!cached) {
    const { sql, params, limit } = buildSearchQuery(req);
    const { rows } = await pg.query(sql, params);

    // Transform results
    results = rows.map((row: any) => ({
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      primaryText: row.primaryText,
      secondaryText: row.secondaryText,
      slug: row.slug,
      authorName: row.authorName,
      brandName: row.brandName,
      followerCount: row.followerCount,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      viewCount: row.viewCount,
      tags: row.tags || [],
      attributes: row.attributes,
      updatedAt: row.updatedAt,
    }));

    // Build next cursor
    nextCursor =
      rows.length === limit
        ? Buffer.from(
            `${rows[rows.length - 1].updatedAt.toISOString()}|${rows[rows.length - 1].id}`,
            "utf8"
          ).toString("base64")
        : null;

    // Cache the result (60 seconds TTL)
    await cache.set(
      cacheKey,
      { results, nextCursor },
      60
    );
  }

  const latency = Date.now() - startTime;

  return { results, nextCursor, cached, latency };
}

function buildCacheKey(tenantId: number, req: SearchRequest): string {
  // Create a deterministic cache key from search parameters
  const keyParts = [
    "search",
    `tenant:${tenantId}`,
    `q:${req.q}`,
    req.entityType ? `type:${req.entityType}` : "",
    req.cursor ? `cursor:${req.cursor}` : "",
    req.limit ? `limit:${req.limit}` : "",
  ]
    .filter(Boolean)
    .join(":");

  // Hash for shorter keys
  return `cache:${crypto.createHash("md5").update(keyParts).digest("hex")}`;
}

// Track a write for read-your-write consistency
export function trackWrite(userId: string, tenantId: number, entityType: string): void {
  // Invalidate all search caches for this tenant
  cache.invalidateTenant(tenantId).catch((err) => {
    console.error("Error invalidating tenant cache:", err);
  });

  // Track recent writes for this user
  // This ensures they see their own writes immediately
  const cacheKeyPattern = `search:tenant:${tenantId}:*`;
  writeTracker.trackWrite(userId, cacheKeyPattern);
}
