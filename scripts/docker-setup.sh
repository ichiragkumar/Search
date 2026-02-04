#!/bin/sh
set -e

echo "🚀 Setting up search service..."

# Wait for databases to be ready
echo "⏳ Waiting for PostgreSQL primary..."
until PGPASSWORD=postgres psql -h postgres-primary -U postgres -d search_db -c '\q' 2>/dev/null; do
  echo "   Primary database is unavailable - sleeping"
  sleep 2
done

echo "⏳ Waiting for PostgreSQL replica..."
until PGPASSWORD=postgres psql -h postgres-replica -U postgres -d search_db -c '\q' 2>/dev/null; do
  echo "   Replica database is unavailable - sleeping"
  sleep 2
done

echo "✅ Databases are ready!"

# Run Prisma migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

# Setup search index on primary
echo "🔍 Setting up search index on primary database..."
PGPASSWORD=postgres psql -h postgres-primary -U postgres -d search_db -f src/prisma/migrations/001_search_index_setup.sql || echo "⚠️  Search index setup may have already been applied"

# Setup search index on replica
echo "🔍 Setting up search index on replica database..."
PGPASSWORD=postgres psql -h postgres-replica -U postgres -d search_db -f src/prisma/migrations/001_search_index_setup.sql || echo "⚠️  Search index setup may have already been applied"

echo "✅ Setup complete!"
echo "🎉 Starting application..."

exec npm run dev
