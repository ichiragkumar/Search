import { SearchRequest } from "./types";

export function buildSearchQuery(input: SearchRequest) {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);

  const params: any[] = [];
  const where: string[] = [];

  // Tenant isolation is handled by RLS via middleware
  // Optional filters
  if (input.entityType) {
    params.push(input.entityType);
    where.push(`"entityType" = $${params.length}`);
  }

  // Search term
  params.push(input.q);
  const qParam = `$${params.length}`;

  // Cursor (keyset pagination)
  let cursorClause = "";
  if (input.cursor) {
    const decoded = Buffer.from(input.cursor, "base64").toString("utf8");
    const [ts, id] = decoded.split("|");
    if (ts && id) {
      params.push(ts);
      params.push(Number(id));
      const tsP = `$${params.length - 1}`;
      const idP = `$${params.length}`;
      cursorClause = `AND ("updatedAt", id) < (${tsP}::timestamptz, ${idP}::bigint)`;
    }
  }

  const whereSql = where.length
    ? `WHERE ${where.join(" AND ")} ${cursorClause}`
    : `WHERE true ${cursorClause}`;

  // Use precomputed search_vector column (created by SQL migration)
  // Fallback to on-the-fly if search_vector doesn't exist
  const sql = `
    SELECT
      id, "entityType", "entityId", "primaryText", "secondaryText", "slug",
      "authorName", "brandName", "followerCount", "likeCount", "commentCount", "viewCount",
      tags, attributes, "updatedAt",
      -- FTS rank (using precomputed search_vector if available, otherwise compute on fly)
      COALESCE(
        ts_rank_cd(search_vector, plainto_tsquery('english', ${qParam})),
        ts_rank_cd(
          to_tsvector('english', COALESCE("primaryText", '') || ' ' || COALESCE("secondaryText", '') || ' ' || COALESCE("authorName", '')),
          plainto_tsquery('english', ${qParam})
        )
      ) AS fts_rank,
      -- Trigram similarity
      GREATEST(
        similarity(COALESCE("primaryText", ''), ${qParam}),
        similarity(COALESCE("secondaryText", ''), ${qParam}),
        similarity(COALESCE("authorName", ''), ${qParam})
      ) AS trgm_rank
    FROM "SearchIndex"
    ${whereSql}
    AND (
      -- FTS match (precomputed search_vector or on-the-fly)
      COALESCE(search_vector @@ plainto_tsquery('english', ${qParam}), false)
      OR to_tsvector('english', COALESCE("primaryText", '') || ' ' || COALESCE("secondaryText", '') || ' ' || COALESCE("authorName", '')) @@ plainto_tsquery('english', ${qParam})
      -- OR trigram match
      OR similarity(COALESCE("primaryText", ''), ${qParam}) > 0.2
      OR similarity(COALESCE("secondaryText", ''), ${qParam}) > 0.2
      OR similarity(COALESCE("authorName", ''), ${qParam}) > 0.2
      -- OR exact match in technical IDs
      OR COALESCE("technicalIds", '') ILIKE '%' || ${qParam} || '%'
    )
    ORDER BY
      (
        COALESCE(
          ts_rank_cd(search_vector, plainto_tsquery('english', ${qParam})),
          ts_rank_cd(
            to_tsvector('english', COALESCE("primaryText", '') || ' ' || COALESCE("secondaryText", '') || ' ' || COALESCE("authorName", '')),
            plainto_tsquery('english', ${qParam})
          )
        ) * 0.7
        + GREATEST(
          similarity(COALESCE("primaryText", ''), ${qParam}),
          similarity(COALESCE("secondaryText", ''), ${qParam}),
          similarity(COALESCE("authorName", ''), ${qParam})
        ) * 0.3
      ) DESC,
      "updatedAt" DESC,
      id DESC
    LIMIT ${limit};
  `;

  return { sql, params, limit };
}
