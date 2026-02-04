# Quick Start Guide

Get the search service running in 3 steps!

## Step 1: Start Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL primary (port 5432)
- PostgreSQL replica (port 5433)  
- Redis (port 6379)
- Node.js app (port 3000)

## Step 2: Verify Health

```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "database": {
    "primary": "healthy",
    "replicas": [{"replica": 1, "status": "healthy"}]
  }
}
```

## Step 3: Test Search

```bash
curl "http://localhost:3000/search?q=test&limit=10" \
  -H "x-tenant-id: 1"
```

## Optional: Seed Data

To populate with 500,000 test records:

```bash
docker-compose exec app npm run seed
```

⚠️ **Note:** This takes 10-30 minutes depending on your machine.

## Useful Commands

```bash
# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Restart services
npm run docker:restart

# Access app container
npm run docker:exec

# View running services
npm run docker:ps
```

## Next Steps

- Read [DOCKER.md](./DOCKER.md) for detailed Docker instructions
- Read [SETUP.md](./SETUP.md) for manual setup
- Read [IMPLEMENTATION.md](./IMPLEMENTATION.md) for architecture details

## Troubleshooting

**Services won't start?**
```bash
docker-compose down -v
docker-compose up -d --build
```

**Can't connect to database?**
Wait a few seconds for databases to initialize, then:
```bash
docker-compose restart app
```

**Need to reset everything?**
```bash
docker-compose down -v
docker-compose up -d
```
