#!/bin/bash
# Prisma setup script - bypasses WSL path issues

cd /home/saidk/AlternaGen/api

echo "🔧 Running Prisma Generate..."
node node_modules/prisma/build/index.js generate --schema=prisma/schema.prisma

echo "🔧 Running Prisma Migrate Deploy..."
node node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma

echo "✅ Prisma setup complete!"
