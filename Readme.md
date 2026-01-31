Perfect, this is exactly the right moment to lock **architecture + README** 👍
I’ll give you:

1. **A clean README.md** you can literally paste into your repo
2. **Mandatory architecture principles** you *must* follow (and why)
3. **System architecture diagram (explained in words)**
4. **Non-negotiable design rules** (the stuff that saves you from pain later)

This is written like a **real production service**, not a toy search.

---

# 1️⃣ README.md (Production-ready)

You can copy this as-is.

---

## 🔍 Search Service (Node.js + Express + TypeScript + PostgreSQL)

A high-performance, multi-tenant search engine built on **PostgreSQL Full-Text Search**, **pg_trgm fuzzy matching**, and a **denormalized search index table**, designed for scalability and low latency.

---

## ✨ Features

* ⚡ Sub-300ms search responses
* 🧠 Full-Text Search (Postgres `tsvector`)
* 🔎 Fuzzy & partial matching (`pg_trgm`)
* 🧱 Denormalized search index (no runtime joins)
* 🔐 Multi-tenant isolation using Postgres RLS
* 📄 Keyset pagination (no OFFSET)
* 🚀 Redis cache-aside strategy
* 🧩 Entity-agnostic (styles, products, users, etc.)
* 🛠 Built with Express + TypeScript

---

## 🏗 High-Level Architecture

```
                ┌────────────┐
                │   Client   │
                └─────┬──────┘
                      │
               HTTP /search
                      │
        ┌─────────────▼─────────────┐
        │   Express Search API      │
        │  (TypeScript, Validation)│
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Redis Cache (Read)      │
        │  cache-aside strategy     │
        └─────────────┬─────────────┘
              cache miss
                      │
        ┌─────────────▼─────────────┐
        │ PostgreSQL Search Index   │
        │ - tsvector (FTS)          │
        │ - pg_trgm (fuzzy)         │
        │ - GIN indexes             │
        │ - RLS (tenant isolation)  │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Redis Cache (Write)     │
        └───────────────────────────┘
```

---

## 🧠 Core Concept

Instead of running expensive joins across multiple tables at query time, this service maintains a **flattened search index table** that contains all searchable and filterable data.

Search is performed **only on the index table**, making queries predictable, fast, and easy to optimize.

---

## 📦 Tech Stack

| Layer      | Technology                   |
| ---------- | ---------------------------- |
| API        | Express + TypeScript         |
| Database   | PostgreSQL                   |
| Search     | `tsvector`, `pg_trgm`, `GIN` |
| Cache      | Redis                        |
| Pagination | Keyset (cursor-based)        |
| Security   | Postgres RLS                 |

---

## 🗂 Folder Structure

```
src/
│
├── app.ts                  # App bootstrap
├── db.ts                   # PostgreSQL pool
├── redis.ts                # Redis client
│
├── middleware/
│   └── tenant.ts           # RLS tenant injection
│
├── search/
│   ├── searchRoute.ts      # /search API
│   ├── searchRepo.ts       # DB access layer
│   ├── queryBuilder.ts    # Dynamic SQL builder
│   └── types.ts            # Search DTOs
│
└── workers/
    └── indexer.ts          # Async search index updater
```

---

## 🔐 Multi-Tenancy

Tenant isolation is enforced at **database level** using **Row Level Security (RLS)**.

Every request:

1. Extracts `x-tenant-id`
2. Sets `app.current_tenant_id` in Postgres
3. All queries are automatically tenant-scoped

This prevents cross-tenant data leaks even in case of bugs.

---

## 🔎 Search Strategy

The engine combines multiple search techniques:

| Type        | Technique                 |
| ----------- | ------------------------- |
| Exact / IDs | `ILIKE`, trigram          |
| Fuzzy       | `pg_trgm` similarity      |
| Text        | `tsvector + ts_rank`      |
| Ranking     | Weighted hybrid score     |
| Filters     | Indexed columns / JSONB   |
| Pagination  | `(updated_at, id)` cursor |

---

## 🚀 Caching Strategy

* Cache-aside pattern
* Redis used for **read optimization**
* Short TTL (30–120 seconds)
* Cache key includes:

  * tenant
  * query
  * filters
  * pagination cursor
* Tenant versioning used for safe invalidation

---

## 🧪 Pagination

Cursor-based pagination (keyset):

```text
(updated_at, id) < (cursor.updated_at, cursor.id)
```

Why:

* No performance degradation
* Stable ordering
* Works on large datasets

---

## 🔄 Index Synchronization

Search index is updated via **async workers**:

1. Core entity changes (create/update/delete)
2. Event published / job enqueued
3. Worker rebuilds flattened row
4. UPSERT into search index table
5. Cache invalidation triggered

---

## 🛡 Non-Goals

* ❌ No joins at query time
* ❌ No OFFSET pagination
* ❌ No ORM-generated dynamic queries
* ❌ No synchronous index rebuilding

---

## 📈 Performance Targets

| Metric         | Target           |
| -------------- | ---------------- |
| Search latency | < 300ms          |
| Cache hit      | > 70%            |
| DB CPU         | Predictable      |
| Query plan     | Index-only scans |

---

## 🧩 Extending the Engine

To add a new entity:

1. Define searchable fields
2. Map to index schema
3. Build indexer payload
4. Deploy — no API change needed

---

## 🧠 Philosophy

> “Search is a **read problem**, not a write problem.”

We optimize heavily for reads and accept slightly more complex writes.

---

# 2️⃣ MUST-FOLLOW ARCHITECTURE PRINCIPLES (Non-Negotiable)

These are **hard rules**. Break them and your search will suffer.

---

## 1. **Denormalize Everything**

**Rule:**
Search queries must hit **ONE table only**.

❌ Joins
❌ Runtime aggregation
❌ Subqueries on hot path

✔ Precompute
✔ Flatten
✔ Store redundantly

---

## 2. **Database Is the Search Engine**

**Rule:**
Postgres is not “just storage”.

You must use:

* `tsvector`
* `pg_trgm`
* `GIN` indexes
* Query plans (`EXPLAIN ANALYZE`)

If you treat Postgres like MySQL → performance death ☠️

---

## 3. **Security at DB Level (RLS)**

**Rule:**
Never rely only on API filters for tenant isolation.

✔ RLS
✔ `set_config()` per request
✔ Least-privilege DB role

---

## 4. **Keyset Pagination Only**

**Rule:**
OFFSET is banned.

Why:

* OFFSET = O(n) skip
* Keyset = O(1)

---

## 5. **Async Indexing**

**Rule:**
Search index updates must **never block user writes**.

✔ Events
✔ Workers
✔ Idempotent UPSERTs

---

## 6. **Cache Is an Optimization, Not Truth**

**Rule:**
Redis can fail.

✔ DB is source of truth
✔ Cache-aside pattern
✔ Short TTL + versioning

---

## 7. **Observability Is Mandatory**

You must log:

* search latency
* DB time vs cache time
* query text (sanitized)
* result count

Search issues are invisible without logs.

---

# 3️⃣ When This Architecture Breaks (And What To Do)

| Problem             | Fix                        |
| ------------------- | -------------------------- |
| Search > 500ms      | Add index / reduce ranking |
| High DB load        | Increase cache TTL         |
| Wrong results       | Fix denormalization logic  |
| Cache inconsistency | Tenant version bump        |
| Ranking feels off   | Adjust weights             |

---