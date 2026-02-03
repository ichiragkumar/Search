import { Pool, PoolClient } from "pg";

// Primary database (for writes)
export const primaryPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

// Replica database pool (for reads/search)
// Supports multiple replicas with load balancing
const replicaUrls = process.env.REPLICA_DATABASE_URLS
  ? process.env.REPLICA_DATABASE_URLS.split(",").map((url) => url.trim())
  : [process.env.REPLICA_DATABASE_URL || process.env.DATABASE_URL];

export const replicaPools: Pool[] = replicaUrls.map(
  (url) =>
    new Pool({
      connectionString: url,
      max: 20,
    })
);

// Round-robin replica selection
let replicaIndex = 0;
export function getReplicaPool(): Pool {
  const pool = replicaPools[replicaIndex % replicaPools.length];
  replicaIndex++;
  return pool;
}

// Get a client from primary (for writes)
export async function getPrimaryClient(): Promise<PoolClient> {
  return await primaryPool.connect();
}

// Get a client from replica (for reads)
export async function getReplicaClient(): Promise<PoolClient> {
  const pool = getReplicaPool();
  return await pool.connect();
}

// Health check
export async function checkDatabaseHealth(): Promise<{
  primary: boolean;
  replicas: boolean[];
}> {
  const primary = await primaryPool
    .query("SELECT 1")
    .then(() => true)
    .catch(() => false);

  const replicas = await Promise.all(
    replicaPools.map((pool) =>
      pool
        .query("SELECT 1")
        .then(() => true)
        .catch(() => false)
    )
  );

  return { primary, replicas };
}
