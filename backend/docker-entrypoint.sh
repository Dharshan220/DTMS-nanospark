#!/bin/sh
set -e

echo "DTMS Backend starting..."

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client (safety net)
echo "Generating Prisma Client..."
npx prisma generate

echo "Migrations complete. Starting server..."
exec node dist/main
