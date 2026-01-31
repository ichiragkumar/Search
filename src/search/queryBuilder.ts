import { SearchRequest } from "./types";

export function buildSearchQuery(input: SearchRequest) {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);

  const params: any[] = [];
  const where: string[] = [];
  const order: string[] = [];

  // mandatory tenant isolation is via RLS; here we add optional filters
  if (input.entityType) { params.push(input.entityType); where.push(`entity_type = $${params.length}`); }
  if (input.libraryId)  { params.push(input.libraryId);  where.push(`library_id = $${params.length}`); }
  if (input.status)     { params.push(input.status);     where.push(`status = $${params.length}`); }
  if (input.brand)      { params.push(input.brand);      where.push(`brand_name = $${params.length}`); }

  // search term
  params.push(input.q);
  const qParam = `$${params.length}`;

  // cursor (keyset)
  let cursorClause = "";
  if (input.cursor) {
    const decoded = Buffer.from(input.cursor, "base64").toString("utf8");
    const [ts, id] = decoded.split("|");
    if (ts && id) {
      params.push(ts);
      params.push(Number(id));
      const tsP = `$${params.length - 1}`;
      const idP = `$${params.length}`;
      cursorClause = `AND (updated_at, id) < (${tsP}::timestamptz, ${idP}::bigint)`;
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")} ${cursorClause}` : `WHERE true ${cursorClause}`;

  // scoring
  const sql = `
    SELECT
      id, entity_type, entity_id, primary_code, title, subtitle, brand_name, status, year, attributes, updated_at,
      -- FTS rank
      ts_rank_cd(search_vector, plainto_tsquery('english', ${qParam})) AS fts_rank,
      -- trigram similarity
      GREATEST(similarity(coalesce(primary_code,''), ${qParam}), similarity(coalesce(title,''), ${qParam})) AS trgm_rank
    FROM search.global_search_index
    ${whereSql}
    AND (
      -- FTS hits OR trigram hits
      search_vector @@ plainto_tsquery('english', ${qParam})
      OR similarity(coalesce(primary_code,''), ${qParam}) > 0.2
      OR similarity(coalesce(title,''), ${qParam}) > 0.2
      OR coalesce(technical_ids,'') ILIKE '%' || ${qParam} || '%'
    )
    ORDER BY
      (ts_rank_cd(search_vector, plainto_tsquery('english', ${qParam})) * 0.7
       + GREATEST(similarity(coalesce(primary_code,''), ${qParam}), similarity(coalesce(title,''), ${qParam})) * 0.3
      ) DESC,
      updated_at DESC,
      id DESC
    LIMIT ${limit};
  `;

  return { sql, params, limit };
}
