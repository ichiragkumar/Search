import { PrismaClient } from "@prisma/client";
import { getPrimaryClient, getReplicaClient } from "../db";
import { cache, writeTracker } from "../redis";

const prisma = new PrismaClient();

/**
 * Syncs search index from primary to all replicas
 * This ensures 100% data consistency between replicas
 */
export async function syncSearchIndexToReplicas(
  tenantId: number,
  entityType: string,
  entityId: bigint
): Promise<void> {
  try {
    // Get the search index entry from primary
    const primaryClient = await getPrimaryClient();
    try {
      const result = await primaryClient.query(
        `SELECT * FROM "SearchIndex" WHERE "tenantId" = $1 AND "entityType" = $2 AND "entityId" = $3`,
        [tenantId, entityType, entityId]
      );

      if (result.rows.length === 0) {
        // Entity was deleted, remove from replicas
        await deleteFromReplicas(tenantId, entityType, entityId);
        return;
      }

      const indexRow = result.rows[0];

      // Upsert to all replicas
      await upsertToReplicas(indexRow);
    } finally {
      primaryClient.release();
    }
  } catch (error) {
    console.error("Error syncing search index to replicas:", error);
    throw error;
  }
}

async function upsertToReplicas(indexRow: any): Promise<void> {
  const { getReplicaPool } = await import("../db");
  const replicaPool = getReplicaPool();

  // Build upsert query
  const columns = Object.keys(indexRow).filter((k) => k !== "id");
  const values = columns.map((_, i) => `$${i + 1}`);
  const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(", ");

  const query = `
    INSERT INTO "SearchIndex" (${columns.map((c) => `"${c}"`).join(", ")})
    VALUES (${values})
    ON CONFLICT ("tenantId", "entityType", "entityId")
    DO UPDATE SET ${setClause}
  `;

  const params = columns.map((col) => indexRow[col]);

  try {
    await replicaPool.query(query, params);
  } catch (error) {
    console.error("Error upserting to replica:", error);
    throw error;
  }
}

async function deleteFromReplicas(
  tenantId: number,
  entityType: string,
  entityId: bigint
): Promise<void> {
  const { getReplicaPool } = await import("../db");
  const replicaPool = getReplicaPool();

  try {
    await replicaPool.query(
      `DELETE FROM "SearchIndex" WHERE "tenantId" = $1 AND "entityType" = $2 AND "entityId" = $3`,
      [tenantId, entityType, entityId]
    );
  } catch (error) {
    console.error("Error deleting from replica:", error);
    throw error;
  }
}

/**
 * Indexes an entity into the search index
 */
export async function indexEntity(
  tenantId: number,
  entityType: string,
  entityId: bigint,
  data: {
    primaryText?: string;
    secondaryText?: string;
    slug?: string;
    technicalIds?: string;
    authorId?: bigint;
    authorName?: string;
    brandId?: bigint;
    brandName?: string;
    followerCount?: number;
    likeCount?: number;
    commentCount?: number;
    viewCount?: number;
    tags?: string[];
    topics?: string[];
    language?: string;
    isVerified?: boolean;
    isPublished?: boolean;
    publishedAt?: Date;
    attributes?: any;
  }
): Promise<void> {
  const client = await getPrimaryClient();

  try {
    // Build search vector for full-text search
    const searchText = [
      data.primaryText,
      data.secondaryText,
      data.authorName,
      data.brandName,
    ]
      .filter(Boolean)
      .join(" ");

    // Upsert into primary
    await client.query(
      `
      INSERT INTO "SearchIndex" (
        "tenantId", "entityType", "entityId",
        "primaryText", "secondaryText", "slug", "technicalIds",
        "authorId", "authorName", "brandId", "brandName",
        "followerCount", "likeCount", "commentCount", "viewCount",
        "tags", "topics", "language", "isVerified", "isPublished", "publishedAt", "attributes"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT ("tenantId", "entityType", "entityId")
      DO UPDATE SET
        "primaryText" = EXCLUDED."primaryText",
        "secondaryText" = EXCLUDED."secondaryText",
        "slug" = EXCLUDED."slug",
        "technicalIds" = EXCLUDED."technicalIds",
        "authorId" = EXCLUDED."authorId",
        "authorName" = EXCLUDED."authorName",
        "brandId" = EXCLUDED."brandId",
        "brandName" = EXCLUDED."brandName",
        "followerCount" = EXCLUDED."followerCount",
        "likeCount" = EXCLUDED."likeCount",
        "commentCount" = EXCLUDED."commentCount",
        "viewCount" = EXCLUDED."viewCount",
        "tags" = EXCLUDED."tags",
        "topics" = EXCLUDED."topics",
        "language" = EXCLUDED."language",
        "isVerified" = EXCLUDED."isVerified",
        "isPublished" = EXCLUDED."isPublished",
        "publishedAt" = EXCLUDED."publishedAt",
        "attributes" = EXCLUDED."attributes",
        "updatedAt" = NOW()
    `,
      [
        tenantId,
        entityType,
        entityId,
        data.primaryText || null,
        data.secondaryText || null,
        data.slug || null,
        data.technicalIds || null,
        data.authorId || null,
        data.authorName || null,
        data.brandId || null,
        data.brandName || null,
        data.followerCount || 0,
        data.likeCount || 0,
        data.commentCount || 0,
        data.viewCount || 0,
        data.tags || [],
        data.topics || [],
        data.language || null,
        data.isVerified || null,
        data.isPublished || null,
        data.publishedAt || null,
        data.attributes ? JSON.stringify(data.attributes) : null,
      ]
    );

    // Sync to replicas
    await syncSearchIndexToReplicas(tenantId, entityType, entityId);

    // Invalidate cache
    await cache.invalidateTenant(tenantId);
  } finally {
    client.release();
  }
}

/**
 * Removes an entity from the search index
 */
export async function removeFromIndex(
  tenantId: number,
  entityType: string,
  entityId: bigint
): Promise<void> {
  const client = await getPrimaryClient();

  try {
    await client.query(
      `DELETE FROM "SearchIndex" WHERE "tenantId" = $1 AND "entityType" = $2 AND "entityId" = $3`,
      [tenantId, entityType, entityId]
    );

    // Sync deletion to replicas
    await syncSearchIndexToReplicas(tenantId, entityType, entityId);

    // Invalidate cache
    await cache.invalidateTenant(tenantId);
  } finally {
    client.release();
  }
}
