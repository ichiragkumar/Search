# Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (with `pg_trgm` extension)
- Redis 6+
- Prisma CLI

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and Redis credentials
```

3. Set up PostgreSQL extensions:
```bash
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

4. Run Prisma migrations:
```bash
npm run prisma:migrate
```

5. Apply SQL migrations for search index:
```bash
psql -d your_database -f src/prisma/migrations/001_search_index_setup.sql
```

6. Generate Prisma client:
```bash
npm run prisma:generate
```

## Database Replica Setup

For production, set up PostgreSQL replicas:

1. Configure primary database (write operations)
2. Configure replica databases (read operations)
3. Set `REPLICA_DATABASE_URL` or `REPLICA_DATABASE_URLS` in `.env`

The system will automatically:
- Route writes to primary
- Route reads to replicas (round-robin)
- Sync search index to all replicas

## Seeding Data

To populate the database with test data:

```bash
npm run seed
```

This will create:
- 50 tables
- 10,000 records per table
- Total: ~500,000 records

**Note:** This may take a while. Consider running in batches for production.

## Running the Service

```bash
npm run dev
```

The service will start on port 3000 (or PORT from .env).

## API Usage

### Search Endpoint

```bash
GET /search?q=query&entityType=user&limit=20&cursor=...
Headers:
  x-tenant-id: 1
  x-user-id: user123 (optional, for read-your-write)
```

### Health Check

```bash
GET /health
```

## Architecture Features

- **Two-Tier Caching**: L1 (in-memory) + L2 (Redis)
- **Read-Your-Write**: Users see their own writes immediately
- **Database Replicas**: Automatic read/write splitting
- **100% Replica Sync**: Search index synced to all replicas
- **Keyset Pagination**: No OFFSET, stable performance
- **Full-Text Search**: PostgreSQL tsvector + pg_trgm

## Performance Targets

- Search latency: < 300ms
- Cache hit rate: > 70%
- Database CPU: Predictable
- Query plan: Index-only scans
