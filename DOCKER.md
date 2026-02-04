# Docker Setup Guide

This guide will help you run the entire search service stack locally using Docker Compose.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- At least 4GB of available RAM
- Ports 3000, 5432, 5433, 6379 available

## Quick Start

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f app
   ```

3. **Check health:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Services

The Docker Compose setup includes:

- **postgres-primary** (port 5432): Primary database for writes
- **postgres-replica** (port 5433): Replica database for reads
- **redis** (port 6379): Redis cache
- **app** (port 3000): Node.js application

## Seeding Data

To populate the database with test data:

```bash
# Enter the app container
docker-compose exec app sh

# Run the seed script
npm run seed
```

**Note:** Seeding 500,000 records may take 10-30 minutes depending on your machine.

## Database Access

### Primary Database
```bash
docker-compose exec postgres-primary psql -U postgres -d search_db
```

### Replica Database
```bash
docker-compose exec postgres-replica psql -U postgres -d search_db
```

### Redis CLI
```bash
docker-compose exec redis redis-cli
```

## Prisma Studio

Access Prisma Studio to view/edit data:

```bash
docker-compose exec app npx prisma studio
```

Then open http://localhost:5555 in your browser.

## Volumes

Data is persisted in Docker volumes:
- `postgres-primary-data`: Primary database data
- `postgres-replica-data`: Replica database data
- `redis-data`: Redis data

To remove all data:
```bash
docker-compose down -v
```

## Development

The `src` and `prisma` directories are mounted as volumes, so code changes are reflected immediately (after restart if needed).

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart
```

### Database connection errors
```bash
# Check if databases are healthy
docker-compose ps

# Wait a bit longer for databases to initialize
docker-compose up -d
sleep 10
docker-compose restart app
```

### Reset everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

### View service status
```bash
docker-compose ps
```

### Access application logs
```bash
docker-compose logs -f app
```

### Access database logs
```bash
docker-compose logs -f postgres-primary
docker-compose logs -f postgres-replica
```

## Environment Variables

Default environment variables are set in `docker-compose.yml`. To override:

1. Create `docker-compose.override.yml` (copy from `docker-compose.override.yml.example`)
2. Modify environment variables as needed
3. Restart: `docker-compose up -d`

## Production Considerations

For production:
- Use environment-specific `.env` files
- Set strong database passwords
- Enable SSL for database connections
- Use managed Redis (AWS ElastiCache, etc.)
- Set up proper backup strategies
- Configure resource limits in docker-compose.yml

## API Testing

Once services are running:

```bash
# Health check
curl http://localhost:3000/health

# Search (replace tenant-id with actual tenant ID)
curl "http://localhost:3000/search?q=test&limit=10" \
  -H "x-tenant-id: 1"
```
