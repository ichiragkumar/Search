import { buildSearchQuery } from "./queryBuilder";
import { SearchRequest } from "./types";

export async function runSearch(pg: any, req: SearchRequest) {
  const { sql, params, limit } = buildSearchQuery(req);
  const { rows } = await pg.query(sql, params);

  const nextCursor =
    rows.length === limit
      ? Buffer.from(`${rows[rows.length - 1].updated_at.toISOString()}|${rows[rows.length - 1].id}`, "utf8").toString("base64")
      : null;

  return { results: rows, nextCursor };
}
