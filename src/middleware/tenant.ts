import { Request, Response, NextFunction } from "express";
import { pool } from "../db";

export async function withTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId = Number(req.header("x-tenant-id"));
  if (!tenantId) return res.status(400).json({ error: "Missing x-tenant-id" });

  // attach a dedicated client per request (so set_config is scoped)
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [String(tenantId)]);
    (req as any).pg = client;
    (req as any).tenantId = tenantId;
    return next();
  } catch (e) {
    client.release();
    return next(e);
  }
}
