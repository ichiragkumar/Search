import { Router, Request, Response } from "express";
import { runSearch } from "./searchRepo";
import { SearchRequest } from "./types";

export const searchRoute = Router();

searchRoute.get("/", async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const pg = (req as any).pg;
    const userId = req.query.userId as string | undefined;

    if (!pg) {
      return res.status(500).json({ error: "Database connection not available" });
    }

    const searchReq: SearchRequest = {
      q: req.query.q as string,
      entityType: req.query.entityType as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor as string | undefined,
      userId,
    };

    if (!searchReq.q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const result = await runSearch(pg, searchReq, tenantId, userId);

    // Log search metrics
    console.log({
      event: "search",
      tenantId,
      query: searchReq.q,
      entityType: searchReq.entityType,
      resultCount: result.results.length,
      cached: result.cached,
      latency: result.latency,
    });

    res.json({
      results: result.results,
      nextCursor: result.nextCursor,
      meta: {
        cached: result.cached,
        latency: result.latency,
        count: result.results.length,
      },
    });
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Search failed",
      message: error.message,
    });
  }
});
