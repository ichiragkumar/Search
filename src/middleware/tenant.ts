import { Request, Response, NextFunction } from "express";
import { getPrimaryClient, getReplicaClient } from "../db";

export async function withTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId = Number(req.header("x-tenant-id"));
  if (!tenantId) return res.status(400).json({ error: "Missing x-tenant-id" });

  // For writes, use primary
  // For reads, use replica
  const isWrite = req.method !== "GET" && req.method !== "HEAD";
  const client = isWrite ? await getPrimaryClient() : await getReplicaClient();

  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [String(tenantId)]);
    (req as any).pg = client;
    (req as any).tenantId = tenantId;
    (req as any).isWrite = isWrite;
    return next();
  } catch (e) {
    client.release();
    return next(e);
  }
}

export async function releasePg(req: Request, res: Response, next: NextFunction) {
  res.on("finish", () => {
    const client = (req as any).pg;
    if (client) {
      if ((req as any).isWrite) {
        client.query("COMMIT").catch(() => {
          client.query("ROLLBACK").finally(() => client.release());
        });
      } else {
        client.query("ROLLBACK").finally(() => client.release());
      }
    }
  });
  next();
}
